import { authenticate } from "@/modules/identity/service";
import { loginSchema } from "@/modules/identity/validation";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { clientRateKey, consumeRateLimit } from "@/lib/server/rate-limit";
import { saveSession } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await consumeRateLimit(`login:ingress:${clientRateKey(request)}`, 100, 900);
    const data = loginSchema.parse(await readJsonBody(request));
    await consumeRateLimit(`login:identity:${data.identifier}`, 5, 900);
    await saveSession(await authenticate(data));
    return privateJson({ next: "/espace" });
  } catch (error) {
    return apiError(error);
  }
}
