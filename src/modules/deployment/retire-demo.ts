import type { PrismaClient } from "../../generated/prisma/client";
import { z } from "zod";
const demoRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "MANAGER",
  "COMMERCIAL",
  "DEFAULT_COMMERCIAL",
  "CLIENT",
] as const;
export async function retireDemoAccounts(
  db: PrismaClient,
  companyCode: string,
  apply = false,
) {
  if (!companyCode || companyCode.includes("DEMO"))
    throw new Error("Société de production requise.");
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(226202611)::text`;
      const company = await tx.company.findUniqueOrThrow({
        where: { code: companyCode },
      });
      const marker = await tx.setting.findUniqueOrThrow({
        where: {
          companyId_key: {
            companyId: company.id,
            key: "system.productionBootstrap",
          },
        },
      });
      const ids = z
        .object({ adminId: z.string(), defaultId: z.string() })
        .parse(marker.value);
      const admin = await tx.user.findUniqueOrThrow({
        where: { id: ids.adminId },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      });
      const routing = await tx.user.findUniqueOrThrow({
        where: { id: ids.defaultId },
        include: { role: true },
      });
      if (
        admin.status !== "ACTIVE" ||
        admin.companyId !== company.id ||
        admin.role.code !== "SUPER_ADMIN" ||
        !admin.role.permissions.some(
          (p) => p.permission.code === "users.manage",
        ) ||
        routing.status !== "ACTIVE" ||
        routing.role.code !== "DEFAULT_COMMERCIAL" ||
        routing.companyId !== company.id ||
        company.defaultCommercialId !== routing.id
      )
        throw new Error("Comptes de production incomplets : retrait refusé.");
      const demo = await tx.company.findUnique({
        where: { code: "BARKA-DEMO" },
      });
      if (!demo) return { matched: 0, active: 0, sessions: 0, applied: apply };
      const users = await tx.user.findMany({
        where: {
          companyId: demo.id,
          email: {
            in: demoRoles.map((r) => `${r.toLowerCase()}@barka.example`),
          },
        },
        include: { role: true },
      });
      if (
        users.length !== demoRoles.length ||
        users.some((u) => {
          const index = demoRoles.findIndex(
            (r) => `${r.toLowerCase()}@barka.example` === u.email,
          );
          return (
            index < 0 ||
            u.role.code !== demoRoles[index] ||
            u.phone !== `+2260000000${index}` ||
            u.id === admin.id ||
            u.id === routing.id
          );
        })
      )
        throw new Error(
          "Les comptes de démonstration ont été modifiés : examen manuel requis.",
        );
      const allIds = users.map((u) => u.id),
        active = users.filter((u) => u.status === "ACTIVE");
      const sessions = await tx.authSession.count({
        where: { userId: { in: allIds } },
      });
      if (apply) {
        await tx.user.updateMany({
          where: { id: { in: active.map((u) => u.id) }, status: "ACTIVE" },
          data: { status: "SUSPENDED" },
        });
        await tx.authSession.deleteMany({ where: { userId: { in: allIds } } });
        for (const user of active)
          await tx.auditLog.create({
            data: {
              actorId: admin.id,
              companyId: demo.id,
              action: "DEMO_ACCOUNT_SUSPENDED",
              targetType: "User",
              targetId: user.id,
              metadata: {
                reason: "Retrait des comptes fictifs avant mise en production",
                source: "db:retire-demo",
              },
            },
          });
        if (active.length || sessions)
          await tx.auditLog.create({
            data: {
              actorId: admin.id,
              companyId: company.id,
              action: "DEMO_ACCESS_RETIRED",
              targetType: "Company",
              targetId: demo.id,
              metadata: { suspended: active.length, sessionsRevoked: sessions },
            },
          });
      }
      return {
        matched: users.length,
        active: active.length,
        sessions,
        applied: apply,
      };
    },
    { timeout: 30000 },
  );
}
