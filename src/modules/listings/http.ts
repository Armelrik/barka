import { assertSameOrigin } from "@/lib/server/http-security";
import { requireUser } from "@/lib/server/session";
import { consumeRateLimit } from "@/lib/server/rate-limit";
export async function authorizePropertyWrite(
  request: Request,
  permission = "properties.manage",
) {
  assertSameOrigin(request);
  const actor = await requireUser(permission);
  await consumeRateLimit(`properties:write:${actor.id}`, 100, 900);
  return actor;
}
