import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import {
  authUserSelect,
  principalFor,
  type AuthenticatedUser,
} from "@/lib/server/session";
import { lockIdentity } from "@/lib/server/identity-lock";
import {
  propertyScope,
  publicListingWhere,
  assertVersion,
} from "@/modules/listings/access";
import {
  visitRequestSchema,
  visitActionSchema,
  visitQuerySchema,
  validVisitDate,
  visitTransition,
  visitDurationMs,
} from "./validation";
const select = {
  id: true,
  desiredAt: true,
  status: true,
  message: true,
  reply: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: { select: { firstName: true, lastName: true } },
  listing: {
    select: {
      slug: true,
      property: { select: { id: true, title: true, reference: true } },
    },
  },
} satisfies Prisma.VisitRequestSelect;
type Row = Prisma.VisitRequestGetPayload<{ select: typeof select }>;
function dto(row: Row, actorId: string, team: boolean) {
  return {
    id: row.id,
    desiredAt: row.desiredAt.toISOString(),
    status: row.status,
    message: row.message ?? "",
    reply: row.reply ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    title: row.listing.property.title,
    reference: row.listing.property.reference,
    slug: row.listing.slug,
    requester: team ? `${row.user.firstName} ${row.user.lastName}` : undefined,
    own: row.userId === actorId,
  };
}
export type VisitDto = ReturnType<typeof dto>;
async function actorFor(tx: Prisma.TransactionClient, id: string) {
  const user = await tx.user.findUnique({
    where: { id },
    select: authUserSelect,
  });
  if (!user || user.status !== "ACTIVE")
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Reconnectez-vous pour continuer.",
    );
  return user;
}
export async function requestVisit(actorId: string, input: unknown) {
  const data = visitRequestSchema.parse(input);
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await actorFor(tx, actorId);
      const desiredAt = new Date(data.desiredAt);
      if (!validVisitDate(desiredAt))
        throw new AppError(
          400,
          "VISIT_DATE",
          "Choisissez un horaire entre 30 minutes et 90 jours à partir de maintenant.",
        );
      const listing = await tx.listing.findFirst({
        where: { slug: data.slug, ...publicListingWhere() },
        select: {
          id: true,
          authorId: true,
          property: {
            select: {
              companyId: true,
              agentId: true,
              owners: { select: { ownerId: true } },
            },
          },
        },
      });
      if (!listing)
        throw new AppError(
          404,
          "NOT_FOUND",
          "Cette annonce n’est plus disponible pour une visite.",
        );
      if (
        listing.authorId === actor.id ||
        listing.property.agentId === actor.id ||
        listing.property.owners.some((o) => o.ownerId === actor.id)
      )
        throw new AppError(
          409,
          "OWN_LISTING",
          "Vous gérez déjà ce bien depuis votre espace professionnel.",
        );
      const existing = await tx.visitRequest.findFirst({
        where: {
          userId: actor.id,
          listingId: listing.id,
          status: { in: ["REQUESTED", "CONFIRMED"] },
        },
      });
      if (existing)
        throw new AppError(
          409,
          "VISIT_EXISTS",
          "Vous avez déjà une demande en cours pour ce bien. Retrouvez-la dans Mes visites.",
        );
      const active = await tx.visitRequest.count({
        where: { userId: actor.id, status: { in: ["REQUESTED", "CONFIRMED"] } },
      });
      if (active >= 10)
        throw new AppError(
          409,
          "VISIT_LIMIT",
          "Vous avez déjà dix demandes en cours. Clôturez une demande avant d’en ajouter une.",
        );
      const row = await tx.visitRequest.create({
        data: {
          listingId: listing.id,
          userId: actor.id,
          desiredAt,
          message: data.message || null,
        },
        select,
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          companyId: listing.property.companyId,
          action: "VISIT_REQUESTED",
          targetType: "VisitRequest",
          targetId: row.id,
          metadata: { listingId: listing.id },
        },
      });
      return dto(row, actor.id, false);
    },
    { timeout: 15000 },
  );
}
export async function listVisits(actor: AuthenticatedUser, input: unknown) {
  const q = visitQuerySchema.parse(input),
    team = q.view === "team";
  const where: Prisma.VisitRequestWhereInput = {
    ...(team
      ? { listing: { property: await propertyScope(getDb(), actor) } }
      : { userId: actor.id }),
    ...(q.status ? { status: q.status } : {}),
  };
  const [rows, total] = await Promise.all([
    getDb().visitRequest.findMany({
      where,
      select,
      orderBy: [{ desiredAt: "desc" }, { id: "asc" }],
      skip: (q.page - 1) * 20,
      take: 20,
    }),
    getDb().visitRequest.count({ where }),
  ]);
  return {
    items: rows.map((row) => dto(row, actor.id, team)),
    total,
    page: q.page,
    pageSize: 20,
  };
}
export async function changeVisit(actorId: string, id: string, input: unknown) {
  const data = visitActionSchema.parse(input);
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await actorFor(tx, actorId);
      const scope = principalFor(actor).permissions.includes(
        "properties.manage",
      )
        ? await propertyScope(tx, actor)
        : null;
      const row = await tx.visitRequest.findFirst({
        where: {
          id,
          OR: [
            { userId: actor.id },
            ...(scope ? [{ listing: { property: scope } }] : []),
          ],
        },
        include: {
          listing: {
            select: {
              id: true,
              propertyId: true,
              property: { select: { companyId: true, agentId: true } },
            },
          },
        },
      });
      if (!row)
        throw new AppError(404, "NOT_FOUND", "Cette demande est introuvable.");
      assertVersion(row.updatedAt, data.expectedUpdatedAt);
      const own = row.userId === actor.id;
      if (!visitTransition(row.status, data.action, own, row.desiredAt))
        throw new AppError(
          409,
          "VISIT_TRANSITION",
          "Cette action n’est plus possible. Rechargez la liste des visites.",
        );
      if (
        !own &&
        ["REJECT", "CANCEL"].includes(data.action) &&
        data.reply.length < 5
      )
        throw new AppError(
          400,
          "REPLY_REQUIRED",
          "Indiquez au client un motif d’au moins cinq caractères.",
        );
      if (data.action === "CONFIRM") {
        const available = await tx.listing.findFirst({
          where: { id: row.listingId, ...publicListingWhere() },
          select: { id: true },
        });
        const requester = await tx.user.findUnique({
          where: { id: row.userId },
          select: { status: true },
        });
        if (!available || requester?.status !== "ACTIVE")
          throw new AppError(
            409,
            "UNAVAILABLE",
            "L’annonce ou le compte demandeur n’est plus disponible.",
          );
        // Visits last one hour. Adjacent appointments do not overlap. All confirmations share the identity lock.
        const conflict = await tx.visitRequest.findFirst({
          where: {
            id: { not: id },
            status: "CONFIRMED",
            desiredAt: {
              gt: new Date(row.desiredAt.getTime() - visitDurationMs),
              lt: new Date(row.desiredAt.getTime() + visitDurationMs),
            },
            OR: [
              { userId: row.userId },
              { listing: { propertyId: row.listing.propertyId } },
              ...(row.listing.property.agentId
                ? [
                    {
                      listing: {
                        property: { agentId: row.listing.property.agentId },
                      },
                    },
                  ]
                : []),
            ],
          },
          select: { id: true },
        });
        if (conflict)
          throw new AppError(
            409,
            "VISIT_CONFLICT",
            "Ce créneau d’une heure entre en conflit avec une visite confirmée. Demandez un autre horaire au client.",
          );
      }
      const status = (
        {
          CONFIRM: "CONFIRMED",
          REJECT: "REJECTED",
          CANCEL: "CANCELLED",
          COMPLETE: "COMPLETED",
        } as const
      )[data.action];
      const updated = await tx.visitRequest.update({
        where: { id },
        data: { status, ...(!own ? { reply: data.reply || row.reply } : {}) },
        select,
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          companyId: row.listing.property.companyId,
          action: `VISIT_${status}`,
          targetType: "VisitRequest",
          targetId: id,
          metadata: { previousStatus: row.status, status },
        },
      });
      return dto(updated, actor.id, !own);
    },
    { timeout: 15000 },
  );
}
