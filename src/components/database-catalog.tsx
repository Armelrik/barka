import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import {
  catalogSearchParams,
  catalogQueryFields,
} from "@/modules/catalog/query";
import { mergeNeighborhoods } from "@/modules/catalog/locations";
import { propertyTypeLabels } from "@/modules/listings/validation";
import { SaveSearch } from "@/components/account/saved-search";
import { currentUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { FavoriteButton } from "@/components/account/favorite-button";
import Link from "next/link";
import { PropertyCarousel } from "@/components/property-carousel";
import { MapPin, BedDouble, Bath, ScanEye, Map } from "lucide-react";
import {
  publicCatalog,
  publicCatalogLocations,
} from "@/modules/listings/service";
import { publicQuerySchema } from "@/modules/listings/validation";
import { formatXof } from "@/lib/utils";
export async function DatabaseCatalog({
  query = {},
  featured = false,
  favoriteUserId,
}: {
  query?: Record<string, string | undefined>;
  featured?: boolean;
  favoriteUserId?: string;
}) {
  const parsed = publicQuerySchema.safeParse(query),
    q = parsed.success ? parsed.data : publicQuerySchema.parse({});
  const result = await publicCatalog(q, featured, favoriteUserId).catch(
    () => null,
  );
  const actor = await currentUser();
  const saved =
    actor && result
      ? await getDb().favorite.findMany({
          where: {
            userId: actor.id,
            listing: { slug: { in: result.items.map((p) => p.slug) } },
          },
          select: { listing: { select: { slug: true } } },
        })
      : [];
  const savedSlugs = new Set(saved.map((f) => f.listing.slug));
  const basePath = favoriteUserId ? "/espace/favoris" : "/biens";
  const page = (n: number) => `${basePath}?${catalogSearchParams(q, n)}`;
  const options = featured
    ? { cities: [], neighborhoods: [] }
    : await publicCatalogLocations().catch(() => ({
        cities: ["Ouagadougou"],
        neighborhoods: mergeNeighborhoods([]),
      }));
  const Heading = featured ? "h2" : "h1";
  const examplesOnly =
    !!result?.items.length && result.items.every((p) => p.isDemo);
  return (
    <section id="catalogue" className="catalog-section shell">
      <div className="section-heading">
        <Heading>
          {favoriteUserId
            ? "Mes favoris"
            : featured
              ? "Notre sélection de propriétés"
              : "Toutes les propriétés"}
        </Heading>
        <p>
          {favoriteUserId
            ? "Votre sélection vous suit sur tous vos appareils. Seuls les biens encore publiés apparaissent ici."
            : examplesOnly
              ? "Découvrez les biens de présentation : photos, quartiers et prix illustratifs."
              : "Trouvez votre prochain bien selon votre projet, votre quartier et votre budget."}
        </p>
      </div>
      <CatalogExplorerWrapper
        featured={featured}
        query={catalogQueryFields.parse(q)}
        page={q.page}
        total={result?.total ?? null}
        options={options}
        basePath={basePath}
        extras={
          actor && !favoriteUserId ? (
            <SaveSearch
              key={JSON.stringify(q)}
              filters={catalogQueryFields.parse(q)}
            />
          ) : undefined
        }
      >
        {!featured && (
          <div className="catalog-toolbar">
            <Link href="/carte">
              <Map size={18} /> Voir sur la carte
            </Link>
          </div>
        )}
        {!result ? (
          <p className="empty-state" role="status">
            Le catalogue est momentanément indisponible. Réessayez dans un
            instant.
          </p>
        ) : result.items.length ? (
          <div className="property-grid">
            {result.items.map((p) => (
              <article className="property-card" key={p.slug}>
                <PropertyCarousel
                  photos={p.photos}
                  title={p.title}
                  href={`/biens/${p.slug}`}
                  unoptimized
                />
                <div className="card-top">
                  <span className="type-badge">
                    {p.offer === "SALE" ? "À vendre" : "À louer"}
                  </span>
                  {p.hasTour && (
                    <Link className="tour-badge" href={`/visites/${p.slug}`}>
                      <ScanEye size={16} />
                      Visite immersive
                    </Link>
                  )}
                </div>
                <div className="card-body">
                  {p.isDemo && (
                    <span className="offer-badge">BIEN DE PRÉSENTATION</span>
                  )}
                  <FavoriteButton
                    key={`${p.slug}:${savedSlugs.has(p.slug)}`}
                    slug={p.slug}
                    title={p.title}
                    saved={savedSlugs.has(p.slug)}
                    authenticated={!!actor}
                  />
                  <h3>
                    <Link href={`/biens/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p className="card-location">
                    <MapPin size={16} />
                    {p.location}, {p.city}
                  </p>
                  <p className="property-kind">
                    {propertyTypeLabels[p.type] ?? "Bien immobilier"} ·{" "}
                    {p.offer === "SALE" ? "Vente" : "Location"}
                    {p.furnishing
                      ? ` · ${p.furnishing === "FURNISHED" ? "Meublé" : "Non meublé"}`
                      : ""}
                    {p.rentalDuration
                      ? ` · ${p.rentalDuration === "SHORT" ? "Courte durée" : "Longue durée"}`
                      : ""}
                  </p>
                  <p className="property-description">{p.description}</p>
                  <div className="card-features">
                    {p.bedrooms > 0 && (
                      <span>
                        <BedDouble size={18} />
                        {p.bedrooms} ch.
                      </span>
                    )}
                    {p.bathrooms > 0 && (
                      <span>
                        <Bath size={18} />
                        {p.bathrooms} sdb.
                      </span>
                    )}
                    <span>{p.surfaceM2} m²</span>
                  </div>
                  <div className="card-price">
                    <strong>
                      {formatXof(p.priceXof)}
                      {p.offer === "RENT" && (
                        <small>
                          {" "}
                          /{" "}
                          {p.rentPricePeriod === "NIGHT"
                            ? "nuit"
                            : p.rentPricePeriod === "WEEK"
                              ? "semaine"
                              : "mois"}
                        </small>
                      )}
                    </strong>
                  </div>
                  <Link
                    href={`/biens/${p.slug}`}
                    className="card-details-link"
                    aria-label={`Voir le bien : ${p.title}`}
                  >
                    Voir le bien <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>
              {favoriteUserId
                ? "Aucun favori disponible pour le moment."
                : "Aucune annonce publiée ne correspond à votre recherche."}
            </h3>
            <Link href="/biens" className="text-link">
              Effacer les filtres
            </Link>
          </div>
        )}
        {featured ? (
          <div className="text-center mt-10">
            <Link href="/biens" className="legacy-button">
              Voir Toutes les Propriétés
            </Link>
          </div>
        ) : (
          result && (
            <nav
              className="team-pagination"
              aria-label="Pagination du catalogue"
            >
              {result.page > 1 && (
                <Link href={page(result.page - 1)} scroll={false}>
                  Précédente
                </Link>
              )}
              <span>
                Page {result.page} sur{" "}
                {Math.max(1, Math.ceil(result.total / result.pageSize))}
              </span>
              {result.page * result.pageSize < result.total && (
                <Link href={page(result.page + 1)} scroll={false}>
                  Suivante
                </Link>
              )}
            </nav>
          )
        )}
      </CatalogExplorerWrapper>
    </section>
  );
}

function CatalogExplorerWrapper({
  featured,
  children,
  ...props
}: React.ComponentProps<typeof CatalogExplorer> & { featured: boolean }) {
  return featured ? (
    <>{children}</>
  ) : (
    <CatalogExplorer key={JSON.stringify(props.query)} {...props}>
      {children}
    </CatalogExplorer>
  );
}
