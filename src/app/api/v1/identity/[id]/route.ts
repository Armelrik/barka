import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import { reviewIdentity } from "@/modules/media/service";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request, "identity.review");
    return privateJson(
      await reviewIdentity(
        actor.id,
        (await params).id,
        await readJsonBody(request),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
