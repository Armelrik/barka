import "server-only";
import { randomUUID } from "node:crypto";
import type { AuthenticatedUser } from "@/lib/server/session";
import { authUserSelect, currentUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { lockIdentity } from "@/lib/server/identity-lock";
import { adSchema, placements } from "./validation";
import { readUpload, processFile } from "@/modules/media/service";
import { putMedia, readMedia, removeMedia } from "@/modules/media/storage";
export function assertSuper(actor: AuthenticatedUser) {
  if (actor.role.code !== "SUPER_ADMIN" || actor.status !== "ACTIVE")
    throw new AppError(
      403,
      "FORBIDDEN",
      "Accès réservé au superadministrateur.",
    );
}
export const activeAdsWhere = () => ({
  active: true,
  startsAt: { lte: new Date() },
  endsAt: { gt: new Date() },
  placement: { in: [...placements] },
});
export async function publicAds() {
  const rows = await getDb().advertisement.findMany({
    where: activeAdsWhere(),
    select: {
      id: true,
      title: true,
      description: true,
      sponsorName: true,
      campaignKind: true,
      placement: true,
      targetUrl: true,
      imagePath: true,
      creativeId: true,
      cta: true,
      endsAt: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 60,
  });
  return rows.map((row) => ({
    ...row,
    targetUrl: row.targetUrl || "/biens",
    imageUrl: row.creativeId
      ? `/api/v1/advertisements/creatives/${row.creativeId}`
      : row.imagePath,
    endsAt: row.endsAt.toISOString(),
  }));
}
export type PublicAd = Awaited<ReturnType<typeof publicAds>>[number];
export async function manageAds(actor: AuthenticatedUser, page = 1) {
  assertSuper(actor);
  const [items, creatives, total] = await Promise.all([
    getDb().advertisement.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 20,
      skip: (page - 1) * 20,
    }),
    getDb().adCreative.findMany({
      select: { id: true, width: true, height: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getDb().advertisement.count(),
  ]);
  return {
    now: new Date().toISOString(),
    total,
    page,
    items: items.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
    })),
    creatives,
  };
}
export async function saveAd(
  actorId: string,
  input: unknown,
  id?: string,
  expectedUpdatedAt?: string,
) {
  const data = adSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: authUserSelect,
    });
    if (!actor) throw new AppError(401, "UNAUTHENTICATED", "Reconnectez-vous.");
    assertSuper(actor);
    const old = id
      ? await tx.advertisement.findUnique({ where: { id } })
      : null;
    if (id && !old)
      throw new AppError(404, "NOT_FOUND", "Campagne introuvable.");
    if (old && old.updatedAt.toISOString() !== expectedUpdatedAt)
      throw new AppError(
        409,
        "STALE_UPDATE",
        "La campagne a changé. Rechargez la page.",
      );
    if (
      data.creativeId &&
      !(await tx.adCreative.findUnique({ where: { id: data.creativeId } }))
    )
      throw new AppError(400, "CREATIVE_INVALID", "Visuel introuvable.");
    if (
      data.active &&
      (await tx.advertisement.count({
        where: {
          active: true,
          placement: data.placement,
          startsAt: { lt: new Date(data.endsAt) },
          endsAt: { gt: new Date(data.startsAt) },
          ...(id ? { id: { not: id } } : {}),
        },
      })) >= 20
    )
      throw new AppError(
        409,
        "AD_LIMIT",
        "Vingt campagnes simultanées maximum par emplacement.",
      );
    const row = old
      ? await tx.advertisement.update({
          where: { id },
          data: {
            ...data,
            startsAt: new Date(data.startsAt),
            endsAt: new Date(data.endsAt),
          },
        })
      : await tx.advertisement.create({
          data: {
            ...data,
            ownerId: actor.id,
            companyId: actor.companyId,
            startsAt: new Date(data.startsAt),
            endsAt: new Date(data.endsAt),
          },
        });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        companyId: actor.companyId,
        action: old ? "AD_UPDATED" : "AD_CREATED",
        targetType: "Advertisement",
        targetId: row.id,
        metadata: { placement: row.placement, active: row.active },
      },
    });
    return { id: row.id };
  });
}
export async function uploadCreative(
  actor: AuthenticatedUser,
  request: Request,
) {
  assertSuper(actor);
  const { file, kind } = await readUpload(request);
  if (kind !== "PHOTO")
    throw new AppError(
      400,
      "IMAGE_ONLY",
      "Choisissez une photographie ou une bannière.",
    );
  if (file.size > 4 * 1024 * 1024)
    throw new AppError(
      413,
      "FILE_TOO_LARGE",
      "Le visuel doit faire au maximum 4 Mo.",
    );
  const image = await processFile(file, "PHOTO"),
    id = randomUUID();
  if (!image.width || !image.height || image.width < 320 || image.height < 180)
    throw new AppError(
      400,
      "IMAGE_SIZE",
      "Le visuel doit mesurer au moins 320 × 180 pixels.",
    );
  const key = await putMedia(id, "jpg", image.body, image.mimeType);
  try {
    return await getDb().$transaction(async (tx) => {
      await lockIdentity(tx);
      const fresh = await tx.user.findUnique({
        where: { id: actor.id },
        select: authUserSelect,
      });
      if (!fresh)
        throw new AppError(401, "UNAUTHENTICATED", "Reconnectez-vous.");
      assertSuper(fresh);
      if ((await tx.adCreative.count()) >= 1000)
        throw new AppError(
          409,
          "CREATIVE_LIMIT",
          "La bibliothèque atteint sa limite de mille visuels.",
        );
      const row = await tx.adCreative.create({
        data: {
          id,
          ownerId: actor.id,
          objectKey: key,
          sizeBytes: image.body.length,
          width: image.width!,
          height: image.height!,
        },
      });
      return { id: row.id, url: `/api/v1/advertisements/creatives/${row.id}` };
    });
  } catch (e) {
    await removeMedia(key).catch(() => {});
    throw e;
  }
}
export async function creativeResponse(id: string) {
  const row = await getDb().adCreative.findUnique({ where: { id } });
  if (!row) throw new AppError(404, "NOT_FOUND", "Visuel introuvable.");
  if (
    !(await getDb().advertisement.findFirst({
      where: { ...activeAdsWhere(), creativeId: id },
      select: { id: true },
    }))
  ) {
    const actor = await currentUser();
    if (!actor || actor.role.code !== "SUPER_ADMIN")
      throw new AppError(404, "NOT_FOUND", "Visuel introuvable.");
  }
  return new Response(new Uint8Array(await readMedia(row.objectKey)), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
