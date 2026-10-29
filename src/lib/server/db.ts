import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { barkaDb?: PrismaClient };
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante");
  const poolMax = Number(process.env.DATABASE_POOL_MAX ?? 5);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 20)
    throw new Error("DATABASE_POOL_MAX invalide");
  if (!globalDb.barkaDb)
    globalDb.barkaDb = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: poolMax,
      }),
    });
  return globalDb.barkaDb;
}
