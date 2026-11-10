import "dotenv/config";
const { deliverMailBatch } =
  await import("../src/modules/messaging/service.ts");
const result = await deliverMailBatch(20);
console.log(
  result.configured
    ? `Messages acceptés par le prestataire : ${result.sent}.`
    : "Envoi externe non configuré. Aucun email envoyé.",
);
const { getDb } = await import("../src/lib/server/db.ts");
if (process.env.DATABASE_URL) await getDb().$disconnect();
