import { DatabaseCatalog } from "@/components/database-catalog";
import { databaseCatalogEnabled } from "@/modules/listings/service";
export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Catalog } from "@/components/catalog";
export const metadata = { title: "Toutes les Propriétés | BARKA SARL" };
export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="public-page">
        {databaseCatalogEnabled() ? (
          <DatabaseCatalog query={await searchParams} />
        ) : (
          <Catalog listingPage />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
