import "dotenv/config";
import { PrismaClient, type RoleCode } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { roleLevels } from "../src/modules/identity/policy";
import { demoProperties } from "../src/modules/catalog/demo";
import { nextAgentIdentifier } from "../src/lib/server/agent-number";

if (process.env.NODE_ENV === "production")
  throw new Error("Seed de démonstration interdit en production");
const password = process.env.DEMO_PASSWORD;
if (
  !password ||
  password.length < 12 ||
  Buffer.byteLength(password, "utf8") > 72
)
  throw new Error(
    "DEMO_PASSWORD doit contenir au moins 12 caractères et au plus 72 octets",
  );
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHash = await hash(password!, 12);
  await db.$transaction(
    async (tx) => {
      // A single seed runner at a time; retries do not overwrite existing passwords or prices.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(2262026)::text`;
      const country = await tx.country.upsert({
        where: { code: "BF" },
        update: {},
        create: { code: "BF", name: "Burkina Faso" },
      });
      const company = await tx.company.upsert({
        where: { code: "BARKA-DEMO" },
        update: {},
        create: {
          code: "BARKA-DEMO",
          name: "BARKA SARL — Démonstration",
          countryId: country.id,
        },
      });
      const agency = await tx.agency.upsert({
        where: { code: "AGENCY-DEMO" },
        update: {},
        create: {
          code: "AGENCY-DEMO",
          name: "Agence de démonstration",
          companyId: company.id,
        },
      });
      const permissions = [
        "users.manage",
        "properties.manage",
        "listings.moderate",
        "finance.read",
        "settings.manage",
      ];
      for (const code of permissions)
        await tx.permission.upsert({
          where: { code },
          update: {},
          create: { code },
        });
      const roles = new Map<RoleCode, string>();
      for (const [code, level] of Object.entries(roleLevels)) {
        const role = await tx.role.upsert({
          where: { code: code as RoleCode },
          update: {},
          create: { code: code as RoleCode, level },
        });
        roles.set(code as RoleCode, role.id);
        const grants = permissions.filter((p) => {
          if (p === "settings.manage") return level >= 5;
          if (p === "listings.moderate") return level >= 4;
          if (p === "finance.read") return level >= 2;
          return level >= 2;
        });
        for (const code of grants) {
          const permission = await tx.permission.findUniqueOrThrow({
            where: { code },
          });
          await tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: { roleId: role.id, permissionId: permission.id },
          });
        }
      }
      const users = new Map<RoleCode, string>();
      const chain: RoleCode[] = [
        "SUPER_ADMIN",
        "ADMIN",
        "SUPERVISOR",
        "MANAGER",
        "COMMERCIAL",
        "DEFAULT_COMMERCIAL",
        "CLIENT",
      ];
      for (const [index, code] of chain.entries()) {
        const user = await tx.user.upsert({
          where: { email: `${code.toLowerCase()}@barka.example` },
          update: {},
          create: {
            firstName: "Compte",
            lastName: `Démo ${code}`,
            phone: `+2260000000${index}`,
            email: `${code.toLowerCase()}@barka.example`,
            passwordHash,
            companyId: company.id,
            roleId: roles.get(code)!,
            professionalStatuses:
              code === "COMMERCIAL" ? ["AGENT", "OWNER"] : [],
          },
        });
        users.set(code, user.id);
        const parentCode: Partial<Record<RoleCode, RoleCode>> = {
          ADMIN: "SUPER_ADMIN",
          SUPERVISOR: "ADMIN",
          MANAGER: "SUPERVISOR",
          COMMERCIAL: "MANAGER",
          DEFAULT_COMMERCIAL: "MANAGER",
          CLIENT: "DEFAULT_COMMERCIAL",
        };
        if (parentCode[code])
          await tx.userHierarchy.upsert({
            where: { childId: user.id },
            update: {},
            create: {
              childId: user.id,
              parentId: users.get(parentCode[code]!)!,
            },
          });
        if (code === "COMMERCIAL" || code === "DEFAULT_COMMERCIAL") {
          if (
            !(await tx.agentProfile.findUnique({ where: { userId: user.id } }))
          ) {
            await tx.agentProfile.create({
              data: {
                userId: user.id,
                identifier: await nextAgentIdentifier(
                  tx,
                  new Date().getUTCFullYear(),
                ),
                agencyId: agency.id,
              },
            });
          }
        }
        if (code === "CLIENT")
          await tx.clientProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          });
        for (const purpose of ["TERMS", "PRIVACY"])
          await tx.consent.upsert({
            where: {
              userId_purpose_version: {
                userId: user.id,
                purpose,
                version: "demo-v1",
              },
            },
            update: {},
            create: { userId: user.id, purpose, version: "demo-v1" },
          });
      }
      if (!company.defaultCommercialId)
        await tx.company.update({
          where: { id: company.id },
          data: { defaultCommercialId: users.get("DEFAULT_COMMERCIAL")! },
        });
      let parentId: string | undefined;
      for (const [code, name, kind] of [
        ["DEMO-REGION", "Région exemple de Ouagadougou", "REGION"],
        ["DEMO-PROVINCE", "Province exemple", "PROVINCE"],
        ["DEMO-COMMUNE", "Ouagadougou", "COMMUNE"],
        ["DEMO-CITY", "Ouagadougou", "CITY"],
      ] as const) {
        const location = await tx.location.upsert({
          where: { code },
          update: {},
          create: { code, name, kind, countryId: country.id, parentId },
        });
        parentId = location.id;
      }
      for (const p of demoProperties) {
        const location = await tx.location.upsert({
          where: { code: `LOCATION-${p.reference}` },
          update: {},
          create: {
            code: `LOCATION-${p.reference}`,
            name: p.district,
            kind: "DISTRICT",
            parentId,
            countryId: country.id,
          },
        });
        const property = await tx.property.upsert({
          where: { reference: p.reference },
          update: {},
          create: {
            reference: p.reference,
            title: p.title,
            description: p.description,
            type: p.type,
            companyId: company.id,
            locationId: location.id,
            agentId: users.get("COMMERCIAL"),
            surfaceM2: p.surfaceM2,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            details: { fictitious: true },
          },
        });
        await tx.propertyOwnership.upsert({
          where: {
            propertyId_ownerId: {
              propertyId: property.id,
              ownerId: users.get("COMMERCIAL")!,
            },
          },
          update: {},
          create: {
            propertyId: property.id,
            ownerId: users.get("COMMERCIAL")!,
            shareBps: 10000,
          },
        });
        // Unverified demo agents cannot publish: real database examples remain drafts.
        await tx.listing.upsert({
          where: { slug: p.slug },
          update: {},
          create: {
            slug: p.slug,
            propertyId: property.id,
            authorId: users.get("COMMERCIAL")!,
            offer: p.offer,
            priceXof: p.priceXof,
            status: "DRAFT",
            paymentPeriod: p.offer === "RENT" ? "MONTHLY" : null,
          },
        });
      }
      for (const [code, label, priceXof, durationDays] of [
        ["MANAGER_YEAR", "Manager immobilier annuel", 5000, 365],
        ["AGENT_YEAR", "Commercial, démarcheur ou agence annuel", 5000, 365],
        ["CLIENT_DAY", "Service client journalier", 100, 1],
      ] as const) {
        await tx.subscriptionPlan.upsert({
          where: { companyId_code: { companyId: company.id, code } },
          update: {},
          create: {
            companyId: company.id,
            code,
            label,
            priceXof,
            durationDays,
          },
        });
      }
      for (const [key, value] of [
        ["listing.revalidationDays", 14],
        ["pricing.contactRevealXof", 100],
      ] as const)
        await tx.setting.upsert({
          where: { companyId_key: { companyId: company.id, key } },
          update: {},
          create: { companyId: company.id, key, value },
        });
    },
    { timeout: 60000 },
  );
  console.info(
    "Seed terminé : comptes et biens fictifs uniquement. Aucun média ni paiement créé.",
  );
}
main()
  .catch(() => {
    console.error(
      "Échec du seed : vérifier configuration et base de données. Aucun secret affiché.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
