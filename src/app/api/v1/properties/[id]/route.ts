import { requireUser } from "@/lib/server/session";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import { getPrivateListing, updateProperty } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return privateJson({
      listing: await getPrivateListing(
        await requireUser("properties.manage"),
        (await params).id,
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request);
    return privateJson({
      listing: await updateProperty(
        actor.id,
        (await params).id,
        await readJsonBody(request, 16384),
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
