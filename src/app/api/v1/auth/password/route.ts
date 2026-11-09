import { requireUser, destroySession } from "@/lib/server/session";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { changeOwnPassword } from "@/modules/identity/password";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    await consumeRateLimit(`password:change:${actor.id}`, 5, 900);
    await changeOwnPassword(actor.id, await readJsonBody(request));
    await destroySession();
    return privateJson({ next: "/connexion?passwordChanged=1" });
  } catch (error) {
    return apiError(error);
  }
}
