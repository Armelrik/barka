import { apiError } from "@/lib/server/errors";
import { mediaResponse } from "@/modules/media/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await mediaResponse((await params).id);
  } catch (e) {
    return apiError(e);
  }
}
