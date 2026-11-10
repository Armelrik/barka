import { categoryTypes, validPriceRange } from "@/modules/catalog/query";
import {
  mergeNeighborhoods,
  neighborhoodVariants,
} from "@/modules/catalog/locations";
import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type PropertyType } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { lockIdentity } from "@/lib/server/identity-lock";
import { AppError } from "@/lib/server/errors";
import { principalFor, type AuthenticatedUser } from "@/lib/server/session";
import {
  propertyActor,
  propertyScope,
  scopedListing,
  teamIds,
  assertVersion,
  publicListingWhere,
  type Tx,
} from "./access";
import {
  propertySchema,
  propertyUpdateSchema,
  listingActionSchema,
  listingQuerySchema,
  publicQuerySchema,
} from "./validation";
import { transitions, nextStatus } from "./policy";
import { tourSchema, type TourDto } from "@/modules/tours/validation";
const include = {
  property: {
    include: {
      location: { include: { parent: { include: { parent: true } } } },
      media: {
        include: { asset: true },
        orderBy: { position: "asc" as const },
      },
      documents: { include: { asset: true } },
      floorPlans: { include: { asset: true } },
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          agentProfile: { select: { verification: true } },
        },
      },
      tours: {
        include: {
          modelAsset: true,
          scenes: {
            orderBy: { position: "asc" as const },
            include: { asset: true, hotspots: true },
          },
        },
      },
    },
  },
  validations: {
    orderBy: { createdAt: "desc" as const },
    take: 30,
    select: {
      id: true,
      action: true,
      reason: true,
      createdAt: true,
      actor: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ListingInclude;
type Full = Prisma.ListingGetPayload<{ include: typeof include }>;
const url = (id: string) => `/api/v1/media/${id}`;
export function listingDto(row: Full) {
  const p = row.property;
  return {
    id: row.id,
    slug: row.slug,
    isDemo: row.isDemo,
    title: p.title,
    description: row.isDemo
      ? p.description.replace(/exemple fictif/gi, "Bien de présentation")
      : p.description,
    type: p.type,
    furnishing: p.furnishing,
    rentalDuration: row.offer === "RENT" ? p.rentalDuration : null,
    rentPricePeriod: p.rentPricePeriod,
    offer: row.offer,
    priceXof: row.priceXof,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    companyId: p.companyId,
    locationId: p.locationId,
    locationName: p.location.name,
    agentId: p.agentId,
    agentName: p.agent ? `${p.agent.firstName} ${p.agent.lastName}` : "",
    verification: p.agent?.agentProfile?.verification ?? "UNVERIFIED",
    surfaceM2: Number(p.surfaceM2),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    livingRooms: p.livingRooms,
    garageSpaces: p.garageSpaces,
    legalStatus: p.legalStatus ?? "",
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    showMap: !!(
      p.details &&
      typeof p.details === "object" &&
      !Array.isArray(p.details) &&
      p.details.showMap
    ),
    reference: p.reference,
    floorPlanAssetId: p.floorPlans[0]?.assetId ?? null,
    media: p.media
      .filter((m) => m.asset.status === "READY")
      .map((m) => ({
        id: m.asset.id,
        kind: m.asset.kind,
        alt: m.alt,
        url: url(m.asset.id),
        width: m.asset.width,
        height: m.asset.height,
      })),
    documents: p.documents
      .filter((m) => m.asset.status === "READY")
      .map((m) => ({ id: m.asset.id, kind: m.kind, url: url(m.asset.id) })),
    tours: p.tours.map((t) => ({
      id: t.id,
      title: t.title,
      kind: t.kind,
      modelAssetId: t.modelAssetId,
      scenes: t.scenes.map((s) => ({
        key: s.id,
        title: s.title,
        assetId: s.assetId,
        initialYaw: s.initialYaw,
        initialPitch: s.initialPitch,
        planX: s.planX,
        planY: s.planY,
        hotspots: s.hotspots.map((h) => ({
          label: h.label,
          targetKey: h.targetSceneId,
          yaw: h.yaw,
          pitch: h.pitch,
        })),
      })),
    })),
    validations: row.validations.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      actorName: `${v.actor.firstName} ${v.actor.lastName}`,
      actor: undefined,
    })),
  };
}
export type ListingDto = ReturnType<typeof listingDto>;
export async function getPrivateListing(actor: AuthenticatedUser, id: string) {
  return getDb().$transaction(async (tx) => {
    const scoped = await scopedListing(tx, actor, id);
    return {
      ...listingDto(
        await tx.listing.findUniqueOrThrow({ where: { id }, include }),
      ),
      canModerate:
        principalFor(actor).permissions.includes("listings.moderate") &&
        scoped.authorId !== actor.id &&
        scoped.property.agentId !== actor.id &&
        !scoped.property.owners.some((o) => o.ownerId === actor.id),
    };
  });
}
export async function listPrivateListings(
  actor: AuthenticatedUser,
  input: unknown,
) {
  const q = listingQuerySchema.parse(input),
    scope = await propertyScope(getDb(), actor);
  const where: Prisma.ListingWhereInput = {
    property: {
      AND: [
        scope,
        ...(q.q
          ? [
              {
                OR: [
                  { title: { contains: q.q, mode: "insensitive" as const } },
                  {
                    reference: { contains: q.q, mode: "insensitive" as const },
                  },
                ],
              },
            ]
          : []),
      ],
    },
    ...(q.status ? { status: q.status } : {}),
  };
  const [items, total] = await Promise.all([
    getDb().listing.findMany({
      where,
      include,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 20,
      skip: (q.page - 1) * 20,
    }),
    getDb().listing.count({ where }),
  ]);
  return { items: items.map(listingDto), total, page: q.page, pageSize: 20 };
}
async function assignment(
  tx: Tx,
  actor: AuthenticatedUser,
  companyId: string,
  agentId: string,
  locationId: string,
) {
  if (actor.role.code !== "SUPER_ADMIN" && companyId !== actor.companyId)
    throw new AppError(
      403,
      "COMPANY_FORBIDDEN",
      "Cette société n’appartient pas à votre périmètre.",
    );
  const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { countryId: true },
    }),
    agent = await tx.user.findUnique({
      where: { id: agentId },
      select: {
        status: true,
        companyId: true,
        role: { select: { code: true } },
      },
    }),
    location = await tx.location.findUnique({
      where: { id: locationId },
      select: { countryId: true },
    });
  if (
    !company ||
    !agent ||
    agent.companyId !== companyId ||
    agent.status !== "ACTIVE" ||
    !["COMMERCIAL", "DEFAULT_COMMERCIAL"].includes(agent.role.code) ||
    !location ||
    location.countryId !== company.countryId
  )
    throw new AppError(
      400,
      "ASSIGNMENT_INVALID",
      "Choisissez un commercial actif et une localité du pays de la société.",
    );
  if (
    actor.role.code !== "SUPER_ADMIN" &&
    !(await teamIds(tx, actor)).includes(agentId)
  )
    throw new AppError(
      403,
      "ASSIGNMENT_FORBIDDEN",
      "Ce commercial n’appartient pas à votre équipe.",
    );
}
function stamp(date?: Date) {
  return new Date(Math.max(Date.now(), (date?.getTime() ?? 0) + 1));
}
export async function touchDraft(
  tx: Tx,
  id: string,
  action: string,
  actorId: string,
  companyId: string,
  reason?: string,
) {
  const current = await tx.listing.findUniqueOrThrow({
    where: { id },
    select: { updatedAt: true },
  });
  await tx.listing.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      expiresAt: null,
      updatedAt: stamp(current.updatedAt),
    },
  });
  await tx.listingValidation.create({
    data: { listingId: id, actorId, action, reason },
  });
  await tx.auditLog.create({
    data: { actorId, companyId, action, targetType: "Listing", targetId: id },
  });
}
export async function createProperty(actorId: string, input: unknown) {
  const d = propertySchema.parse(input);
  if (
    (d.latitude === null) !== (d.longitude === null) ||
    (d.showMap && d.latitude === null)
  )
    throw new AppError(
      400,
      "COORDINATES_INVALID",
      "Renseignez les deux coordonnées pour activer la carte.",
    );
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await propertyActor(tx, actorId),
        companyId = d.companyId ?? actor.companyId;
      await assignment(tx, actor, companyId, d.agentId, d.locationId);
      const suffix = randomUUID();
      const property = await tx.property.create({
        data: {
          reference: `BARKA-${new Date().getUTCFullYear()}-${suffix.slice(0, 8).toUpperCase()}`,
          companyId,
          agentId: d.agentId,
          locationId: d.locationId,
          title: d.title,
          description: d.description,
          type: d.type,
          furnishing: d.furnishing,
          rentalDuration: d.offer === "RENT" ? d.rentalDuration : null,
          rentPricePeriod: d.rentPricePeriod,
          surfaceM2: d.surfaceM2,
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          livingRooms: d.livingRooms,
          garageSpaces: d.garageSpaces,
          latitude: d.latitude,
          longitude: d.longitude,
          details: { showMap: d.showMap },
          legalStatus: d.legalStatus || null,
        },
      });
      const slug = `${
        d.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100) || "bien"
      }-${suffix.slice(0, 8)}`;
      const row = await tx.listing.create({
        data: {
          propertyId: property.id,
          authorId: actor.id,
          slug,
          offer: d.offer,
          priceXof: d.priceXof,
          paymentPeriod: d.offer === "RENT" ? "MONTHLY" : null,
        },
        include,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          companyId,
          action: "PROPERTY_CREATED",
          targetType: "Listing",
          targetId: row.id,
        },
      });
      return listingDto(row);
    },
    { timeout: 15000 },
  );
}
export async function updateProperty(
  actorId: string,
  id: string,
  input: unknown,
) {
  const d = propertyUpdateSchema.parse(input);
  if (
    (d.latitude === null) !== (d.longitude === null) ||
    (d.showMap && d.latitude === null)
  )
    throw new AppError(
      400,
      "COORDINATES_INVALID",
      "Renseignez les deux coordonnées pour activer la carte.",
    );
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await propertyActor(tx, actorId),
        row = await scopedListing(tx, actor, id);
      assertVersion(row.updatedAt, d.expectedUpdatedAt);
      if (row.status === "ARCHIVED")
        throw new AppError(409, "ARCHIVED", "Ce dossier est archivé.");
      await assignment(
        tx,
        actor,
        row.property.companyId,
        d.agentId,
        d.locationId,
      );
      await tx.property.update({
        where: { id: row.propertyId },
        data: {
          agentId: d.agentId,
          locationId: d.locationId,
          title: d.title,
          description: d.description,
          type: d.type,
          furnishing: d.furnishing,
          rentalDuration: d.offer === "RENT" ? d.rentalDuration : null,
          rentPricePeriod: d.rentPricePeriod,
          surfaceM2: d.surfaceM2,
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          livingRooms: d.livingRooms,
          garageSpaces: d.garageSpaces,
          latitude: d.latitude,
          longitude: d.longitude,
          details: {
            ...(row.property.details &&
            typeof row.property.details === "object" &&
            !Array.isArray(row.property.details)
              ? row.property.details
              : {}),
            showMap: d.showMap,
          },
          legalStatus: d.legalStatus || null,
        },
      });
      await tx.listing.update({
        where: { id },
        data: {
          offer: d.offer,
          priceXof: d.priceXof,
          paymentPeriod: d.offer === "RENT" ? "MONTHLY" : null,
        },
      });
      await touchDraft(
        tx,
        id,
        "PROPERTY_UPDATED",
        actor.id,
        row.property.companyId,
      );
      return listingDto(
        await tx.listing.findUniqueOrThrow({ where: { id }, include }),
      );
    },
    { timeout: 15000 },
  );
}
export async function listingAction(
  actorId: string,
  id: string,
  input: unknown,
) {
  const d = listingActionSchema.parse(input);
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await propertyActor(tx, actorId),
        row = await scopedListing(tx, actor, id);
      assertVersion(row.updatedAt, d.expectedUpdatedAt);
      if (!transitions[d.action].includes(row.status))
        throw new AppError(
          409,
          "INVALID_TRANSITION",
          "Cette action n’est pas disponible dans l’état actuel du dossier.",
        );
      const moderation = [
        "REVIEW",
        "APPROVE",
        "PUBLISH",
        "REJECT",
        "SUSPEND",
      ].includes(d.action);
      if (
        moderation &&
        (!principalFor(actor).permissions.includes("listings.moderate") ||
          row.authorId === actor.id ||
          row.property.agentId === actor.id ||
          row.property.owners.some((o) => o.ownerId === actor.id))
      )
        throw new AppError(
          403,
          "MODERATION_FORBIDDEN",
          "Un modérateur autorisé et indépendant doit traiter cette annonce.",
        );
      if (["REJECT", "SUSPEND"].includes(d.action) && d.reason.length < 5)
        throw new AppError(
          400,
          "REASON_REQUIRED",
          "Indiquez le motif de cette décision.",
        );
      if (["APPROVE", "PUBLISH"].includes(d.action)) {
        const company = row.isDemo
          ? await tx.company.findUnique({
              where: { id: row.property.companyId },
              select: { code: true },
            })
          : null;
        const demo =
          row.isDemo &&
          company?.code === "BARKA-DEMO" &&
          !!row.property.details &&
          typeof row.property.details === "object" &&
          !Array.isArray(row.property.details) &&
          row.property.details.fictitious === true;
        if (row.isDemo && !demo)
          throw new AppError(
            409,
            "DEMO_INVALID",
            "Le marquage de démonstration est invalide.",
          );
        const agent = row.property.agent;
        if (
          !agent ||
          agent.status !== "ACTIVE" ||
          !["COMMERCIAL", "DEFAULT_COMMERCIAL"].includes(agent.role.code) ||
          (!demo &&
            (agent.agentProfile?.verification !== "VERIFIED" ||
              agent.agentProfile.identityAsset?.status !== "READY" ||
              agent.agentProfile.identityAsset.kind !== "IDENTITY"))
        )
          throw new AppError(
            409,
            "AGENT_UNVERIFIED",
            "Le commercial doit avoir une identité vérifiée avant publication.",
          );
        const photo = await tx.propertyMedia.count({
            where: {
              propertyId: row.propertyId,
              asset: { kind: "PHOTO", status: "READY" },
            },
          }),
          doc = await tx.propertyDocument.count({
            where: {
              propertyId: row.propertyId,
              asset: { kind: "LEGAL_DOCUMENT", status: "READY" },
            },
          });
        if (!photo || (!demo && !doc))
          throw new AppError(
            409,
            "DOSSIER_INCOMPLETE",
            "Ajoutez au moins une photographie et un document foncier validé avant publication.",
          );
      }
      const setting = await tx.setting.findUnique({
          where: {
            companyId_key: {
              companyId: row.property.companyId,
              key: "listing.revalidationDays",
            },
          },
          select: { value: true },
        }),
        days =
          typeof setting?.value === "number" &&
          Number.isInteger(setting.value) &&
          setting.value >= 1 &&
          setting.value <= 365
            ? setting.value
            : 14;
      const now = stamp(row.updatedAt);
      await tx.listing.update({
        where: { id },
        data: {
          status: nextStatus[d.action],
          updatedAt: now,
          ...(d.action === "PUBLISH"
            ? {
                publishedAt: now,
                confirmedAt: now,
                expiresAt: new Date(now.getTime() + days * 86400000),
              }
            : {}),
          ...(["REJECT", "SUSPEND", "ARCHIVE"].includes(d.action)
            ? { expiresAt: null }
            : {}),
        },
      });
      await tx.listingValidation.create({
        data: {
          listingId: id,
          actorId,
          action: d.action,
          reason: d.reason || null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          companyId: row.property.companyId,
          action: `LISTING_${d.action}`,
          targetType: "Listing",
          targetId: id,
          metadata: { from: row.status, to: nextStatus[d.action] },
        },
      });
      return listingDto(
        await tx.listing.findUniqueOrThrow({ where: { id }, include }),
      );
    },
    { timeout: 15000 },
  );
}
export async function propertyOptions(
  actor: AuthenticatedUser,
  companyId = actor.companyId,
  q = "",
) {
  if (!principalFor(actor).permissions.includes("properties.manage"))
    throw new AppError(403, "FORBIDDEN", "Accès refusé.");
  if (actor.role.code !== "SUPER_ADMIN" && companyId !== actor.companyId)
    throw new AppError(403, "COMPANY_FORBIDDEN", "Société non autorisée.");
  const company = await getDb().company.findUnique({
    where: { id: companyId },
    select: { countryId: true },
  });
  if (!company) throw new AppError(404, "NOT_FOUND", "Société introuvable.");
  const [companies, locations, agents] = await Promise.all([
    getDb().company.findMany({
      where: actor.role.code === "SUPER_ADMIN" ? {} : { id: actor.companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getDb().location.findMany({
      where: {
        countryId: company.countryId,
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
      take: 30,
    }),
    getDb().user.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        role: { code: { in: ["COMMERCIAL", "DEFAULT_COMMERCIAL"] } },
        ...(actor.role.code === "SUPER_ADMIN"
          ? {}
          : { id: { in: await teamIds(getDb(), actor) } }),
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
  ]);
  return { companies, locations, agents };
}
export async function saveTour(actorId: string, id: string, input: unknown) {
  const d = tourSchema.parse(input);
  return getDb().$transaction(
    async (tx) => {
      await lockIdentity(tx);
      const actor = await propertyActor(tx, actorId),
        listing = await scopedListing(tx, actor, id);
      assertVersion(listing.updatedAt, d.expectedUpdatedAt);
      if (listing.status === "ARCHIVED")
        throw new AppError(409, "ARCHIVED", "Ce dossier est archivé.");
      const ids = [
        ...d.scenes.map((s) => s.assetId),
        ...(d.modelAssetId ? [d.modelAssetId] : []),
      ];
      const assets = await tx.propertyMedia.findMany({
        where: {
          propertyId: listing.propertyId,
          assetId: { in: ids },
          asset: { status: "READY" },
        },
        include: { asset: true },
      });
      for (const s of d.scenes)
        if (
          !assets.some(
            (a) => a.assetId === s.assetId && a.asset.kind === "PANORAMA",
          )
        )
          throw new AppError(
            400,
            "TOUR_MEDIA",
            "Chaque pièce doit utiliser un panorama autorisé de ce bien.",
          );
      if (
        d.modelAssetId &&
        !assets.some(
          (a) => a.assetId === d.modelAssetId && a.asset.kind === "MODEL_3D",
        )
      )
        throw new AppError(
          400,
          "TOUR_MODEL",
          "Choisissez un modèle GLB appartenant à ce bien.",
        );
      await tx.tourHotspot.deleteMany({
        where: { scene: { tour: { propertyId: listing.propertyId } } },
      });
      await tx.tourScene.deleteMany({
        where: { tour: { propertyId: listing.propertyId } },
      });
      await tx.virtualTour.deleteMany({
        where: { propertyId: listing.propertyId },
      });
      if (d.scenes.length) {
        const tour = await tx.virtualTour.create({
            data: {
              propertyId: listing.propertyId,
              title: d.title,
              kind: "PANORAMA",
              published: true,
            },
          }),
          map = new Map<string, string>();
        for (const [position, s] of d.scenes.entries()) {
          const scene = await tx.tourScene.create({
            data: {
              tourId: tour.id,
              assetId: s.assetId,
              title: s.title,
              position,
              initialYaw: s.initialYaw,
              initialPitch: s.initialPitch,
              planX: s.planX,
              planY: s.planY,
            },
          });
          map.set(s.key, scene.id);
        }
        for (const s of d.scenes)
          for (const h of s.hotspots)
            await tx.tourHotspot.create({
              data: {
                sceneId: map.get(s.key)!,
                targetSceneId: h.targetKey ? map.get(h.targetKey)! : null,
                label: h.label,
                yaw: h.yaw,
                pitch: h.pitch,
              },
            });
      }
      if (d.modelAssetId)
        await tx.virtualTour.create({
          data: {
            propertyId: listing.propertyId,
            title: d.title,
            kind: "MODEL_3D",
            modelAssetId: d.modelAssetId,
            published: true,
          },
        });
      await touchDraft(
        tx,
        id,
        "TOUR_UPDATED",
        actorId,
        listing.property.companyId,
      );
      return listingDto(
        await tx.listing.findUniqueOrThrow({ where: { id }, include }),
      );
    },
    { timeout: 15000 },
  );
}
function publicDto(row: Full) {
  const p = row.property,
    photos = p.media.filter(
      (m) => m.asset.kind === "PHOTO" && m.asset.status === "READY",
    );
  return {
    slug: row.slug,
    isDemo: row.isDemo,
    reference: p.reference,
    title: p.title,
    description: row.isDemo
      ? p.description.replace(/exemple fictif/gi, "Bien de présentation")
      : p.description,
    type: p.type,
    furnishing: p.furnishing,
    rentalDuration: row.offer === "RENT" ? p.rentalDuration : null,
    rentPricePeriod: p.rentPricePeriod,
    offer: row.offer,
    priceXof: row.priceXof,
    surfaceM2: Number(p.surfaceM2),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    garageSpaces: p.garageSpaces,
    location: p.location.name,
    city: p.location.parent?.name ?? "",
    latitude:
      p.details &&
      typeof p.details === "object" &&
      !Array.isArray(p.details) &&
      p.details.showMap &&
      p.latitude !== null
        ? Math.round(Number(p.latitude) * 1000) / 1000
        : null,
    longitude:
      p.details &&
      typeof p.details === "object" &&
      !Array.isArray(p.details) &&
      p.details.showMap &&
      p.longitude !== null
        ? Math.round(Number(p.longitude) * 1000) / 1000
        : null,
    photos: photos.map((m) => ({
      id: m.assetId,
      url: url(m.assetId),
      alt: m.alt || p.title,
    })),
    hasTour: p.tours.some(
      (t) =>
        t.published &&
        (t.scenes.some((s) => s.asset.status === "READY") ||
          t.modelAsset?.status === "READY"),
    ),
    expiresAt: row.expiresAt!.toISOString(),
  };
}
export type PublicListing = ReturnType<typeof publicDto>;
export async function publicCatalog(
  input: unknown,
  featured = false,
  favoriteUserId?: string,
) {
  const q = publicQuerySchema.parse(input);
  if (!validPriceRange(q))
    throw new AppError(
      400,
      "PRICE_RANGE",
      "Le prix minimum doit être inférieur ou égal au prix maximum.",
    );
  const names = q.location ? neighborhoodVariants(q.location) : [];
  const where: Prisma.ListingWhereInput = {
    AND: [
      ...(favoriteUserId
        ? [{ favorites: { some: { userId: favoriteUserId } } }]
        : []),
      publicListingWhere(),
      ...(q.offer !== "ALL" ? [{ offer: q.offer }] : []),
      ...(q.rentalDuration !== "all" || q.pricePeriod !== "all"
        ? [{ offer: "RENT" as const }]
        : []),
      {
        ...(q.minPrice !== "" || q.maxPrice !== ""
          ? {
              priceXof: {
                ...(q.minPrice !== "" ? { gte: q.minPrice } : {}),
                ...(q.maxPrice !== "" ? { lte: q.maxPrice } : {}),
              },
            }
          : {}),
        property: {
          ...(q.category !== "all"
            ? { type: { in: [...categoryTypes[q.category]] as PropertyType[] } }
            : {}),
          ...(q.furnishing !== "all" ? { furnishing: q.furnishing } : {}),
          ...(q.rentalDuration !== "all"
            ? { rentalDuration: q.rentalDuration }
            : {}),
          ...(q.pricePeriod !== "all"
            ? { rentPricePeriod: q.pricePeriod }
            : {}),
          ...(q.city
            ? {
                location: {
                  parent: {
                    name: { equals: q.city, mode: "insensitive" as const },
                  },
                },
              }
            : {}),
          ...(names.length
            ? {
                OR: [
                  ...names.map((name) => ({
                    location: {
                      name: { contains: name, mode: "insensitive" as const },
                    },
                  })),
                  ...(!q.city
                    ? names.map((name) => ({
                        location: {
                          parent: {
                            name: {
                              contains: name,
                              mode: "insensitive" as const,
                            },
                          },
                        },
                      }))
                    : []),
                ],
              }
            : {}),
        },
      },
    ],
  };
  const direction = q.sort === "oldest" ? "asc" : "desc";
  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    ...(q.sort === "price_asc" || q.sort === "price_desc"
      ? [
          {
            priceXof:
              q.sort === "price_asc" ? ("asc" as const) : ("desc" as const),
          },
        ]
      : []),
    { publishedAt: { sort: direction, nulls: "last" } },
    { createdAt: direction },
    { id: direction },
  ];
  const take = featured ? 3 : 12;
  const [items, total] = await Promise.all([
    getDb().listing.findMany({
      where,
      include,
      orderBy,
      skip: featured ? 0 : (q.page - 1) * take,
      take,
    }),
    getDb().listing.count({ where }),
  ]);
  return { items: items.map(publicDto), total, page: q.page, pageSize: take };
}
export async function publicCatalogLocations() {
  const rows = await getDb().location.findMany({
    where: { country: { code: "BF" }, kind: { in: ["CITY", "DISTRICT"] } },
    select: { name: true, kind: true, parent: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 1500,
  });
  const neighborhoods = mergeNeighborhoods(
    rows
      .filter((r) => r.kind === "DISTRICT" && r.parent)
      .map((r) => ({ name: r.name, city: r.parent!.name })),
  );
  const cities = [
    ...new Set([
      "Ouagadougou",
      ...rows.filter((r) => r.kind === "CITY").map((r) => r.name),
      ...neighborhoods.map((n) => n.city),
    ]),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  return { cities, neighborhoods };
}
export async function publicListing(slug: string) {
  const row = await getDb().listing.findFirst({
    where: { AND: [publicListingWhere(), { slug }] },
    include,
  });
  return row ? publicDto(row) : null;
}
export async function publicTour(slug: string): Promise<TourDto | null> {
  const row = await getDb().listing.findFirst({
    where: { AND: [publicListingWhere(), { slug }] },
    include,
  });
  if (!row) return null;
  const panorama = row.property.tours.find(
      (t) => t.kind === "PANORAMA" && t.published,
    ),
    model = row.property.tours.find(
      (t) =>
        t.kind === "MODEL_3D" &&
        t.published &&
        t.modelAsset?.status === "READY",
    );
  const scenes = (panorama?.scenes ?? []).filter(
    (s) => s.asset.kind === "PANORAMA" && s.asset.status === "READY",
  );
  const sceneIds = new Set(scenes.map((s) => s.id));
  const floor = row.property.floorPlans.find((p) => p.asset.status === "READY");
  if (!scenes.length && !model) return null;
  return {
    title: row.property.title,
    scenes: scenes.map((s) => ({
      id: s.id,
      title: s.title,
      image: url(s.assetId),
      initialYaw: s.initialYaw,
      initialPitch: s.initialPitch,
      planX: s.planX,
      planY: s.planY,
      hotspots: s.hotspots
        .filter((h) => !h.targetSceneId || sceneIds.has(h.targetSceneId))
        .map((h) => ({
          id: h.id,
          label: h.label,
          targetSceneId: h.targetSceneId,
          yaw: h.yaw,
          pitch: h.pitch,
        })),
    })),
    modelUrl: model?.modelAssetId ? url(model.modelAssetId) : null,
    floorPlanUrl: floor ? url(floor.assetId) : null,
    backHref: `/biens/${slug}`,
  };
}
export const databaseCatalogEnabled = () =>
  process.env.CATALOG_MODE === "database";

export async function publicMapPoints() {
  const rows = await getDb().listing.findMany({
    where: {
      AND: [
        publicListingWhere(),
        {
          property: {
            latitude: { not: null },
            longitude: { not: null },
            details: { path: ["showMap"], equals: true },
          },
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      isDemo: true,
      property: { select: { title: true, latitude: true, longitude: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.isDemo
      ? `Bien de présentation : ${row.property.title}`
      : row.property.title,
    latitude: Math.round(Number(row.property.latitude) * 1000) / 1000,
    longitude: Math.round(Number(row.property.longitude) * 1000) / 1000,
    href: `/biens/${row.slug}`,
  }));
}
