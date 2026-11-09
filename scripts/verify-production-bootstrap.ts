import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { compare } from "bcryptjs";
import { authenticate, registerClient } from "../src/modules/identity/service";
import { getDb } from "../src/lib/server/db";
import { hashSessionToken } from "../src/lib/server/session";
import { bootstrapProduction } from "../src/modules/deployment/bootstrap";
async function main() {
  const url = process.env.TEST_DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error("Une base locale de test vide et migrée est requise.");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 1 }),
  });
  try {
    assert.equal(
      await db.user.count(),
      0,
      "La base de vérification doit être vide de comptes.",
    );
    const password = randomBytes(24).toString("hex");
    const data = {
      companyCode: "BARKA-PRODUCTION-TEST",
      companyName: "Société fictive de vérification",
      admin: {
        firstName: "Compte",
        lastName: "Initial",
        phone: "+22600001111",
        email: "bootstrap-test@barka.example",
        password,
      },
      defaultPhone: "+22600002222",
    };
    assert.equal((await bootstrapProduction(db, data)).created, true);
    const company = await db.company.findUniqueOrThrow({
      where: { code: data.companyCode },
    });
    const first = await db.user.findUniqueOrThrow({
      where: { phone: data.admin.phone },
    });
    assert.ok(
      await compare(password, first.passwordHash),
      "Le mot de passe initial doit être haché correctement.",
    );
    assert.equal(
      (
        await bootstrapProduction(db, {
          ...data,
          admin: { ...data.admin, password: randomBytes(24).toString("hex") },
        })
      ).created,
      false,
    );
    const second = await db.user.findUniqueOrThrow({ where: { id: first.id } });
    assert.ok(
      second.passwordHash === first.passwordHash,
      "La relance doit conserver le mot de passe.",
    );
    assert.equal(await db.user.count(), 2);
    assert.equal(await db.property.count(), 0);
    assert.equal(await db.subscriptionPlan.count(), 0);
    const routing = await db.user.findUniqueOrThrow({
      where: { id: company.defaultCommercialId! },
      include: { role: true, agentProfile: true, parentLink: true },
    });
    assert.equal(routing.role.code, "DEFAULT_COMMERCIAL");
    assert.equal(routing.parentLink?.parentId, first.id);
    assert.ok(routing.agentProfile?.identifier);
    assert.equal(
      await db.auditLog.count({ where: { action: "PRODUCTION_BOOTSTRAPPED" } }),
      1,
    );
    await assert.rejects(
      bootstrapProduction(db, { ...data, companyCode: "ANOTHER-COMPANY" }),
    );
    assert.equal(
      await db.company.count({ where: { code: "ANOTHER-COMPANY" } }),
      0,
      "Une collision doit annuler toute la transaction.",
    );
    const clientRole = await db.role.findUniqueOrThrow({
      where: { code: "CLIENT" },
      include: { permissions: true },
    });
    assert.equal(clientRole.permissions.length, 0);
    const root = await db.role.findUniqueOrThrow({
      where: { code: "SUPER_ADMIN" },
      include: { permissions: true },
    });
    assert.equal(root.permissions.length, 6);
    Object.assign(process.env, {
      DATABASE_URL: url,
      DATABASE_POOL_MAX: "1",
      NODE_ENV: "production",
      AUTH_SECRET: randomBytes(48).toString("hex"),
      AUTH_URL: "http://127.0.0.1:3003",
      BARKA_COMPANY_CODE: data.companyCode,
      REGISTRATION_ENABLED: "false",
      LEGAL_DOCUMENTS_APPROVED: "false",
    });
    const loginToken = await authenticate({
      identifier: data.admin.phone,
      password,
    });
    assert.equal(
      await db.authSession.count({
        where: { userId: first.id, tokenHash: hashSessionToken(loginToken) },
      }),
      1,
    );
    const client = {
      firstName: "Client",
      lastName: "Initial",
      phone: "+22600003333",
      email: "production-client@barka.example",
      password: randomBytes(24).toString("hex"),
      consent: true,
    };
    await assert.rejects(
      registerClient(client),
      (error: unknown) =>
        !!error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "REGISTRATION_CLOSED",
    );
    Object.assign(process.env, {
      REGISTRATION_ENABLED: "true",
      LEGAL_DOCUMENTS_APPROVED: "true",
    });
    const token = await registerClient(client);
    const registered = await db.user.findUniqueOrThrow({
      where: { phone: client.phone },
      include: { parentLink: true, role: true },
    });
    assert.equal(registered.role.code, "CLIENT");
    assert.equal(registered.parentLink?.parentId, routing.id);
    assert.equal(
      await db.authSession.count({
        where: { userId: registered.id, tokenHash: hashSessionToken(token) },
      }),
      1,
    );
    console.info(
      "Initialisation production vérifiée : 2 comptes initiaux, relance idempotente, mots de passe conservés, collision annulée, connexion administrateur et inscription client rattachée au commercial par défaut. Aucun bien ni tarif fictif.",
    );
  } finally {
    await db.$disconnect();
    await getDb().$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Échec de vérification de l’initialisation. Vérifier la base isolée et les assertions ; aucun secret affiché.",
  );
  process.exitCode = 1;
});
