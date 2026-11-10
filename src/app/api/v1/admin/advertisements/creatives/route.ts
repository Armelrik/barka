import { requireUser } from "@/lib/server/session";
import { assertSameOrigin } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { assertSuper, uploadCreative } from "@/modules/advertising/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    assertSuper(actor);
    await consumeRateLimit(`ads:media:${actor.id}`, 20, 900);
    return privateJson(await uploadCreative(actor, request), 201);
  } catch (e) {
    return apiError(e);
  }
}
