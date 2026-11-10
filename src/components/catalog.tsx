"use client";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { mergeNeighborhoods } from "@/modules/catalog/locations";
import { useState, useSyncExternalStore } from "react";
import { PropertyCarousel } from "@/components/property-carousel";
import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  Bath,
  Heart,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoProperties } from "@/modules/catalog/demo";
import { demoPhotos } from "@/modules/catalog/visuals";
import {
  filterProperties,
  catalogFiltersSchema,
  type CatalogFilters,
} from "@/modules/catalog/filters";
import { formatXof } from "@/lib/utils";

const defaults = catalogFiltersSchema.parse({});
const storageKey = "barka.demo.favorites";
function getFavorites() {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("barka-favorites", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("barka-favorites", listener);
  };
}
function parseFavorites(raw: string): string[] {
  try {
    const ids: unknown = JSON.parse(raw);
    return Array.isArray(ids)
      ? ids.filter(
          (id): id is string =>
            typeof id === "string" &&
            demoProperties.some((p) => p.reference === id),
        )
      : [];
  } catch {
    return [];
  }
}

export function Catalog({
  listingPage = false,
  initialQuery,
}: {
  listingPage?: boolean;
  initialQuery?: CatalogFilters;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(
    initialQuery ?? defaults,
  );
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [notice, setNotice] = useState("");
  const rawFavorites = useSyncExternalStore(
    subscribe,
    getFavorites,
    () => "[]",
  );
  const favorites = parseFavorites(rawFavorites);
  const results = filterProperties(demoProperties, filters).filter(
    (p) => !favoritesOnly || favorites.includes(p.reference),
  );
  function toggleFavorite(id: string) {
    const previous = parseFavorites(getFavorites());
    const removing = previous.includes(id);
    const next = removing
      ? previous.filter((item) => item !== id)
      : [...previous, id];
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event("barka-favorites"));
      setNotice(
        removing
          ? "Bien retiré de vos favoris."
          : "Bien ajouté à vos favoris sur cet appareil.",
      );
    } catch {
      setNotice("Votre navigateur ne permet pas d’enregistrer les favoris.");
    }
  }
  function reset() {
    setFilters(defaults);
    setFavoritesOnly(false);
  }
  return (
    <section id="catalogue" className="catalog-section shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LA SÉLECTION BARKA</span>
          {listingPage ? (
            <h1>Toutes les Propriétés</h1>
          ) : (
            <h2>Propriétés en Vedette</h2>
          )}
        </div>
        <p>
          Découvrez les meilleures propriétés à louer et à vendre au Burkina
          Faso
        </p>
      </div>
      <DemoExplorer
        listingPage={listingPage}
        query={filters}
        total={results.length}
        onApply={setFilters}
      >
        {listingPage && (
          <div className="catalog-toolbar">
            <button
              type="button"
              className="favorites-filter"
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              <Heart size={17} /> Mes favoris {favorites.length}
            </button>
          </div>
        )}
        <p role="status" className="sr-only">
          {notice}
        </p>
        {results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              {favoritesOnly ? <Heart size={26} /> : <Search size={26} />}
            </span>
            <h3>
              {favoritesOnly
                ? "Aucun favori pour le moment."
                : "Aucun exemple ne correspond à votre recherche."}
            </h3>
            <p>
              {favoritesOnly
                ? "Un bien vous plaît ? Touchez son cœur pour le retrouver ici."
                : "Essayez un autre quartier ou un budget plus large."}
            </p>
            <Button variant="outline" onClick={reset}>
              Afficher tous les exemples <X size={16} />
            </Button>
          </div>
        ) : (
          <div className="property-grid">
            {(listingPage ? results : results.slice(0, 3)).map((p) => (
              <article
                key={p.reference}
                className={`property-card property-card-${p.illustration}`}
              >
                <PropertyCarousel
                  photos={demoPhotos(p)}
                  title={p.title}
                  href={`/biens/${p.slug}`}
                />
                <div className="card-top">
                  <span className="type-badge">
                    {p.category === "parcelle"
                      ? "Terrain"
                      : p.category === "bureau"
                        ? "Bureau"
                        : "Maison"}
                  </span>
                  <button
                    className="favorite-button"
                    type="button"
                    aria-label={`${favorites.includes(p.reference) ? "Retirer des" : "Ajouter aux"} favoris : ${p.title}`}
                    aria-pressed={favorites.includes(p.reference)}
                    onClick={() => toggleFavorite(p.reference)}
                  >
                    <Heart
                      size={19}
                      fill={
                        favorites.includes(p.reference)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
                <div className="card-body">
                  <span className="offer-badge">
                    {p.offer === "SALE" ? "À vendre" : "À louer"} <span>·</span>{" "}
                    {p.surfaceM2} m²
                  </span>
                  <h3>
                    <Link href={`/biens/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p className="card-location">
                    <MapPin size={14} /> {p.district}, {p.city}
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
                      {p.offer === "RENT" && <small> / mois</small>}
                    </strong>
                    <span>Exemple</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DemoExplorer>
      {!listingPage && (
        <div className="text-center mt-10">
          <Link className="legacy-button" href="/biens">
            Voir Toutes les Propriétés <ArrowUpRight size={18} />
          </Link>
        </div>
      )}
      <div className="catalog-disclaimer">
        <span className="small-dot" />
        <p>
          <strong>Version de démonstration.</strong> Biens fictifs et
          illustrations reprises du projet Afriloc. Aucune réservation ni
          paiement.
        </p>
        <Link href="/#projet">
          Le projet <ArrowUpRight size={13} />
        </Link>
      </div>
    </section>
  );
}

function DemoExplorer({
  listingPage,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CatalogExplorer>, "options"> & {
  listingPage: boolean;
}) {
  const options = {
    cities: [...new Set(demoProperties.map((p) => p.city))].sort(),
    neighborhoods: mergeNeighborhoods(
      demoProperties.map((p) => ({ name: p.district, city: p.city })),
    ),
  };
  return listingPage ? (
    <CatalogExplorer
      key={JSON.stringify(props.query)}
      {...props}
      options={options}
    >
      {children}
    </CatalogExplorer>
  ) : (
    <>{children}</>
  );
}
