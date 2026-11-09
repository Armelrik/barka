import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { lockIdentity } from "@/lib/server/identity-lock";
import {
  propertyScope,
  assertVersion,
  propertyActor,
  teamIds,
} from "@/modules/listings/access";
import { managedUserWhere } from "@/modules/identity/access";
import { principalFor, type AuthenticatedUser } from "@/lib/server/session";
export async function workspaceSummary(actor: AuthenticatedUser) {
  const db = getDb(),
    properties = await propertyScope(db, actor),
    userWhere = await managedUserWhere(actor);
  const [team, groups, visits, latest, agents] = await Promise.all([
    db.user.count({ where: userWhere }),
    db.listing.groupBy({
      by: ["status"],
      where: { property: properties },
      _count: { _all: true },
    }),
    db.visitRequest.count({
      where: { status: "REQUESTED", listing: { property: properties } },
    }),
    db.listing.findMany({
      where: { property: properties },
      select: {
        id: true,
        status: true,
        isDemo: true,
        updatedAt: true,
        property: {
          select: {
            title: true,
            reference: true,
            agent: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.user.findMany({
      where: {
        AND: [
          userWhere,
          { role: { code: { in: ["COMMERCIAL", "DEFAULT_COMMERCIAL"] } } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        _count: { select: { assignedProperties: { where: properties } } },
      },
      take: 8,
      orderBy: { firstName: "asc" },
    }),
  ]);
  return {
    team,
    groups,
    visits,
    latest,
    agents,
    total: groups.reduce((sum, g) => sum + g._count._all, 0),
    published: groups.find((g) => g.status === "PUBLISHED")?._count._all ?? 0,
    pending: groups
      .filter((g) => ["SUBMITTED", "VERIFYING"].includes(g.status))
      .reduce((sum, g) => sum + g._count._all, 0),
  };
}
export async function auditPage(actor: AuthenticatedUser, input: unknown) {
  if (!principalFor(actor).permissions.includes("settings.manage"))
    throw new AppError(403, "FORBIDDEN", "Accès réservé à l’administration.");
  const q = z
    .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
    .parse(input);
  const where =
    actor.role.code === "SUPER_ADMIN"
      ? {}
      : {
          companyId: actor.companyId,
          OR: [
            { actorId: { in: await teamIds(getDb(), actor) } },
            { actorId: null },
          ],
        };
  const [items, total] = await Promise.all([
    getDb().auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        targetType: true,
        createdAt: true,
        actor: { select: { firstName: true, lastName: true } },
        companyId: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 30,
      skip: (q.page - 1) * 30,
    }),
    getDb().auditLog.count({ where }),
  ]);
  return { items, total, page: q.page };
}
export async function readSettings(actor: AuthenticatedUser) {
  if (!principalFor(actor).permissions.includes("settings.manage"))
    throw new AppError(403, "FORBIDDEN", "Accès réservé à l’administration.");
  const row = await getDb().setting.findUnique({
    where: {
      companyId_key: {
        companyId: actor.companyId,
        key: "listing.revalidationDays",
      },
    },
  });
  return {
    revalidationDays: typeof row?.value === "number" ? row.value : 14,
    expectedUpdatedAt: row?.updatedAt.toISOString() ?? null,
  };
}
export async function saveSettings(actorId: string, input: unknown) {
  const data = z
    .object({
      revalidationDays: z.coerce.number().int().min(1).max(90),
      expectedUpdatedAt: z.iso.datetime().nullable(),
    })
    .strict()
    .parse(input);
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId, "settings.manage");
    const where = {
      companyId_key: {
        companyId: actor.companyId,
        key: "listing.revalidationDays",
      },
    };
    const row = await tx.setting.findUnique({ where });
    if (row && data.expectedUpdatedAt)
      assertVersion(row.updatedAt, data.expectedUpdatedAt);
    else if (!!row !== !!data.expectedUpdatedAt)
      throw new AppError(
        409,
        "STALE_UPDATE",
        "Le réglage a changé. Rechargez la page.",
      );
    await tx.setting.upsert({
      where,
      update: { value: data.revalidationDays },
      create: {
        companyId: actor.companyId,
        key: "listing.revalidationDays",
        value: data.revalidationDays,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        companyId: actor.companyId,
        action: "SETTING_UPDATED",
        targetType: "Setting",
        targetId: "listing.revalidationDays",
        metadata: { previous: row?.value ?? 14, value: data.revalidationDays },
      },
    });
  });
}
