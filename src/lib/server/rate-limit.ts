import "server-only";
import { createHmac } from "node:crypto";
import { getDb } from "./db";
import { getAuthConfig } from "./auth-config";
import { AppError } from "./errors";
export async function consumeRateLimit(
  key: string,
  maximum: number,
  windowSeconds: number,
) {
  const keyHash = createHmac("sha256", getAuthConfig().secret)
    .update(key)
    .digest("hex");
  const rows = await getDb().$queryRaw<
    { attempts: number; windowStart: Date }[]
  >`
    INSERT INTO "AuthRateLimit" ("keyHash", "attempts", "windowStart")
    VALUES (${keyHash}, 1, NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "attempts" = CASE WHEN "AuthRateLimit"."windowStart" <= NOW() - ${windowSeconds} * INTERVAL '1 second' THEN 1 ELSE "AuthRateLimit"."attempts" + 1 END,
      "windowStart" = CASE WHEN "AuthRateLimit"."windowStart" <= NOW() - ${windowSeconds} * INTERVAL '1 second' THEN NOW() ELSE "AuthRateLimit"."windowStart" END
    RETURNING "attempts", "windowStart"
  `;
  if (rows[0].attempts > maximum)
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Trop de tentatives. Veuillez patienter avant de réessayer.",
      Math.max(
        1,
        Math.ceil(
          (rows[0].windowStart.getTime() + windowSeconds * 1000 - Date.now()) /
            1000,
        ),
      ),
    );
}
export function clientRateKey(request: Request) {
  // Never trust spoofable proxy headers without an explicit, reviewed ingress configuration.
  if (process.env.AUTH_TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      .trim();
    if (forwarded && /^[\da-fA-F:.]{3,45}$/.test(forwarded)) return forwarded;
  }
  return "untrusted-shared-ingress";
}
