import { timingSafeEqual } from "node:crypto";
import { apiError, privateJson, AppError } from "@/lib/server/errors";
import { deliverMailBatch } from "@/modules/messaging/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET
      ? `Bearer ${process.env.CRON_SECRET}`
      : "";
    const actual = request.headers.get("authorization") || "";
    if (
      !expected ||
      Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
    )
      throw new AppError(401, "UNAUTHENTICATED", "Accès refusé.");
    return privateJson(await deliverMailBatch(4));
  } catch (e) {
    return apiError(e);
  }
}
