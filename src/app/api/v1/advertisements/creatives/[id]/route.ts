import { apiError } from "@/lib/server/errors";
import { creativeResponse } from "@/modules/advertising/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await creativeResponse((await params).id);
  } catch (e) {
    return apiError(e);
  }
}
