import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { lockIdentity } from "../src/lib/server/identity-lock";
const entries = [
  {
    id: "BARKA-HOUSE-HERO-CATALOG",
    placement: "HERO",
    title: "Votre prochain chez-vous vous attend",
    description:
      "Maisons, appartements et terrains : explorez les opportunités Barka.",
    targetUrl: "/biens",
    imagePath: "/afriloc/house1.jpg",
    cta: "Explorer les propriétés",
    priority: 10,
  },
  {
    id: "BARKA-HOUSE-HERO-3D",
    placement: "HERO",
    title: "Entrez dans votre futur logement",
    description: "Découvrez nos visites immersives avant de vous déplacer.",
    targetUrl: "/visites/demo",
    imagePath: "/afriloc/house2.jpg",
    cta: "Visiter en immersion",
    priority: 9,
  },
  {
    id: "BARKA-HOUSE-AFTER-HERO",
    placement: "AFTER_HERO",
    title: "Trouvez le quartier qui vous ressemble",
    description:
      "Repérez les biens disponibles autour de vos adresses préférées.",
    targetUrl: "/carte",
    imagePath: "/afriloc/ouaga-hero.jpg",
    cta: "Explorer la carte",
    priority: 10,
  },
  {
    id: "BARKA-HOUSE-BEFORE-FOOTER",
    placement: "BEFORE_FOOTER",
    title: "Donnez de la visibilité à votre offre",
    description:
      "Présentez votre activité aux personnes qui préparent leur projet immobilier.",
    targetUrl: "/contact#professionnels",
    imagePath: "/afriloc/ad-banner.jpg",
    cta: "Parlons de votre campagne",
    priority: 10,
  },
];
async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Connexion manquante");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 1 }),
  });
  try {
    const company = await db.company.findUniqueOrThrow({
      where: { code: process.env.BARKA_COMPANY_CODE || "BARKA" },
    });
    const marker = await db.setting.findUniqueOrThrow({
      where: {
        companyId_key: {
          companyId: company.id,
          key: "system.productionBootstrap",
        },
      },
    });
    const adminId = (marker.value as { adminId: string }).adminId;
    const pending = entries;
    if (!process.argv.includes("--apply")) {
      const existing = await db.advertisement.count({
        where: { id: { in: pending.map((e) => e.id) } },
      });
      console.log(
        `${pending.length - existing} campagnes internes Barka à créer. Relancer avec --apply. Les campagnes existantes seront conservées.`,
      );
      return;
    }
    const count = await db.$transaction(async (tx) => {
      await lockIdentity(tx);
      const root = await tx.user.findUniqueOrThrow({
        where: { id: adminId },
        include: { role: true },
      });
      if (
        root.status !== "ACTIVE" ||
        root.role.code !== "SUPER_ADMIN" ||
        root.companyId !== company.id
      )
        throw new Error("Administrateur initial invalide");
      let created = 0;
      for (const entry of pending) {
        if (await tx.advertisement.findUnique({ where: { id: entry.id } }))
          continue;
        await tx.advertisement.create({
          data: {
            ...entry,
            companyId: company.id,
            ownerId: root.id,
            sponsorName: "BARKA SARL",
            campaignKind: "HOUSE",
            active: true,
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 90 * 86400000),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: root.id,
            companyId: company.id,
            action: "AD_CREATED",
            targetType: "Advertisement",
            targetId: entry.id,
            metadata: {
              source: "house-campaign-bootstrap",
              placement: entry.placement,
            },
          },
        });
        created++;
      }
      return created;
    });
    console.log(
      `${count} campagnes internes Barka créées. Aucun annonceur ni chiffre d’audience inventé.`,
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Initialisation interrompue : vérifier la connexion et le compte initial.",
  );
  process.exitCode = 1;
});
