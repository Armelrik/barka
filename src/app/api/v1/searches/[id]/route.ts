import { requireUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { assertSameOrigin } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await consumeRateLimit(`searches:${user.id}`, 30, 900);
    await getDb().savedSearch.deleteMany({
      where: { userId: user.id, id: (await params).id },
    });
    return privateJson({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
