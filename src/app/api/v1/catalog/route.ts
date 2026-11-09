import { apiError, privateJson } from "@/lib/server/errors";
import {
  databaseCatalogEnabled,
  publicCatalog,
} from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (!databaseCatalogEnabled())
      return privateJson({
        items: [],
        total: 0,
        page: 1,
        pageSize: 12,
        mode: "demo",
      });
    return privateJson(
      await publicCatalog(
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
