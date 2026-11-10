import { requireUser } from "@/lib/server/session";
import { apiError } from "@/lib/server/errors";
import { audienceReport, audienceCsv } from "@/modules/audience/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams,
      report = await audienceReport(await requireUser(), Object.fromEntries(q));
    const kind = q.get("kind") === "campaigns" ? "campaigns" : "audience";
    return new Response(audienceCsv(report, kind), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="barka-${kind}-${report.from}-${report.to}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
