import { notFound } from "next/navigation";
import { ImmersiveViewer } from "@/components/tours/immersive-viewer";
import { publicTour, databaseCatalogEnabled } from "@/modules/listings/service";
export const dynamic = "force-dynamic";
export const metadata = { title: "Visite immersive | BARKA SARL" };
export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!databaseCatalogEnabled()) notFound();
  const tour = await publicTour((await params).slug);
  if (!tour) notFound();
  return (
    <main id="contenu">
      <ImmersiveViewer tour={tour} />
    </main>
  );
}
