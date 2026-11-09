import { assertSameOrigin } from "@/lib/server/http-security";
import { requireUser } from "@/lib/server/session";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { uploadIdentity } from "@/modules/media/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    await consumeRateLimit(`identity:upload:${actor.id}`, 10, 3600);
    return privateJson(await uploadIdentity(actor, request), 201);
  } catch (e) {
    return apiError(e);
  }
}
