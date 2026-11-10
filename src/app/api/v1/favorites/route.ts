import { requireUser } from "@/lib/server/session";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { saveFavorite } from "@/modules/favorites/service";
import { publicCatalog } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    return privateJson(
      await publicCatalog(
        Object.fromEntries(new URL(request.url).searchParams),
        false,
        user.id,
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await consumeRateLimit(`favorites:${user.id}`, 100, 900);
    await saveFavorite(user.id, await readJsonBody(request));
    return privateJson({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
