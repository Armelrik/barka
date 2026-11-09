import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import { saveTour } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request);
    return privateJson({
      listing: await saveTour(
        actor.id,
        (await params).id,
        await readJsonBody(request, 262144),
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
