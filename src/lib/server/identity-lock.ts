import "server-only";
import type { Prisma } from "@/generated/prisma/client";
/** Serialize hierarchy/role/status writes and session creation across Node instances.
 * Acquire before reading actor/target/default commercial, inside the business transaction.
 */
export async function lockIdentity(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(226202611)::text`;
}
