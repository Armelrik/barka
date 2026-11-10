import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { audienceReport } from "@/modules/audience/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return privateJson(
      await audienceReport(
        await requireUser(),
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
