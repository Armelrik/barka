import { assertSameOrigin } from "@/lib/server/http-security";
import { requireUser } from "@/lib/server/session";
import { consumeRateLimit } from "@/lib/server/rate-limit";
export async function authorizeVisitWrite(request: Request) {
  assertSameOrigin(request);
  const actor = await requireUser();
  await consumeRateLimit(`visits:write:${actor.id}`, 30, 900);
  return actor;
}
