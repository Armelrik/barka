import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizeVisitWrite } from "@/modules/visits/http";
import { changeVisit } from "@/modules/visits/service";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeVisitWrite(request),
      { id } = await params;
    return privateJson({
      visit: await changeVisit(actor.id, id, await readJsonBody(request)),
    });
  } catch (error) {
    return apiError(error);
  }
}
