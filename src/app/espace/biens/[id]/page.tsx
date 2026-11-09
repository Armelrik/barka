import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/server/page-auth";
import { AppError } from "@/lib/server/errors";
import { getPrivateListing, propertyOptions } from "@/modules/listings/service";
import { PropertyForm } from "@/components/properties/property-form";
import { MediaEditor } from "@/components/properties/media-editor";
import { TourEditor } from "@/components/properties/tour-editor";
import { ListingActions } from "@/components/properties/listing-actions";
import { PropertyMap } from "@/components/map/property-map";
export const metadata = { title: "Dossier immobilier | BARKA SARL" };
const fail = (e: unknown): never => {
  if (e instanceof AppError && (e.status === 404 || e.status === 403))
    notFound();
  throw e;
};
export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const actor = await requirePageUser("properties.manage"),
    { id } = await params,
    listing = await getPrivateListing(actor, id).catch(fail),
    options = await propertyOptions(actor, listing.companyId);
  return (
    <>
      <div className="workspace-heading">
        <h1>{listing.title}</h1>
        <p>
          {listing.reference} · {listing.locationName}
        </p>
      </div>
      {(await searchParams).saved === "1" && (
        <p role="status" className="team-success">
          Le bien a été enregistré.
        </p>
      )}
      <p className="property-edit-note">
        Toute modification du dossier, des médias ou de la visite remet
        l’annonce en brouillon pour une nouvelle validation.
      </p>
      <nav className="property-sections" aria-label="Sections du dossier">
        <a href="#informations">Informations</a>
        <a href="#medias">Médias et documents</a>
        <a href="#visite">Visite immersive</a>
        <a href="#publication">Publication</a>
        <Link href="/espace/verification">Vérification des profils</Link>
      </nav>
      <div id="informations" className="property-panel">
        <PropertyForm
          key={listing.updatedAt}
          listing={listing}
          options={options}
          companyId={actor.companyId}
          global={actor.role.code === "SUPER_ADMIN"}
        />
      </div>
      {listing.latitude !== null && listing.longitude !== null && (
        <section className="property-panel">
          <h2>Localisation du dossier — privée</h2>
          <PropertyMap
            points={[
              {
                id: listing.id,
                title: listing.title,
                latitude: listing.latitude,
                longitude: listing.longitude,
              },
            ]}
          />
        </section>
      )}
      <div id="medias">
        <MediaEditor key={`media-${listing.updatedAt}`} listing={listing} />
      </div>
      <div id="visite">
        <TourEditor key={`tour-${listing.updatedAt}`} listing={listing} />
      </div>
      <div id="publication">
        <ListingActions
          key={`actions-${listing.updatedAt}`}
          listing={listing}
          canModerate={listing.canModerate}
        />
      </div>
    </>
  );
}
