import { currentUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { publicAvailability } from "@/modules/availability/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    return privateJson(
      await publicAvailability((await params).slug, (await currentUser())?.id),
    );
  } catch (e) {
    return apiError(e);
  }
}
