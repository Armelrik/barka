import { apiError, AppError, privateJson } from "@/lib/server/errors";
import {
  databaseCatalogEnabled,
  publicListing,
} from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const listing = databaseCatalogEnabled() ? await publicListing(slug) : null;
    if (!listing) throw new AppError(404, "NOT_FOUND", "Bien introuvable.");
    return privateJson(listing);
  } catch (error) {
    return apiError(error);
  }
}
