import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  authUserSelect,
  principalFor,
  type AuthenticatedUser,
} from "@/lib/server/session";
import { AppError } from "@/lib/server/errors";
export type Tx = Prisma.TransactionClient;
export async function propertyActor(
  tx: Tx,
  id: string,
  permission = "properties.manage",
) {
  const actor = await tx.user.findUnique({
    where: { id },
    select: authUserSelect,
  });
  if (!actor || actor.status !== "ACTIVE")
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Reconnectez-vous pour continuer.",
    );
  if (!principalFor(actor).permissions.includes(permission))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Vous n’avez pas accès à cette opération.",
    );
  return actor;
}
export async function teamIds(tx: Tx, actor: AuthenticatedUser) {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`WITH RECURSIVE team(id,path) AS (SELECT h."childId",ARRAY[${actor.id},h."childId"] FROM "UserHierarchy" h JOIN "User" u ON u.id=h."childId" WHERE h."parentId"=${actor.id} AND u."companyId"=${actor.companyId} UNION ALL SELECT h."childId",team.path||h."childId" FROM team JOIN "UserHierarchy" h ON h."parentId"=team.id JOIN "User" u ON u.id=h."childId" WHERE u."companyId"=${actor.companyId} AND NOT h."childId"=ANY(team.path) AND cardinality(team.path)<8) SELECT DISTINCT id FROM team`;
  return [actor.id, ...rows.map((r) => r.id)];
}
export async function propertyScope(
  tx: Tx,
  actor: AuthenticatedUser,
): Promise<Prisma.PropertyWhereInput> {
  if (!principalFor(actor).permissions.includes("properties.manage"))
    throw new AppError(403, "FORBIDDEN", "Vous n’avez pas accès aux biens.");
  if (actor.role.code === "SUPER_ADMIN") return {};
  const ids = await teamIds(tx, actor);
  return {
    companyId: actor.companyId,
    OR: [
      { agentId: { in: ids } },
      { listings: { some: { authorId: { in: ids } } } },
    ],
  };
}
export const publicListingWhere = (): Prisma.ListingWhereInput => ({
  status: "PUBLISHED",
  expiresAt: { gt: new Date() },
  author: { status: "ACTIVE" },
  property: {
    agent: {
      status: "ACTIVE",
      role: { code: { in: ["COMMERCIAL", "DEFAULT_COMMERCIAL"] } },
    },
  },
  OR: [
    {
      isDemo: false,
      property: {
        agent: {
          agentProfile: {
            verification: "VERIFIED",
            identityAsset: { status: "READY", kind: "IDENTITY" },
          },
        },
      },
    },
    {
      isDemo: true,
      property: {
        company: { code: "BARKA-DEMO" },
        details: { path: ["fictitious"], equals: true },
      },
    },
  ],
});
export async function scopedListing(
  tx: Tx,
  actor: AuthenticatedUser,
  id: string,
) {
  const where = await propertyScope(tx, actor);
  const listing = await tx.listing.findFirst({
    where: { id, property: where },
    include: {
      property: {
        include: {
          agent: {
            select: {
              id: true,
              status: true,
              role: { select: { code: true } },
              agentProfile: {
                select: {
                  verification: true,
                  identityAsset: { select: { status: true, kind: true } },
                },
              },
            },
          },
          owners: { select: { ownerId: true } },
        },
      },
    },
  });
  if (!listing)
    throw new AppError(404, "NOT_FOUND", "Ce bien est introuvable.");
  return listing;
}
export function assertVersion(actual: Date, expected: string) {
  if (actual.getTime() !== new Date(expected).getTime())
    throw new AppError(
      409,
      "STALE_UPDATE",
      "Le dossier a changé. Rechargez-le avant d’enregistrer.",
    );
}
