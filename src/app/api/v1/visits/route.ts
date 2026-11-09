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
    return privateJson(
      { visit: await requestVisit(actor.id, await readJsonBody(request)) },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
