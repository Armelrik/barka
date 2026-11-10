import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { assertSuper, saveAd } from "@/modules/advertising/service";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    assertSuper(actor);
    await consumeRateLimit(`ads:write:${actor.id}`, 40, 900);
    const raw = await readJsonBody(request);
    const { expectedUpdatedAt, ...data } = z
      .object({ expectedUpdatedAt: z.iso.datetime({ offset: true }) })
      .passthrough()
      .parse(raw);
    return privateJson(
      await saveAd(actor.id, data, (await params).id, expectedUpdatedAt),
    );
  } catch (e) {
    return apiError(e);
  }
}
