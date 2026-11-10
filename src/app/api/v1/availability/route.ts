import { requireUser } from "@/lib/server/session";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizeVisitWrite } from "@/modules/visits/http";
import {
  availabilityWorkspace,
  createAvailability,
  setAvailabilityMode,
} from "@/modules/availability/service";
export const runtime = "nodejs";
export async function GET() {
  try {
    return privateJson({
      agents: await availabilityWorkspace(
        await requireUser("properties.manage"),
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizeVisitWrite(request);
    return privateJson(
      await createAvailability(actor.id, await readJsonBody(request)),
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    const actor = await authorizeVisitWrite(request);
    await setAvailabilityMode(actor.id, await readJsonBody(request));
    return privateJson({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
