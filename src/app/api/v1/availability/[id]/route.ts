import { apiError, privateJson } from "@/lib/server/errors";
import { authorizeVisitWrite } from "@/modules/visits/http";
import { removeAvailability } from "@/modules/availability/service";
export const runtime = "nodejs";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeVisitWrite(request);
    await removeAvailability(actor.id, (await params).id);
    return privateJson({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
