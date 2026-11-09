import { apiError, AppError, privateJson } from "@/lib/server/errors";
import { databaseCatalogEnabled, publicTour } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const tour = databaseCatalogEnabled() ? await publicTour(slug) : null;
    if (!tour) throw new AppError(404, "NOT_FOUND", "Visite introuvable.");
    return privateJson(tour);
  } catch (error) {
    return apiError(error);
  }
}
