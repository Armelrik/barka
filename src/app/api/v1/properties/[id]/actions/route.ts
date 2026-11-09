import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import { listingAction } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request);
    return privateJson({
      listing: await listingAction(
        actor.id,
        (await params).id,
        await readJsonBody(request),
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
