import "server-only";
import { Prisma, type RoleCode } from "@/generated/prisma/client";
import { roleLevels, canManageUser } from "./policy";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { principalFor, type AuthenticatedUser } from "@/lib/server/session";

export async function descendantIds(user: AuthenticatedUser) {
  const rows = await getDb().$queryRaw<{ id: string }[]>`
    WITH RECURSIVE team (id, path) AS (
      SELECT h."childId", ARRAY[${user.id}, h."childId"]
      FROM "UserHierarchy" h JOIN "User" u ON u.id = h."childId"
      WHERE h."parentId" = ${user.id} AND u."companyId" = ${user.companyId}
      UNION ALL
      SELECT h."childId", team.path || h."childId"
      FROM team JOIN "UserHierarchy" h ON h."parentId" = team.id
      JOIN "User" u ON u.id = h."childId"
      WHERE u."companyId" = ${user.companyId} AND NOT h."childId" = ANY(team.path) AND cardinality(team.path) < 8
    ) SELECT DISTINCT id FROM team
  `;
  return rows.map((row) => row.id);
}
export async function managedUserWhere(
  user: AuthenticatedUser,
): Promise<Prisma.UserWhereInput> {
  if (!principalFor(user).permissions.includes("users.manage"))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Vous n’avez pas accès aux utilisateurs.",
    );
  const codes = (Object.keys(roleLevels) as RoleCode[]).filter(
    (code) =>
      roleLevels[code] < roleLevels[user.role.code] && code !== "VISITOR",
  );
  return {
    id: {
      not: user.id,
      ...(user.role.code === "SUPER_ADMIN"
        ? {}
        : { in: await descendantIds(user) }),
    },
    role: { code: { in: codes } },
    ...(user.role.code === "SUPER_ADMIN" ? {} : { companyId: user.companyId }),
  };
}
export const managedUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  role: { select: { code: true } },
} satisfies Prisma.UserSelect;
export async function listManagedUsers(user: AuthenticatedUser, page = 1) {
  const where = await managedUserWhere(user);
  const [items, total] = await Promise.all([
    getDb().user.findMany({
      where,
      select: managedUserSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      skip: (page - 1) * 20,
    }),
    getDb().user.count({ where }),
  ]);
  return { items, total, page, pageSize: 20 };
}
export async function managedUserById(actor: AuthenticatedUser, id: string) {
  const where = await managedUserWhere(actor);
  const target = await getDb().user.findFirst({
    where: { AND: [where, { id }] },
    select: {
      ...managedUserSelect,
      companyId: true,
      company: { select: { countryId: true } },
    },
  });
  if (
    !target ||
    !canManageUser(
      principalFor(actor),
      {
        id: target.id,
        companyId: target.companyId,
        countryId: target.company.countryId,
        role: target.role.code,
      },
      new Set([target.id]),
    )
  )
    throw new AppError(404, "NOT_FOUND", "Cet utilisateur est introuvable.");
  // Project to a DTO; no company object, hashes or private document keys leave this service.
  return {
    id: target.id,
    firstName: target.firstName,
    lastName: target.lastName,
    phone: target.phone,
    email: target.email,
    status: target.status,
    role: target.role.code,
    createdAt: target.createdAt,
  };
}
