import { requireUser } from "@/lib/server/session";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { manageAds, assertSuper, saveAd } from "@/modules/advertising/service";
export const runtime = "nodejs";
export async function GET() {
  try {
    return privateJson(await manageAds(await requireUser()));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    assertSuper(actor);
    await consumeRateLimit(`ads:write:${actor.id}`, 40, 900);
    return privateJson(
      await saveAd(actor.id, await readJsonBody(request)),
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
