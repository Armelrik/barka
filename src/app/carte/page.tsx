import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyMap } from "@/components/map/property-map";
import {
  databaseCatalogEnabled,
  publicMapPoints,
} from "@/modules/listings/service";
import { demoProperties } from "@/modules/catalog/demo";
export const dynamic = "force-dynamic";
export const metadata = { title: "Carte des biens | BARKA SARL" };
export default async function MapPage() {
  const database = databaseCatalogEnabled();
  const points = database
    ? await publicMapPoints().catch(() => null)
    : demoProperties.map((p) => ({
        id: p.reference,
        title: p.title,
        latitude: p.coordinates[0],
        longitude: p.coordinates[1],
        href: `/biens/${p.slug}`,
      }));
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="public-page shell pb-16">
        <div className="section-heading pt-8">
          <h1>Les biens sur la carte</h1>
          <p>
            {database
              ? "Localisations publiques approximatives des annonces publiées."
              : "Démonstration : points fictifs et approximatifs, sans adresse réelle de bien."}
          </p>
        </div>
        {points ? (
          <>
            <PropertyMap points={points} />
            <p className="map-disclaimer">
              {points.length} point(s) affiché(s)
              {database
                ? " · Jusqu’à 100 annonces récentes avec localisation autorisée."
                : " · Biens de démonstration."}
            </p>
            <div className="map-list">
              {points.map((p) => (
                <Link href={p.href} key={p.id}>
                  {p.title}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p role="status">
            La liste des biens est momentanément indisponible.
          </p>
        )}
        <Link className="text-link mt-6" href="/biens">
          Revenir au catalogue
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
