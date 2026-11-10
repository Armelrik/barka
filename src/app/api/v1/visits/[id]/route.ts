import { after } from "next/server";
import { deliverMailBatch } from "@/modules/messaging/service";
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
    const visit = await changeVisit(actor.id, id, await readJsonBody(request));
    after(async () => {
      await deliverMailBatch(2);
    });
    return privateJson({ visit });
  } catch (error) {
    return apiError(error);
  }
}
