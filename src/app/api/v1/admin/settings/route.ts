import { requireUser } from "@/lib/server/session";
import { authorizePropertyWrite } from "@/modules/listings/http";
import { readSettings, saveSettings } from "@/modules/backoffice/service";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function GET() {
  try {
    return privateJson(
      await readSettings(await requireUser("settings.manage")),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    const actor = await authorizePropertyWrite(request, "settings.manage");
    await saveSettings(actor.id, await readJsonBody(request));
    return privateJson({ saved: true });
  } catch (e) {
    return apiError(e);
  }
}
