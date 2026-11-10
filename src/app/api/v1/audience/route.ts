import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { collectAudience } from "@/modules/audience/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await collectAudience(request, await readJsonBody(request, 4096));
    return privateJson({ accepted: true }, 202);
  } catch (e) {
    return apiError(e);
  }
}
