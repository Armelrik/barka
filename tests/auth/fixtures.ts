import "dotenv/config";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
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
  trackId: (id: string) => void;
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
      trackId: (id) => ids.push(id),
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
    const ownedAssets = testIds.length
      ? await db.mediaAsset.findMany({
          where: { ownerId: { in: testIds } },
          select: { id: true, objectKey: true },
        })
      : [];
    if (testIds.length)
      await db.$transaction(async (tx) => {
        await tx.auditLog.deleteMany({
          where: {
            OR: [
              { actorId: { in: testIds } },
              { targetType: "User", targetId: { in: testIds } },
            ],
          },
        });
        await tx.company.updateMany({
          where: { defaultCommercialId: { in: testIds } },
          data: { defaultCommercialId: null },
        });
        const properties = await tx.property.findMany({
          where: {
            OR: [
              { agentId: { in: testIds } },
              { listings: { some: { authorId: { in: testIds } } } },
            ],
          },
          select: { id: true },
        });
        const propertyIds = properties.map((p) => p.id);
        const listingIds = (
          await tx.listing.findMany({
            where: { propertyId: { in: propertyIds } },
            select: { id: true },
          })
        ).map((l) => l.id);
        await tx.tourHotspot.deleteMany({
          where: { scene: { tour: { propertyId: { in: propertyIds } } } },
        });
        await tx.tourScene.deleteMany({
          where: { tour: { propertyId: { in: propertyIds } } },
        });
        await tx.virtualTour.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.floorPlan.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.propertyMedia.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.propertyDocument.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.propertyFeature.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.propertyUnit.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.propertyOwnership.deleteMany({
          where: { propertyId: { in: propertyIds } },
        });
        await tx.visitRequest.deleteMany({
          where: {
            OR: [
              { listingId: { in: listingIds } },
              { userId: { in: testIds } },
            ],
          },
        });
        await tx.favorite.deleteMany({
          where: {
            OR: [
              { listingId: { in: listingIds } },
              { userId: { in: testIds } },
            ],
          },
        });
        await tx.listingValidation.deleteMany({
          where: {
            OR: [
              { listingId: { in: listingIds } },
              { actorId: { in: testIds } },
            ],
          },
        });
        await tx.listing.deleteMany({ where: { id: { in: listingIds } } });
        await tx.property.deleteMany({ where: { id: { in: propertyIds } } });
        await tx.agentProfile.deleteMany({
          where: { userId: { in: testIds } },
        });
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
        await tx.outboxJob.deleteMany({
          where: {
            idempotencyKey: {
              in: ownedAssets.map((a) => `media-delete:${a.id}`),
            },
          },
        });
        await tx.mediaAsset.deleteMany({
          where: { id: { in: ownedAssets.map((a) => a.id) } },
        });
        await tx.user.deleteMany({ where: { id: { in: testIds } } });
      });
    for (const asset of ownedAssets)
      if (/^local\/[a-f0-9-]+\.(jpg|glb)$/.test(asset.objectKey))
        await unlink(
          resolve(
            process.cwd(),
            ".tmp/property-test-media",
            asset.objectKey.slice(6),
          ),
        ).catch(() => {});
    if (companies.length)
      await db.company.deleteMany({ where: { id: { in: companies } } });
  },
});
test.afterAll(async () => db.$disconnect());
export { expect };
