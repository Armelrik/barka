import "dotenv/config";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { demoProperties, type DemoProperty } from "../src/modules/catalog/demo";
import { putMedia, removeMedia } from "../src/modules/media/storage";
const examples: DemoProperty[] = [
  ...demoProperties,
  {
    reference: "SHOWCASE-009",
    slug: "villa-patio-somgande",
    title: "La maison autour du patio",
    district: "Somgandé",
    city: "Ouagadougou",
    type: "VILLA",
    category: "villa",
    offer: "SALE",
    priceXof: 69000000,
    surfaceM2: 400,
    bedrooms: 4,
    bathrooms: 3,
    illustration: "villa",
    description:
      "Un patio central, une terrasse ombragée et quatre chambres pour imaginer la vie en famille à Somgandé. Bien fictif de présentation, sans offre ni disponibilité réelle.",
    photos: [
      "/afriloc/house4.jpg",
      "/afriloc/house1.jpg",
      "/afriloc/apartment2.jpg",
    ],
    coordinates: [12.401, -1.511],
  },
  {
    reference: "SHOWCASE-010",
    slug: "bureau-cabinet-koulouba",
    title: "Un cabinet au cœur de Koulouba",
    district: "Koulouba",
    city: "Ouagadougou",
    type: "OFFICE",
    category: "bureau",
    offer: "RENT",
    priceXof: 325000,
    surfaceM2: 150,
    bedrooms: 0,
    bathrooms: 2,
    illustration: "office",
    description:
      "Un espace de 150 m² imaginé pour un cabinet ou une agence, avec accueil et espaces de travail distincts. Exemple fictif à Koulouba, illustré avec les visuels du projet Afriloc.",
    photos: [
      "/afriloc/apartment3.jpg",
      "/afriloc/apartment2.jpg",
      "/afriloc/apartment1.jpg",
    ],
    coordinates: [12.368, -1.509],
  },
];
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-");
async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Connexion absente");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 1 }),
  });
  const staged: { id: string; key: string; body: Buffer }[] = [];
  let committed = false;
  try {
    const live = await db.company.findUniqueOrThrow({
      where: { code: process.env.BARKA_COMPANY_CODE || "BARKA" },
    });
    const marker = await db.setting.findUniqueOrThrow({
      where: {
        companyId_key: {
          companyId: live.id,
          key: "system.productionBootstrap",
        },
      },
    });
    const adminId = (marker.value as { adminId: string }).adminId;
    const root = await db.user.findUniqueOrThrow({
      where: { id: adminId },
      include: { role: true },
    });
    if (
      root.status !== "ACTIVE" ||
      root.role.code !== "SUPER_ADMIN" ||
      root.companyId !== live.id
    )
      throw new Error("Administrateur invalide");
    const company = await db.company.findUniqueOrThrow({
      where: { code: "BARKA-DEMO" },
    });
    const users = await db.user.findMany({
      where: {
        companyId: company.id,
        email: {
          in: [
            "commercial@barka.example",
            "default_commercial@barka.example",
            "manager@barka.example",
            "admin@barka.example",
            "client@barka.example",
          ],
        },
      },
      include: { role: true },
    });
    const user = (role: string) => {
      const found = users.find(
        (u) =>
          u.role.code === role &&
          u.email === `${role.toLowerCase()}@barka.example`,
      );
      if (!found || found.status !== "ACTIVE")
        throw new Error("Comptes de démonstration indisponibles");
      return found;
    };
    const agents = [user("COMMERCIAL"), user("DEFAULT_COMMERCIAL")],
      authors = [user("MANAGER"), user("ADMIN")],
      owner = user("CLIENT");
    const assets = new Map<string, { id: string }>();
    for (const photo of new Set(examples.flatMap((p) => p.photos))) {
      if (!/^\/afriloc\/(house|land|apartment)\d\.jpg$/.test(photo))
        throw new Error("Visuel inattendu");
      const id =
        "showcase-image-" + photo.split("/").pop()!.replace(".jpg", "");
      const existing = await db.mediaAsset.findUnique({ where: { id } });
      if (existing) {
        if (
          existing.kind !== "PHOTO" ||
          existing.status !== "READY" ||
          existing.ownerId !== agents[0].id
        )
          throw new Error("Collision média");
        assets.set(photo, { id });
        continue;
      }
      const original = await readFile(
        new URL("../public" + photo, import.meta.url),
      );
      const body = await sharp(original)
        .rotate()
        .jpeg({ quality: 85 })
        .toBuffer();
      if (body.length > 4 * 1024 * 1024)
        throw new Error("Illustration trop volumineuse pour Vercel");
      const key = await putMedia(randomUUID(), "jpg", body, "image/jpeg");
      staged.push({ id, key, body });
      assets.set(photo, { id });
    }
    let created = 0;
    await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(226202611)::text`;
        const fresh = await tx.user.findUniqueOrThrow({
          where: { id: root.id },
          include: { role: true },
        });
        if (fresh.status !== "ACTIVE" || fresh.role.code !== "SUPER_ADMIN")
          throw new Error("Administrateur modifié");
        if (
          (await tx.user.count({
            where: {
              id: { in: users.map((u) => u.id) },
              status: "ACTIVE",
              companyId: company.id,
            },
          })) !== users.length
        )
          throw new Error("Équipe modifiée");
        for (const a of staged)
          await tx.mediaAsset.create({
            data: {
              id: a.id,
              ownerId: agents[0].id,
              objectKey: a.key,
              kind: "PHOTO",
              mimeType: "image/jpeg",
              sizeBytes: a.body.length,
              status: "READY",
              checksum: createHash("sha256").update(a.body).digest("hex"),
            },
          });
        for (const [i, p] of examples.entries()) {
          const reference = `SHOWCASE-${String(i + 1).padStart(3, "0")}`;
          const existing = await tx.property.findUnique({
            where: { reference },
          });
          if (existing) {
            if (existing.companyId !== company.id)
              throw new Error("Collision référence");
            continue;
          }
          const city = await tx.location.upsert({
            where: { code: `BF-CITY-${slug(p.city)}` },
            update: {},
            create: {
              code: `BF-CITY-${slug(p.city)}`,
              name: p.city,
              kind: "CITY",
              countryId: company.countryId,
            },
          });
          const location = await tx.location.upsert({
            where: { code: `SHOWCASE-LOC-${slug(p.city)}-${slug(p.district)}` },
            update: {},
            create: {
              code: `SHOWCASE-LOC-${slug(p.city)}-${slug(p.district)}`,
              name: p.district,
              kind: "DISTRICT",
              parentId: city.id,
              countryId: company.countryId,
            },
          });
          const property = await tx.property.create({
            data: {
              reference,
              title: p.title,
              description: p.description,
              type: p.type,
              companyId: company.id,
              locationId: location.id,
              agentId: agents[i % 2].id,
              surfaceM2: p.surfaceM2,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              latitude: p.coordinates[0],
              longitude: p.coordinates[1],
              details: { fictitious: true, showMap: true, showcaseVersion: 1 },
            },
          });
          await tx.propertyOwnership.create({
            data: {
              propertyId: property.id,
              ownerId: i % 3 === 0 ? owner.id : agents[0].id,
              shareBps: 10000,
            },
          });
          for (const [position, photo] of p.photos.entries())
            await tx.propertyMedia.create({
              data: {
                propertyId: property.id,
                assetId: assets.get(photo)!.id,
                position,
                alt: `Illustration fictive ${position + 1} : ${p.title}`,
              },
            });
          const listing = await tx.listing.create({
            data: {
              slug: `exemple-${p.slug}`,
              propertyId: property.id,
              authorId: authors[i % 2].id,
              offer: p.offer,
              priceXof: p.priceXof,
              paymentPeriod: p.offer === "RENT" ? "MONTHLY" : null,
              status: "PUBLISHED",
              isDemo: true,
              publishedAt: new Date(),
              expiresAt: new Date(Date.now() + 14 * 86400000),
            },
          });
          await tx.auditLog.create({
            data: {
              actorId: root.id,
              companyId: company.id,
              action: "SHOWCASE_LISTING_CREATED",
              targetType: "Listing",
              targetId: listing.id,
              metadata: { isDemo: true, assignedAgentId: agents[i % 2].id },
            },
          });
          created++;
        }
      },
      { timeout: 60000 },
    );
    committed = true;
    console.log(
      `Présentation intégrée : ${created} nouveau(x) bien(s) fictif(s), ${await db.listing.count({ where: { isDemo: true, property: { companyId: company.id, reference: { startsWith: "SHOWCASE-" } } } })} exemple(s) attribué(s). Aucun compte, document d’identité ou justificatif foncier fabriqué.`,
    );
  } finally {
    if (!committed)
      for (const a of staged) await removeMedia(a.key).catch(() => {});
    await db.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(
    "Import des exemples interrompu. Aucun secret affiché.",
    error instanceof Error ? error.name : "",
  );
  process.exitCode = 1;
});
