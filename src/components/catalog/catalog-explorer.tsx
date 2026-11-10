"use client";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import {
  catalogCategories,
  catalogQueryFields,
  catalogSearchParams,
  validPriceRange,
  type CatalogFilters,
} from "@/modules/catalog/query";
import type { NeighborhoodOption } from "@/modules/catalog/locations";
import { NeighborhoodCombobox } from "./neighborhood-combobox";
export function CatalogExplorer({
  query,
  page = 1,
  total,
  options,
  basePath = "/biens",
  onApply,
  extras,
  children,
}: {
  query: CatalogFilters;
  page?: number;
  total: number | null;
  options: { cities: string[]; neighborhoods: NeighborhoodOption[] };
  basePath?: string;
  onApply?: (query: CatalogFilters) => void;
  extras?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState(query),
    [error, setError] = useState(""),
    [pending, startTransition] = useTransition(),
    router = useRouter(),
    results = useRef<HTMLDivElement>(null);
  const previousPage = useRef(page);
  useLayoutEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    if (results.current)
      window.scrollTo({
        top: Math.max(
          0,
          results.current.getBoundingClientRect().top + window.scrollY - 100,
        ),
        behavior: "instant",
      });
  }, [page]);
  function change<K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K],
  ) {
    setDraft((old) => ({
      ...old,
      [key]: value,
      ...(key === "city" ? { location: "" } : {}),
      ...(key === "offer" && value === "SALE"
        ? { rentalDuration: "all", pricePeriod: "all" }
        : {}),
    }));
  }
  function apply(next = draft) {
    const parsed = catalogQueryFields.safeParse(next);
    if (!parsed.success || !validPriceRange(parsed.data)) {
      setError(
        "Vérifiez les prix : le minimum doit être inférieur ou égal au maximum.",
      );
      return;
    }
    setError("");
    // Keep the result heading in view instead of restoring a footer/old-card anchor.
    if (results.current)
      window.scrollTo({
        top: Math.max(
          0,
          results.current.getBoundingClientRect().top + window.scrollY - 100,
        ),
        behavior: "instant",
      });
    startTransition(() => {
      if (onApply) onApply(parsed.data);
      else
        router.push(`${basePath}?${catalogSearchParams(parsed.data)}`, {
          scroll: false,
        });
    });
  }
  const active = Object.entries(catalogQueryFields.parse(query)).filter(
    ([key, value]) =>
      key !== "sort" && value !== "" && value !== "all" && value !== "ALL",
  ).length;
  return (
    <div className="catalog-page-layout" aria-busy={pending}>
      <div className="catalog-results" ref={results}>
        <div className="catalog-results-heading">
          <div>
            <span className="presentation-eyebrow">Votre sélection</span>
            <p role="status">
              {total === null
                ? "Catalogue indisponible"
                : `${total} ${total === 1 ? "bien trouvé" : "biens trouvés"}`}
            </p>
          </div>
          <label>
            Trier par
            <select
              name="sort"
              value={draft.sort}
              onChange={(e) => {
                const sort = e.target.value as CatalogFilters["sort"];
                change("sort", sort);
                apply({ ...draft, sort });
              }}
            >
              <option value="newest">Du plus récent au plus ancien</option>
              <option value="oldest">Du plus ancien au plus récent</option>
              <option value="price_asc">Prix croissants</option>
              <option value="price_desc">Prix décroissants</option>
            </select>
          </label>
        </div>
        {pending && (
          <p className="catalog-pending" role="status">
            Actualisation des propriétés…
          </p>
        )}
        {children}
      </div>
      <aside
        className="catalog-filter-sidebar"
        aria-label="Filtres des propriétés"
      >
        <details open>
          <summary>
            <SlidersHorizontal size={18} /> Affiner la recherche{" "}
            {active > 0 && <span>{active}</span>}
          </summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <div className="catalog-place-fields">
              <label>
                Ville
                <select
                  name="city"
                  value={draft.city}
                  onChange={(e) => change("city", e.target.value)}
                >
                  <option value="">Toutes les villes</option>
                  {options.cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <NeighborhoodCombobox
                value={draft.location}
                city={draft.city}
                options={options.neighborhoods}
                onChange={(v) => change("location", v)}
                onSelect={(o) =>
                  setDraft((old) => ({
                    ...old,
                    location: o.name,
                    city: old.city || o.city,
                  }))
                }
              />
            </div>
            <label>
              Votre projet
              <select
                name="offer"
                value={draft.offer}
                onChange={(e) =>
                  change("offer", e.target.value as CatalogFilters["offer"])
                }
              >
                <option value="ALL">Acheter ou louer</option>
                <option value="SALE">Acheter</option>
                <option value="RENT">Louer</option>
              </select>
            </label>
            <fieldset>
              <legend>Fourchette de prix · FCFA</legend>
              <div className="catalog-price-fields">
                <label>
                  Budget minimum
                  <input
                    name="minPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={2147483647}
                    value={draft.minPrice}
                    placeholder="Minimum"
                    onChange={(e) =>
                      change(
                        "minPrice",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  Budget maximum
                  <input
                    name="maxPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={2147483647}
                    value={draft.maxPrice}
                    placeholder="Maximum"
                    onChange={(e) =>
                      change(
                        "maxPrice",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </label>
              </div>
            </fieldset>
            <label>
              Type de bien
              <select
                name="category"
                value={draft.category}
                onChange={(e) =>
                  change(
                    "category",
                    e.target.value as CatalogFilters["category"],
                  )
                }
              >
                {catalogCategories.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
                {["villa", "parcelle", "bureau"].includes(draft.category) && (
                  <option value={draft.category}>
                    {draft.category === "villa"
                      ? "Maisons, villas et duplex"
                      : draft.category === "parcelle"
                        ? "Terrains et parcelles"
                        : "Bureaux et commerces"}
                  </option>
                )}
              </select>
            </label>
            <label>
              Ameublement
              <select
                name="furnishing"
                value={draft.furnishing}
                onChange={(e) =>
                  change(
                    "furnishing",
                    e.target.value as CatalogFilters["furnishing"],
                  )
                }
              >
                <option value="all">Meublé ou non meublé</option>
                <option value="FURNISHED">Meublé</option>
                <option value="UNFURNISHED">Non meublé</option>
              </select>
            </label>
            <label>
              Durée de location
              <select
                name="rentalDuration"
                disabled={draft.offer === "SALE"}
                value={draft.rentalDuration}
                onChange={(e) =>
                  change(
                    "rentalDuration",
                    e.target.value as CatalogFilters["rentalDuration"],
                  )
                }
              >
                <option value="all">Toutes les durées</option>
                <option value="SHORT">Courte durée</option>
                <option value="LONG">Longue durée</option>
              </select>
            </label>
            <label>
              Prix de location par
              <select
                name="pricePeriod"
                disabled={draft.offer === "SALE"}
                value={draft.pricePeriod}
                onChange={(e) =>
                  change(
                    "pricePeriod",
                    e.target.value as CatalogFilters["pricePeriod"],
                  )
                }
              >
                <option value="all">Toutes les périodes</option>
                <option value="NIGHT">Nuit</option>
                <option value="WEEK">Semaine</option>
                <option value="MONTH">Mois</option>
              </select>
            </label>
            <p className="catalog-filter-help">
              Les prix de location sont à comparer pour une même période.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="legacy-button" type="submit" disabled={pending}>
              <Search size={17} /> Rechercher
            </button>
            <button
              className="catalog-reset"
              type="button"
              disabled={pending}
              onClick={() => {
                const empty = catalogQueryFields.parse({});
                setDraft(empty);
                apply(empty);
              }}
            >
              <X size={16} /> Effacer les filtres
            </button>
          </form>
          {extras}
        </details>
      </aside>
    </div>
  );
}
