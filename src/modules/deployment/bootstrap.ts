import { z } from "zod";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client";
import { registrationSchema, phoneSchema } from "../identity/validation";
import { nextAgentIdentifier } from "../../lib/server/agent-number";
const accountSchema = registrationSchema.omit({ consent: true });
export const bootstrapSchema = z
  .object({
    companyCode: z
      .string()
      .regex(/^[A-Z][A-Z0-9_-]{2,39}$/)
      .refine((code) => !code.includes("DEMO")),
    companyName: z.string().trim().min(3).max(150),
    admin: accountSchema,
    defaultPhone: phoneSchema,
  })
  .refine((data) => data.admin.phone !== data.defaultPhone, {
    message: "Deux téléphones distincts sont requis.",
  });
export function bootstrapInput(env: Record<string, string | undefined>) {
  return bootstrapSchema.parse({
    companyCode: env.BARKA_COMPANY_CODE,
    companyName: env.BOOTSTRAP_COMPANY_NAME,
    admin: {
      firstName: env.BOOTSTRAP_ADMIN_FIRST_NAME,
      lastName: env.BOOTSTRAP_ADMIN_LAST_NAME,
      phone: env.BOOTSTRAP_ADMIN_PHONE,
      email: env.BOOTSTRAP_ADMIN_EMAIL,
      password: env.BOOTSTRAP_ADMIN_PASSWORD,
    },
    defaultPhone: env.BOOTSTRAP_DEFAULT_PHONE,
  });
}
export async function bootstrapProduction(db: PrismaClient, input: unknown) {
  const data = bootstrapSchema.parse(input),
    adminHash = await hash(data.admin.password, 12),
    routingHash = await hash(randomBytes(48).toString("base64url"), 12);
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(226202611)::text`;
      const country = await tx.country.upsert({
        where: { code: "BF" },
        update: {},
        create: { code: "BF", name: "Burkina Faso" },
      });
      const company = await tx.company.upsert({
        where: { code: data.companyCode },
        update: {},
        create: {
          code: data.companyCode,
          name: data.companyName,
          countryId: country.id,
        },
      });
      if (company.countryId !== country.id)
        throw new Error("La société existante appartient à un autre pays.");
      const marker = await tx.setting.findUnique({
        where: {
          companyId_key: {
            companyId: company.id,
            key: "system.productionBootstrap",
          },
        },
      });
      if (marker) {
        const saved = z
          .object({ adminId: z.string(), defaultId: z.string() })
          .parse(marker.value);
        const admin = await tx.user.findUnique({
            where: { id: saved.adminId },
            include: { role: true },
          }),
          routing = await tx.user.findUnique({
            where: { id: saved.defaultId },
            include: { role: true },
          });
        if (
          !admin ||
          !routing ||
          admin.companyId !== company.id ||
          routing.companyId !== company.id ||
          admin.role.code !== "SUPER_ADMIN" ||
          routing.role.code !== "DEFAULT_COMMERCIAL" ||
          admin.status !== "ACTIVE" ||
          routing.status !== "ACTIVE" ||
          admin.phone !== data.admin.phone ||
          admin.email !== data.admin.email ||
          routing.phone !== data.defaultPhone ||
          company.defaultCommercialId !== routing.id
        )
          throw new Error(
            "Les comptes initiaux existants ne correspondent plus à la configuration. Aucun compte modifié.",
          );
        return { created: false };
      }
      if (
        company.defaultCommercialId ||
        (await tx.user.count({ where: { companyId: company.id } }))
      )
        throw new Error(
          "Cette société contient déjà des comptes. Initialisation refusée pour ne pas modifier leurs droits.",
        );
      if (
        await tx.user.count({
          where: {
            OR: [
              { phone: { in: [data.admin.phone, data.defaultPhone] } },
              ...(data.admin.email ? [{ email: data.admin.email }] : []),
            ],
          },
        })
      )
        throw new Error(
          "Un identifiant initial est déjà utilisé. Aucun compte existant ne sera promu.",
        );
      const adminRole = await tx.role.findUniqueOrThrow({
          where: { code: "SUPER_ADMIN" },
        }),
        defaultRole = await tx.role.findUniqueOrThrow({
          where: { code: "DEFAULT_COMMERCIAL" },
        });
      const admin = await tx.user.create({
        data: {
          firstName: data.admin.firstName,
          lastName: data.admin.lastName,
          phone: data.admin.phone,
          email: data.admin.email,
          passwordHash: adminHash,
          roleId: adminRole.id,
          companyId: company.id,
        },
      });
      const routing = await tx.user.create({
        data: {
          firstName: "Accueil",
          lastName: "Barka",
          phone: data.defaultPhone,
          passwordHash: routingHash,
          roleId: defaultRole.id,
          companyId: company.id,
          parentLink: { create: { parentId: admin.id } },
          agentProfile: {
            create: {
              identifier: await nextAgentIdentifier(
                tx,
                new Date().getUTCFullYear(),
              ),
            },
          },
        },
      });
      await tx.company.update({
        where: { id: company.id },
        data: { defaultCommercialId: routing.id },
      });
      for (const [code, name] of [
        ["BF-CITY-OUAGADOUGOU", "Ouagadougou"],
        ["BF-CITY-BOBO-DIOULASSO", "Bobo-Dioulasso"],
      ])
        await tx.location.upsert({
          where: { code },
          update: {},
          create: { code, name, kind: "CITY", countryId: country.id },
        });
      await tx.setting.upsert({
        where: {
          companyId_key: {
            companyId: company.id,
            key: "listing.revalidationDays",
          },
        },
        update: {},
        create: {
          companyId: company.id,
          key: "listing.revalidationDays",
          value: 14,
        },
      });
      await tx.setting.create({
        data: {
          companyId: company.id,
          key: "system.productionBootstrap",
          value: { adminId: admin.id, defaultId: routing.id },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          companyId: company.id,
          action: "PRODUCTION_BOOTSTRAPPED",
          targetType: "Company",
          targetId: company.id,
          metadata: { accountsCreated: 2 },
        },
      });
      return { created: true };
    },
    { timeout: 30000 },
  );
}
