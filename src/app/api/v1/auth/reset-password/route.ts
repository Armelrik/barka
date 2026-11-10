import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit, clientRateKey } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { completePasswordReset } from "@/modules/identity/recovery";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await consumeRateLimit(`recovery:reset:${clientRateKey(request)}`, 15, 900);
    await completePasswordReset(await readJsonBody(request));
    return privateJson({ next: "/connexion?passwordChanged=1" });
  } catch (e) {
    return apiError(e);
  }
}
