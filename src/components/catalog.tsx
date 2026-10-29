"use client";
import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoProperties } from "@/modules/catalog/demo";
import { propertyVisuals } from "@/modules/catalog/visuals";
import {
  filterProperties,
  catalogFiltersSchema,
  type CatalogFilters,
} from "@/modules/catalog/filters";
import { formatXof } from "@/lib/utils";

const defaults: CatalogFilters = {
  offer: "ALL",
  category: "all",
  location: "",
  maxPrice: "",
};
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

export function Catalog() {
  const [draft, setDraft] = useState<CatalogFilters>(defaults);
  const [filters, setFilters] = useState<CatalogFilters>(defaults);
  const [error, setError] = useState("");
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
    setDraft(defaults);
    setFilters(defaults);
    setFavoritesOnly(false);
    setError("");
  }
  function search(form: FormData) {
    const parsed = catalogFiltersSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setError(
        "Indiquez un budget entier compris entre 0 et 2 147 483 647 FCFA.",
      );
      return;
    }
    setError("");
    setFilters(parsed.data);
  }
  return (
    <section id="catalogue" className="catalog-section shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LA SÉLECTION BARKA</span>
          <h2>Une adresse. Un coup de cœur.</h2>
        </div>
        <p>Imaginez la suite, on vous aide à chercher.</p>
      </div>
      <div className="catalog-controls">
        <div className="offer-tabs" role="group" aria-label="Type de projet">
          {(
            [
              { value: "ALL", label: "Tous les biens" },
              { value: "SALE", label: "Acheter" },
              { value: "RENT", label: "Louer" },
            ] as const
          ).map((tab) => (
            <button
              type="button"
              key={tab.value}
              aria-pressed={filters.offer === tab.value}
              onClick={() => {
                setFilters({ ...filters, offer: tab.value });
                setDraft({ ...draft, offer: tab.value });
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="favorites-filter"
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Heart size={16} fill={favoritesOnly ? "currentColor" : "none"} /> Mes
          favoris <span>{favorites.length}</span>
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search(new FormData(event.currentTarget));
        }}
        className="search-panel"
      >
        <label>
          Votre projet
          <select
            name="offer"
            value={draft.offer}
            onChange={(e) =>
              setDraft({
                ...draft,
                offer: e.target.value as CatalogFilters["offer"],
              })
            }
          >
            <option value="ALL">Acheter ou louer</option>
            <option value="SALE">Acheter</option>
            <option value="RENT">Louer</option>
          </select>
        </label>
        <label>
          Localisation
          <span className="input-icon">
            <MapPin size={16} />
            <input
              name="location"
              placeholder="Ville ou quartier"
              maxLength={100}
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </span>
        </label>
        <label>
          Type de bien
          <select
            name="category"
            value={draft.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                category: e.target.value as CatalogFilters["category"],
              })
            }
          >
            <option value="all">Tous les types</option>
            <option value="villa">Villas & maisons</option>
            <option value="parcelle">Parcelles</option>
            <option value="bureau">Bureaux</option>
          </select>
        </label>
        <label>
          Budget maximum
          <input
            name="maxPrice"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            placeholder="En FCFA"
            value={draft.maxPrice}
            onChange={(e) =>
              setDraft({
                ...draft,
                maxPrice: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </label>
        <Button type="submit">
          <Search size={17} /> Rechercher
        </Button>
        {error && (
          <p role="alert" className="search-error">
            {error}
          </p>
        )}
      </form>
      <div className="catalog-toolbar">
        <p aria-live="polite">
          <strong>
            {results.length} bien{results.length > 1 ? "s" : ""}
          </strong>{" "}
          à découvrir <span>· Exemples fictifs</span>
        </p>
        <button type="button" onClick={reset} className="reset-filters">
          <SlidersHorizontal size={14} /> Réinitialiser
        </button>
      </div>
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
          {results.map((p) => (
            <article
              key={p.reference}
              className={`property-card property-card-${p.illustration}`}
            >
              <Link
                href={`/biens/${p.slug}`}
                className="card-visual"
                aria-label={`Découvrir : ${p.title}`}
              >
                <Image
                  src={propertyVisuals[p.illustration]}
                  fill
                  sizes="(max-width: 600px) 92vw, (max-width: 1000px) 46vw, 23vw"
                  alt={`Visuel d’ambiance généré pour cet exemple : ${p.title}`}
                />
                <span className="card-gradient" />
              </Link>
              <div className="card-top">
                <span className="price-pill">
                  {formatXof(p.priceXof)}
                  {p.offer === "RENT" && <small> / mois</small>}
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
                      favorites.includes(p.reference) ? "currentColor" : "none"
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
                  <ArrowUpRight size={17} className="card-arrow" />
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="catalog-disclaimer">
        <span className="small-dot" />
        <p>
          <strong>Version de démonstration.</strong> Biens fictifs et visuels
          d’ambiance générés par IA. Aucune réservation ni paiement.
        </p>
        <a href="#projet">
          Le projet <ArrowUpRight size={13} />
        </a>
      </div>
    </section>
  );
}
