import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/server/page-auth";
import { AppError } from "@/lib/server/errors";
import { getPrivateListing } from "@/modules/listings/service";
import { ImmersiveViewer } from "@/components/tours/immersive-viewer";
export const metadata = { title: "Prévisualiser la visite | BARKA SARL" };
export default async function PrivateTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePageUser("properties.manage"),
    { id } = await params;
  const listing = await getPrivateListing(actor, id).catch((e: unknown) => {
    if (e instanceof AppError && (e.status === 404 || e.status === 403))
      notFound();
    throw e;
  });
  const panorama = listing.tours.find((t) => t.kind === "PANORAMA"),
    model = listing.tours.find((t) => t.kind === "MODEL_3D"),
    floor = listing.media.find((m) => m.id === listing.floorPlanAssetId);
  return (
    <>
      <p className="property-edit-note">
        Prévisualisation privée du dossier enregistré.
      </p>
      {!panorama && !model ? (
        <p className="team-empty">
          Ajoutez et enregistrez une visite dans le dossier du bien.
        </p>
      ) : (
        <ImmersiveViewer
          tour={{
            title: listing.title,
            backHref: `/espace/biens/${id}`,
            floorPlanUrl: floor?.url ?? null,
            modelUrl: model?.modelAssetId
              ? `/api/v1/media/${model.modelAssetId}`
              : null,
            scenes: (panorama?.scenes ?? []).map((s) => ({
              id: s.key,
              title: s.title,
              image: `/api/v1/media/${s.assetId}`,
              initialYaw: s.initialYaw,
              initialPitch: s.initialPitch,
              planX: s.planX,
              planY: s.planY,
              hotspots: s.hotspots.map((h, n) => ({
                id: `${s.key}-${n}`,
                label: h.label,
                targetSceneId: h.targetKey,
                yaw: h.yaw,
                pitch: h.pitch,
              })),
            })),
          }}
        />
      )}
    </>
  );
}
