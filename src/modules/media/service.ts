import "server-only";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import {
  currentUser,
  type AuthenticatedUser,
  principalFor,
} from "@/lib/server/session";
import { lockIdentity } from "@/lib/server/identity-lock";
import {
  propertyActor,
  scopedListing,
  propertyScope,
  publicListingWhere,
  teamIds,
  assertVersion,
} from "@/modules/listings/access";
import { touchDraft } from "@/modules/listings/service";
import { uploadKind, validateGlb } from "./validation";
import { putMedia, readMedia, removeMedia } from "./storage";
import { hostedMediaRelay } from "./limits";
export async function readUpload(request: Request) {
  const maximum = hostedMediaRelay()
    ? 4 * 1024 * 1024 + 65536
    : 33 * 1024 * 1024;
  const sizeMessage = hostedMediaRelay()
    ? "Le fichier dépasse la limite de 4 Mo de cet hébergement."
    : "Le fichier dépasse 32 Mo.";
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    throw new AppError(
      415,
      "CONTENT_TYPE",
      "Envoyez un fichier via le formulaire.",
    );
  const size = Number(request.headers.get("content-length"));
  if (size > maximum) throw new AppError(413, "FILE_TOO_LARGE", sizeMessage);
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(400, "FILE_REQUIRED", "Choisissez un fichier.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new AppError(413, "FILE_TOO_LARGE", sizeMessage);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = Buffer.concat(chunks);
  let form;
  try {
    form = await new Request("http://localhost/upload", {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type")! },
      body: buffer,
    }).formData();
  } catch {
    throw new AppError(
      400,
      "FILE_REQUIRED",
      "Le formulaire de fichier est invalide.",
    );
  }
  const file = form.get("file");
  if (!(file instanceof File) || form.getAll("file").length !== 1)
    throw new AppError(400, "FILE_REQUIRED", "Sélectionnez un seul fichier.");
  if (hostedMediaRelay() && file.size > 4 * 1024 * 1024)
    throw new AppError(413, "FILE_TOO_LARGE", sizeMessage);
  const kind = uploadKind.parse(form.get("kind"));
  const alt = z
    .string()
    .trim()
    .max(160)
    .parse(form.get("alt") ?? "");
  return { file, kind, alt };
}
export async function processFile(
  file: File,
  kind: z.infer<typeof uploadKind>,
) {
  const input = Buffer.from(await file.arrayBuffer());
  if (!input.length || input.length > 32 * 1024 * 1024)
    throw new AppError(
      413,
      "FILE_TOO_LARGE",
      "Le fichier est vide ou dépasse 32 Mo.",
    );
  if (kind === "MODEL_3D") {
    try {
      const model = validateGlb(input);
      let pixels = 0;
      for (const image of model.images ?? []) {
        const view = model.bufferViews?.[image.bufferView];
        if (!view) throw new Error("Texture absente.");
        const start = 28 + input.readUInt32LE(12) + (view.byteOffset ?? 0);
        const metadata = await sharp(
          input.subarray(start, start + view.byteLength),
          { limitInputPixels: 16777216 },
        ).metadata();
        if (
          !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
          (metadata.pages ?? 1) > 1 ||
          !metadata.width ||
          !metadata.height
        )
          throw new Error("Texture non prise en charge.");
        pixels += metadata.width * metadata.height;
        if (pixels > 33554432)
          throw new Error(
            "Les textures du modèle dépassent 32 mégapixels au total.",
          );
      }
    } catch (error) {
      throw new AppError(
        400,
        "GLB_INVALID",
        error instanceof Error ? error.message : "Modèle invalide.",
      );
    }
    return {
      body: input,
      mimeType: "model/gltf-binary",
      extension: "glb" as const,
      width: null,
      height: null,
    };
  }
  if (input.length > 16 * 1024 * 1024)
    throw new AppError(
      413,
      "FILE_TOO_LARGE",
      "Les images sont limitées à 16 Mo.",
    );
  try {
    const image = sharp(input, {
        limitInputPixels: 33554432,
        failOn: "warning",
      }),
      meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
      (meta.pages ?? 1) > 1 ||
      !meta.width ||
      !meta.height
    )
      throw new Error("Format non pris en charge");
    if (
      kind === "PANORAMA" &&
      (meta.width !== meta.height * 2 || meta.width < 2048 || meta.width > 8192)
    )
      throw new AppError(
        400,
        "PANORAMA_FORMAT",
        "Un panorama doit mesurer entre 2048 et 8192 pixels de large au ratio exact 2:1.",
      );
    const out = await image
      .rotate()
      .resize({
        width: kind === "PANORAMA" ? 8192 : 4096,
        height: kind === "PANORAMA" ? 4096 : 4096,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return {
      body: out.data,
      mimeType: "image/jpeg",
      extension: "jpg" as const,
      width: out.info.width,
      height: out.info.height,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      400,
      "IMAGE_INVALID",
      "Utilisez une image JPEG, PNG ou WebP valide, non animée, de 32 mégapixels maximum.",
    );
  }
}
export async function uploadPropertyMedia(
  actor: AuthenticatedUser,
  id: string,
  request: Request,
) {
  const before = await scopedListing(getDb(), actor, id);
  if (before.status === "ARCHIVED")
    throw new AppError(409, "ARCHIVED", "Ce dossier est archivé.");
  const { file, kind, alt } = await readUpload(request);
  if (kind === "IDENTITY")
    throw new AppError(
      400,
      "MEDIA_KIND",
      "Utilisez la vérification de votre profil pour les pièces d’identité.",
    );
  const processed = await processFile(file, kind),
    assetId = randomUUID(),
    key = await putMedia(
      assetId,
      processed.extension,
      processed.body,
      processed.mimeType,
    );
  try {
    return await getDb().$transaction(
      async (tx) => {
        await lockIdentity(tx);
        const fresh = await propertyActor(tx, actor.id),
          listing = await scopedListing(tx, fresh, id);
        assertVersion(listing.updatedAt, before.updatedAt.toISOString());
        if (
          (await tx.propertyMedia.count({
            where: { propertyId: listing.propertyId },
          })) +
            (await tx.propertyDocument.count({
              where: { propertyId: listing.propertyId },
            })) >=
          80
        )
          throw new AppError(
            409,
            "MEDIA_LIMIT",
            "Ce dossier atteint la limite de 80 médias.",
          );
        const asset = await tx.mediaAsset.create({
          data: {
            id: assetId,
            ownerId: actor.id,
            objectKey: key,
            kind,
            mimeType: processed.mimeType,
            sizeBytes: processed.body.length,
            status: "READY",
            width: processed.width,
            height: processed.height,
            checksum: createHash("sha256").update(processed.body).digest("hex"),
          },
        });
        if (kind === "LEGAL_DOCUMENT")
          await tx.propertyDocument.create({
            data: {
              propertyId: listing.propertyId,
              assetId: asset.id,
              kind: "FONCIER",
            },
          });
        else {
          const position = await tx.propertyMedia.count({
            where: { propertyId: listing.propertyId },
          });
          await tx.propertyMedia.create({
            data: {
              propertyId: listing.propertyId,
              assetId: asset.id,
              position,
              alt: alt || kind,
            },
          });
          if (kind === "FLOOR_PLAN")
            await tx.floorPlan.upsert({
              where: {
                propertyId_floor: { propertyId: listing.propertyId, floor: 0 },
              },
              create: {
                propertyId: listing.propertyId,
                assetId: asset.id,
                floor: 0,
              },
              update: { assetId: asset.id },
            });
        }
        await touchDraft(
          tx,
          id,
          "PROPERTY_MEDIA_ADDED",
          actor.id,
          listing.property.companyId,
        );
        return { id: asset.id, kind: asset.kind };
      },
      { timeout: 15000 },
    );
  } catch (error) {
    await removeMedia(key).catch(() => {});
    throw error;
  }
}
export async function deletePropertyMedia(
  actorId: string,
  id: string,
  assetId: string,
) {
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId),
      listing = await scopedListing(tx, actor, id);
    if (listing.status === "ARCHIVED")
      throw new AppError(409, "ARCHIVED", "Ce dossier est archivé.");
    const asset = await tx.mediaAsset.findFirst({
      where: {
        id: assetId,
        OR: [
          { propertyMedia: { some: { propertyId: listing.propertyId } } },
          { documents: { some: { propertyId: listing.propertyId } } },
        ],
      },
      select: { id: true },
    });
    if (!asset) throw new AppError(404, "NOT_FOUND", "Média introuvable.");
    if (
      (await tx.tourScene.count({ where: { assetId } })) ||
      (await tx.virtualTour.count({ where: { modelAssetId: assetId } }))
    )
      throw new AppError(
        409,
        "MEDIA_IN_USE",
        "Retirez ce média de la visite avant de le supprimer.",
      );
    await tx.floorPlan.deleteMany({
      where: { propertyId: listing.propertyId, assetId },
    });
    await tx.propertyMedia.deleteMany({
      where: { propertyId: listing.propertyId, assetId },
    });
    await tx.propertyDocument.deleteMany({
      where: { propertyId: listing.propertyId, assetId },
    });
    const remaining =
      (await tx.propertyMedia.count({ where: { assetId } })) +
      (await tx.propertyDocument.count({ where: { assetId } }));
    if (!remaining) {
      await tx.mediaAsset.update({
        where: { id: assetId },
        data: { status: "DELETED" },
      });
      await tx.outboxJob.upsert({
        where: { idempotencyKey: `media-delete:${assetId}` },
        create: {
          idempotencyKey: `media-delete:${assetId}`,
          kind: "MEDIA_DELETE",
          payload: { assetId },
        },
        update: {},
      });
    }
    await touchDraft(
      tx,
      id,
      "PROPERTY_MEDIA_REMOVED",
      actorId,
      listing.property.companyId,
    );
    return { removed: true };
  });
}
export async function mediaResponse(id: string) {
  const asset = await getDb().mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      kind: true,
      status: true,
      objectKey: true,
      mimeType: true,
      sizeBytes: true,
    },
  });
  if (!asset || asset.status !== "READY")
    throw new AppError(404, "NOT_FOUND", "Média introuvable.");
  let allowed = false;
  const sensitive = ["IDENTITY", "LEGAL_DOCUMENT"].includes(asset.kind);
  if (!sensitive)
    allowed = !!(await getDb().propertyMedia.findFirst({
      where: {
        assetId: id,
        property: { listings: { some: publicListingWhere() } },
      },
      select: { assetId: true },
    }));
  let actor: AuthenticatedUser | null = null;
  if (!allowed) {
    actor = await currentUser();
    if (actor?.id === asset.ownerId && asset.kind === "IDENTITY")
      allowed = true;
    else if (
      actor &&
      asset.kind === "IDENTITY" &&
      principalFor(actor).permissions.includes("identity.review")
    ) {
      const target = await getDb().user.findUnique({
        where: { id: asset.ownerId },
        select: { companyId: true },
      });
      allowed =
        actor.id !== asset.ownerId &&
        !!target &&
        (actor.role.code === "SUPER_ADMIN" ||
          (actor.companyId === target.companyId &&
            (await teamIds(getDb(), actor)).includes(asset.ownerId)));
    } else if (
      actor &&
      asset.kind !== "IDENTITY" &&
      principalFor(actor).permissions.includes("properties.manage")
    ) {
      const scope = await propertyScope(getDb(), actor);
      allowed = !!(await getDb().property.findFirst({
        where: {
          AND: [
            scope,
            {
              OR: [
                { media: { some: { assetId: id } } },
                { documents: { some: { assetId: id } } },
              ],
            },
          ],
        },
        select: { id: true },
      }));
    }
  }
  if (!allowed) throw new AppError(404, "NOT_FOUND", "Média introuvable.");
  if (sensitive && actor)
    await getDb().auditLog.create({
      data: {
        actorId: actor.id,
        companyId: actor.companyId,
        action: "PRIVATE_MEDIA_READ",
        targetType: "MediaAsset",
        targetId: id,
      },
    });
  if (hostedMediaRelay() && asset.sizeBytes > BigInt(4 * 1024 * 1024))
    throw new AppError(
      413,
      "HOST_MEDIA_LIMIT",
      "Ce média dépasse 4 Mo et nécessite un accès direct au stockage, non activé sur cet hébergement.",
    );
  const bytes = await readMedia(asset.objectKey);
  if (hostedMediaRelay() && bytes.length > 4 * 1024 * 1024)
    throw new AppError(
      413,
      "HOST_MEDIA_LIMIT",
      "Ce média dépasse la limite de cet hébergement.",
    );
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": sensitive
        ? 'inline; filename="document-prive.jpg"'
        : "inline",
      Vary: "Cookie",
    },
  });
}
export async function uploadIdentity(
  actor: AuthenticatedUser,
  request: Request,
) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.LEGAL_DOCUMENTS_APPROVED !== "true"
  )
    throw new AppError(
      503,
      "IDENTITY_COLLECTION_CLOSED",
      "Le traitement des pièces d’identité n’est pas encore ouvert sur cet environnement.",
    );
  const { file, kind } = await readUpload(request);
  if (kind !== "IDENTITY")
    throw new AppError(
      400,
      "MEDIA_KIND",
      "Choisissez une image de pièce d’identité.",
    );
  const profile = await getDb().agentProfile.findUnique({
    where: { userId: actor.id },
    select: { updatedAt: true },
  });
  if (!profile)
    throw new AppError(
      403,
      "AGENT_PROFILE",
      "Ce compte ne possède pas de profil démarcheur.",
    );
  const processed = await processFile(file, kind),
    id = randomUUID(),
    key = await putMedia(
      id,
      processed.extension,
      processed.body,
      processed.mimeType,
    );
  try {
    return await getDb().$transaction(async (tx) => {
      await lockIdentity(tx);
      const user = await tx.user.findUnique({
          where: { id: actor.id },
          select: { status: true, companyId: true },
        }),
        current = await tx.agentProfile.findUniqueOrThrow({
          where: { userId: actor.id },
        });
      if (user?.status !== "ACTIVE")
        throw new AppError(401, "UNAUTHENTICATED", "Reconnectez-vous.");
      assertVersion(current.updatedAt, profile.updatedAt.toISOString());
      await tx.mediaAsset.create({
        data: {
          id,
          ownerId: actor.id,
          objectKey: key,
          kind,
          mimeType: processed.mimeType,
          sizeBytes: processed.body.length,
          status: "READY",
          width: processed.width,
          height: processed.height,
          checksum: createHash("sha256").update(processed.body).digest("hex"),
        },
      });
      await tx.agentProfile.update({
        where: { userId: actor.id },
        data: {
          identityAssetId: id,
          verification: "PENDING",
          verifiedAt: null,
        },
      });
      if (current.identityAssetId) {
        await tx.mediaAsset.update({
          where: { id: current.identityAssetId },
          data: { status: "DELETED" },
        });
        await tx.outboxJob.upsert({
          where: { idempotencyKey: `media-delete:${current.identityAssetId}` },
          create: {
            idempotencyKey: `media-delete:${current.identityAssetId}`,
            kind: "MEDIA_DELETE",
            payload: { assetId: current.identityAssetId },
          },
          update: {},
        });
      }
      await tx.listing.updateMany({
        where: {
          property: { agentId: actor.id },
          status: { in: ["PUBLISHED", "APPROVED"] },
        },
        data: { status: "SUSPENDED", expiresAt: null },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          companyId: user.companyId,
          action: "IDENTITY_SUBMITTED",
          targetType: "AgentProfile",
          targetId: current.id,
        },
      });
      return { submitted: true };
    });
  } catch (error) {
    await removeMedia(key).catch(() => {});
    throw error;
  }
}
export async function identityQueue(actor: AuthenticatedUser) {
  if (!principalFor(actor).permissions.includes("identity.review"))
    throw new AppError(403, "FORBIDDEN", "Accès refusé.");
  return getDb().agentProfile.findMany({
    where: {
      verification: "PENDING",
      user: {
        id: {
          not: actor.id,
          ...(actor.role.code === "SUPER_ADMIN"
            ? {}
            : { in: await teamIds(getDb(), actor) }),
        },
        ...(actor.role.code === "SUPER_ADMIN"
          ? {}
          : { companyId: actor.companyId }),
      },
    },
    select: {
      userId: true,
      identifier: true,
      updatedAt: true,
      identityAssetId: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });
}
export async function reviewIdentity(
  actorId: string,
  userId: string,
  input: unknown,
) {
  const d = z
    .object({
      approve: z.boolean(),
      reason: z.string().trim().min(5).max(500),
      expectedUpdatedAt: z.iso.datetime({ offset: true }),
    })
    .strict()
    .parse(input);
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await propertyActor(tx, actorId, "identity.review");
    if (
      userId === actor.id ||
      (actor.role.code !== "SUPER_ADMIN" &&
        !(await teamIds(tx, actor)).includes(userId))
    )
      throw new AppError(404, "NOT_FOUND", "Profil introuvable.");
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: {
        companyId: true,
        status: true,
        agentProfile: { include: { identityAsset: true } },
      },
    });
    if (
      !target?.agentProfile ||
      (actor.role.code !== "SUPER_ADMIN" &&
        target.companyId !== actor.companyId)
    )
      throw new AppError(404, "NOT_FOUND", "Profil introuvable.");
    const p = target.agentProfile;
    assertVersion(p.updatedAt, d.expectedUpdatedAt);
    if (
      target.status !== "ACTIVE" ||
      p.verification !== "PENDING" ||
      p.identityAsset?.kind !== "IDENTITY" ||
      p.identityAsset.status !== "READY"
    )
      throw new AppError(
        409,
        "IDENTITY_NOT_READY",
        "Ce profil ne peut pas être vérifié dans son état actuel.",
      );
    await tx.agentProfile.update({
      where: { id: p.id },
      data: {
        verification: d.approve ? "VERIFIED" : "REJECTED",
        verifiedAt: d.approve ? new Date() : null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        companyId: target.companyId,
        action: d.approve ? "IDENTITY_APPROVED" : "IDENTITY_REJECTED",
        targetType: "AgentProfile",
        targetId: p.id,
        metadata: { reason: d.reason },
      },
    });
    return { reviewed: true };
  });
}
