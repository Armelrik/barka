import "dotenv/config";
import { test as base, expect } from "@playwright/test";
import { randomBytes, randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient, type RoleCode } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
)
  throw new Error("Base de test locale explicite requise.");
export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});
export const origin = "http://127.0.0.1:3002";
export const jsonHeaders = {
  Origin: origin,
  "Content-Type": "application/json",
};
export function registrationData() {
  return {
    firstName: "Compte",
    lastName: "Test",
    phone: `+2260${randomInt(1000000, 10000000)}`,
    email: `auth-test-${randomBytes(8).toString("hex")}@barka.example`,
    password: randomBytes(24).toString("hex"),
    consent: true,
  };
}
type Fixture = {
  create: (
    role: RoleCode,
    options?: { companyId?: string; parentId?: string },
  ) => Promise<{
    id: string;
    companyId: string;
    phone: string;
    email: string;
    password: string;
  }>;
  trackPhone: (phone: string) => void;
  createCompany: () => Promise<string>;
};
export const test = base.extend<{ accounts: Fixture }>({
  accounts: async ({}, provide) => {
    const ids: string[] = [],
      phones: string[] = [],
      companies: string[] = [];
    await provide({
      create: async (code, options = {}) => {
        const data = registrationData();
        const company = options.companyId
          ? { id: options.companyId }
          : await db.company.findUniqueOrThrow({
              where: { code: "BARKA-DEMO" },
              select: { id: true },
            });
        const role = await db.role.findUniqueOrThrow({ where: { code } });
        const user = await db.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            passwordHash: await hash(data.password, 12),
            roleId: role.id,
            companyId: company.id,
            ...(options.parentId
              ? { parentLink: { create: { parentId: options.parentId } } }
              : {}),
          },
        });
        ids.push(user.id);
        return {
          id: user.id,
          companyId: company.id,
          phone: data.phone,
          email: data.email,
          password: data.password,
        };
      },
      trackPhone: (phone) => phones.push(phone),
      createCompany: async () => {
        const country = await db.country.findUniqueOrThrow({
          where: { code: "BF" },
        });
        const company = await db.company.create({
          data: {
            code: `AUTH-TEST-${randomBytes(8).toString("hex")}`,
            name: "Société de test isolée",
            countryId: country.id,
          },
        });
        companies.push(company.id);
        return company.id;
      },
    });
    // Delete only accounts explicitly created by this test; never reset the database or demo users.
    const registered = phones.length
      ? await db.user.findMany({
          where: {
            phone: { in: phones },
            firstName: "Compte",
            lastName: "Test",
            OR: [{ email: null }, { email: { startsWith: "auth-test-" } }],
          },
          select: { id: true },
        })
      : [];
    const testIds = [...ids, ...registered.map((user) => user.id)];
    if (testIds.length)
      await db.$transaction(async (tx) => {
        await tx.auditLog.deleteMany({ where: { actorId: { in: testIds } } });
        await tx.authSession.deleteMany({ where: { userId: { in: testIds } } });
        await tx.consent.deleteMany({ where: { userId: { in: testIds } } });
        await tx.clientProfile.deleteMany({
          where: { userId: { in: testIds } },
        });
        await tx.userHierarchy.deleteMany({
          where: {
            OR: [{ childId: { in: testIds } }, { parentId: { in: testIds } }],
          },
        });
        await tx.user.deleteMany({ where: { id: { in: testIds } } });
      });
    if (companies.length)
      await db.company.deleteMany({ where: { id: { in: companies } } });
  },
});
test.afterAll(async () => db.$disconnect());
export { expect };
