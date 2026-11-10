import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { lockIdentity } from "@/lib/server/identity-lock";
import { principalFor, type AuthenticatedUser } from "@/lib/server/session";
import {
  teamIds,
  publicListingWhere,
  propertyActor,
} from "@/modules/listings/access";
import { availabilitySchema } from "./validation";
const hour = 3600000;
async function agentsWhere(
  tx: Prisma.TransactionClient,
  actor: AuthenticatedUser,
): Promise<Prisma.UserWhereInput> {
  if (!principalFor(actor).permissions.includes("properties.manage"))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Accès réservé à l’équipe immobilière.",
    );
  return {
    status: "ACTIVE",
    role: { code: { in: ["COMMERCIAL", "DEFAULT_COMMERCIAL"] } },
    ...(actor.role.code === "SUPER_ADMIN"
      ? {}
      : { companyId: actor.companyId, id: { in: await teamIds(tx, actor) } }),
  };
}
export async function availabilityWorkspace(actor: AuthenticatedUser) {
  const agents = await getDb().user.findMany({
    where: await agentsWhere(getDb(), actor),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      availabilityEnabled: true,
      availabilitySlots: {
        where: { endsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 100,
      },
    },
    orderBy: { firstName: "asc" },
    take: 100,
  });
  return agents.map((a) => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
    enabled: a.availabilityEnabled,
    slots: a.availabilitySlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
  }));
}
export async function createAvailability(actorId: string, input: unknown) {
  const data = availabilitySchema.parse(input);
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId);
    const agent = await tx.user.findFirst({
      where: { AND: [await agentsWhere(tx, actor), { id: data.agentId }] },
    });
    if (!agent)
      throw new AppError(404, "NOT_FOUND", "Ce commercial est introuvable.");
    const startsAt = new Date(data.startsAt),
      endsAt = new Date(data.endsAt);
    if (
      await tx.availabilitySlot.findFirst({
        where: {
          agentId: agent.id,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      })
    )
      throw new AppError(
        409,
        "OVERLAP",
        "Cette plage chevauche une disponibilité existante.",
      );
    if (
      (await tx.availabilitySlot.count({
        where: { agentId: agent.id, endsAt: { gt: new Date() } },
      })) >= 100
    )
      throw new AppError(
        409,
        "LIMIT",
        "Cent plages actives maximum par commercial.",
      );
    const slot = await tx.availabilitySlot.create({
      data: { agentId: agent.id, startsAt, endsAt },
    });
    await tx.user.update({
      where: { id: agent.id },
      data: { availabilityEnabled: true },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        companyId: agent.companyId,
        action: "AVAILABILITY_CREATED",
        targetType: "AvailabilitySlot",
        targetId: slot.id,
      },
    });
    return { id: slot.id };
  });
}
export async function removeAvailability(actorId: string, id: string) {
  await getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId);
    const slot = await tx.availabilitySlot.findFirst({
      where: { id, agent: await agentsWhere(tx, actor) },
    });
    if (!slot)
      throw new AppError(
        404,
        "NOT_FOUND",
        "Cette disponibilité est introuvable.",
      );
    const booked = await tx.visitRequest.findFirst({
      where: {
        status: "CONFIRMED",
        listing: { property: { agentId: slot.agentId } },
        desiredAt: {
          gt: new Date(slot.startsAt.getTime() - hour),
          lt: slot.endsAt,
        },
      },
    });
    if (booked)
      throw new AppError(
        409,
        "BOOKED_SLOT",
        "Une visite confirmée utilise cette plage. Réorganisez d’abord le rendez-vous.",
      );
    await tx.availabilitySlot.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorId,
        companyId: actor.companyId,
        action: "AVAILABILITY_REMOVED",
        targetType: "AvailabilitySlot",
        targetId: id,
      },
    });
  });
}
export async function setAvailabilityMode(actorId: string, input: unknown) {
  const data = z
    .object({ agentId: z.string().min(1).max(100), enabled: z.boolean() })
    .strict()
    .parse(input);
  await getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId);
    const agent = await tx.user.findFirst({
      where: { AND: [await agentsWhere(tx, actor), { id: data.agentId }] },
    });
    if (!agent)
      throw new AppError(404, "NOT_FOUND", "Ce commercial est introuvable.");
    await tx.user.update({
      where: { id: agent.id },
      data: { availabilityEnabled: data.enabled },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        companyId: agent.companyId,
        action: "AVAILABILITY_MODE_CHANGED",
        targetType: "User",
        targetId: agent.id,
        metadata: { enabled: data.enabled },
      },
    });
  });
}
export async function assertVisitAvailability(
  tx: Prisma.TransactionClient,
  agentId: string | null,
  desiredAt: Date,
) {
  if (!agentId) return;
  const agent = await tx.user.findUnique({
    where: { id: agentId },
    select: { availabilityEnabled: true },
  });
  if (!agent?.availabilityEnabled) return;
  if (
    !(await tx.availabilitySlot.findFirst({
      where: {
        agentId,
        startsAt: { lte: desiredAt },
        endsAt: { gte: new Date(desiredAt.getTime() + hour) },
      },
    }))
  )
    throw new AppError(
      409,
      "AVAILABILITY_CHANGED",
      "Ce créneau n’est plus dans les disponibilités du commercial. Choisissez un autre horaire.",
    );
}
export async function publicAvailability(slug: string, viewerId?: string) {
  const listing = await getDb().listing.findFirst({
    where: { AND: [{ slug, isDemo: false }, publicListingWhere()] },
    select: {
      propertyId: true,
      property: {
        select: {
          agentId: true,
          agent: { select: { availabilityEnabled: true } },
        },
      },
    },
  });
  if (!listing)
    throw new AppError(
      404,
      "NOT_FOUND",
      "Ce bien n’est pas disponible pour une visite.",
    );
  if (!listing.property.agentId || !listing.property.agent?.availabilityEnabled)
    return { mode: "request" as const, slots: [] as string[] };
  const now = new Date(Date.now() + 30 * 60000),
    horizon = new Date(Date.now() + 90 * 86400000);
  const windows = await getDb().availabilitySlot.findMany({
    where: {
      agentId: listing.property.agentId,
      endsAt: { gt: now },
      startsAt: { lt: horizon },
    },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
  const confirmed = await getDb().visitRequest.findMany({
    where: {
      status: "CONFIRMED",
      desiredAt: {
        gt: new Date(now.getTime() - hour),
        lt: new Date(horizon.getTime() + hour),
      },
      OR: [
        { listing: { propertyId: listing.propertyId } },
        { listing: { property: { agentId: listing.property.agentId } } },
        ...(viewerId ? [{ userId: viewerId }] : []),
      ],
    },
    select: { desiredAt: true },
  });
  const slots: string[] = [];
  for (const window of windows)
    for (
      let start = window.startsAt.getTime();
      start + hour <= window.endsAt.getTime() &&
      start <= horizon.getTime() &&
      slots.length < 80;
      start += hour
    ) {
      if (
        start >= now.getTime() &&
        !confirmed.some((c) => Math.abs(c.desiredAt.getTime() - start) < hour)
      )
        slots.push(new Date(start).toISOString());
    }
  return { mode: "scheduled" as const, slots };
}
