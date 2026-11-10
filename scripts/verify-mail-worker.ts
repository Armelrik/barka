import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { getDb } from "../src/lib/server/db";
import { queueMail, deliverMailBatch } from "../src/modules/messaging/service";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
)
  throw new Error("Une base locale de test explicite est requise.");
process.env.DATABASE_URL = url;
process.env.DATABASE_POOL_MAX = "1";
process.env.AUTH_SECRET = randomBytes(48).toString("hex");
process.env.AUTH_URL = "http://127.0.0.1:3002";
process.env.MAIL_PROVIDER = "resend";
process.env.RESEND_API_KEY = "isolated-local-stub";
process.env.MAIL_FROM = "BARKA <sender@barka.example>";
const db = getDb(),
  id = `mail-worker-${randomUUID()}`;
let calls = 0,
  fail = false;
const previousFetch = globalThis.fetch;
// No external network request is permitted in this verification.
globalThis.fetch = async (input, init) => {
  assert.equal(String(input), "https://api.resend.com/emails");
  assert(init?.headers && new Headers(init.headers).has("Idempotency-Key"));
  calls++;
  return Response.json(fail ? {} : { id: `accepted-${calls}` }, {
    status: fail ? 503 : 200,
  });
};
try {
  const role = await db.role.findUniqueOrThrow({ where: { code: "CLIENT" } });
  const company = await db.company.findUniqueOrThrow({
    where: { code: "BARKA-DEMO" },
  });
  await db.user.create({
    data: {
      id,
      firstName: "Mail",
      lastName: "Fixture",
      email: `${id}@barka.example`,
      phone: `+999${Date.now()}`,
      passwordHash: "unusable-fixture-hash",
      roleId: role.id,
      companyId: company.id,
    },
  });
  async function enqueue(key: string, expiresAt?: Date) {
    await db.$transaction((tx) =>
      queueMail(
        tx,
        id,
        key,
        {
          to: `${id}@barka.example`,
          subject: "Local verification",
          text: "private fixture body",
        },
        expiresAt,
      ),
    );
  }
  const key = `local-mail:${randomUUID()}`;
  await enqueue(key);
  const stored = await db.mailDelivery.findUniqueOrThrow({ where: { key } });
  assert(!stored.payload.includes("private fixture body"));
  const pair = await Promise.all([deliverMailBatch(1), deliverMailBatch(1)]);
  assert.equal(
    pair.reduce((n, r) => n + r.sent, 0),
    1,
  );
  assert.equal(calls, 1);
  const sent = await db.mailDelivery.findUniqueOrThrow({ where: { key } });
  assert.equal(sent.status, "SENT");
  assert.equal(sent.payload, "");
  const retryKey = `local-mail:${randomUUID()}`;
  await enqueue(retryKey);
  fail = true;
  await deliverMailBatch(1);
  const pending = await db.mailDelivery.findUniqueOrThrow({
    where: { key: retryKey },
  });
  assert.equal(pending.status, "PENDING");
  assert(pending.nextRunAt > new Date());
  await db.mailDelivery.update({
    where: { key: retryKey },
    data: { attempts: 4, nextRunAt: new Date(Date.now() - 1000) },
  });
  await deliverMailBatch(1);
  const failed = await db.mailDelivery.findUniqueOrThrow({
    where: { key: retryKey },
  });
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.payload, "");
  const expiredKey = `local-mail:${randomUUID()}`;
  await enqueue(expiredKey, new Date(Date.now() - 1000));
  const before = calls;
  await deliverMailBatch(1);
  assert.equal(calls, before);
  console.log(
    "Worker local : chiffrement, concurrence, acceptation, reprise, arrêt à cinq tentatives et expiration validés. Aucun email réel envoyé.",
  );
} finally {
  globalThis.fetch = previousFetch;
  await db.user.deleteMany({ where: { id } });
  await db.$disconnect();
}
