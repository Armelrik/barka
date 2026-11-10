import { after } from "next/server";
import { deliverMailBatch } from "@/modules/messaging/service";
import { requireUser } from "@/lib/server/session";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizeVisitWrite } from "@/modules/visits/http";
import { listVisits, requestVisit } from "@/modules/visits/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return privateJson(
      await listVisits(
        await requireUser(),
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizeVisitWrite(request);
    const visit = await requestVisit(actor.id, await readJsonBody(request));
    after(async () => {
      await deliverMailBatch(2);
    });
    return privateJson({ visit }, 201);
  } catch (error) {
    return apiError(error);
  }
}
