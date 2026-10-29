import { registerClient } from "@/modules/identity/service";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { clientRateKey, consumeRateLimit } from "@/lib/server/rate-limit";
import { saveSession } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await consumeRateLimit(
      `register:ingress:${clientRateKey(request)}`,
      10,
      3600,
    );
    const token = await registerClient(await readJsonBody(request));
    await saveSession(token);
    return privateJson({ next: "/espace" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
