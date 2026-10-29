import "dotenv/config";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Explicit, local test database only. Apply migrations before running this check.
const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.NODE_ENV === "production")
  throw new Error("TEST_DATABASE_URL locale requise, hors production");
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  throw new Error("Ce test est réservé à une base locale dédiée");
const root = fileURLToPath(new URL("../", import.meta.url));
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 5 }),
});
const run = promisify(execFile);
async function seed() {
  await run(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url),
      ),
      "prisma/seed.ts",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL: url,
        DEMO_PASSWORD: randomBytes(24).toString("hex"),
      },
      timeout: 90000,
    },
  );
}
async function snapshot() {
  const company = await db.company.findUniqueOrThrow({
    where: { code: "BARKA-DEMO" },
  });
  return {
    defaultCommercialId: company.defaultCommercialId,
    users: await db.user.findMany({
      where: { companyId: company.id },
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        agentProfile: { select: { identifier: true } },
      },
    }),
    properties: await db.property.count({ where: { companyId: company.id } }),
    listings: await db.listing.findMany({
      where: { property: { companyId: company.id } },
      orderBy: { slug: "asc" },
      select: { id: true, status: true, priceXof: true },
    }),
    hierarchy: await db.userHierarchy.count({
      where: { child: { companyId: company.id } },
    }),
    plans: await db.subscriptionPlan.findMany({
      where: { companyId: company.id },
      orderBy: { code: "asc" },
    }),
    settings: await db.setting.findMany({
      where: { companyId: company.id },
      orderBy: { key: "asc" },
    }),
    sequence: await db.annualSequence.findUnique({
      where: { year: new Date().getUTCFullYear() },
    }),
  };
}
async function main() {
  await seed();
  const first = await snapshot();
  await seed(); // A DIFFERENT password must not reset the existing hashes.
  assert.deepEqual(await snapshot(), first);
  assert.equal(first.users.length, 7);
  assert.equal(first.properties, 4);
  assert.equal(first.listings.length, 4);
  assert.equal(first.hierarchy, 6);
  assert.equal(first.plans.length, 3);
  assert.ok(first.defaultCommercialId);
  assert.ok(first.listings.every((p) => p.status === "DRAFT"));
  const identifiers = first.users.flatMap((user) =>
    user.agentProfile ? [user.agentProfile.identifier] : [],
  );
  assert.equal(identifiers.length, 2);
  assert.equal(new Set(identifiers).size, 2);
  assert.ok(identifiers.every((id) => /^BARKA-D\d{9}$/.test(id)));
  console.info(
    "Base vérifiée : seed exécuté deux fois, comptes/hash/tarifs/paramètres/numéros inchangés, 7 comptes, 4 biens en brouillon, 6 rattachements.",
  );
}
main()
  .catch(() => {
    console.error(
      "Vérification de la base échouée ; utiliser une base de test locale dédiée avec les migrations appliquées.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
