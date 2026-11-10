import type { DemoProperty } from "./demo";
import {
  catalogQueryFields,
  categoryTypes,
  normalizeLocation,
  validPriceRange,
} from "./query";
import { neighborhoodVariants } from "./locations";
export const catalogFiltersSchema = catalogQueryFields;
export type { CatalogFilters } from "./query";
export function filterProperties(
  properties: readonly DemoProperty[],
  input: unknown,
): DemoProperty[] {
  const q = catalogFiltersSchema.parse(input);
  if (!validPriceRange(q)) throw new Error("Fourchette de prix invalide.");
  const matches = properties.filter(
    (p) =>
      (q.offer === "ALL" || p.offer === q.offer) &&
      (q.category === "all" || categoryTypes[q.category].includes(p.type)) &&
      (!q.city || normalizeLocation(p.city) === normalizeLocation(q.city)) &&
      (!q.location ||
        neighborhoodVariants(q.location).some((n) =>
          normalizeLocation(`${p.district} ${q.city ? "" : p.city}`).includes(
            normalizeLocation(n),
          ),
        )) &&
      (q.minPrice === "" || p.priceXof >= q.minPrice) &&
      (q.maxPrice === "" || p.priceXof <= q.maxPrice) &&
      (q.furnishing === "all" || p.furnishing === q.furnishing) &&
      (q.rentalDuration === "all" ||
        (p.offer === "RENT" && p.rentalDuration === q.rentalDuration)) &&
      (q.pricePeriod === "all" ||
        (p.offer === "RENT" &&
          (p.rentPricePeriod ?? "MONTH") === q.pricePeriod)),
  );
  return matches.sort((a, b) =>
    q.sort === "price_asc"
      ? a.priceXof - b.priceXof
      : q.sort === "price_desc"
        ? b.priceXof - a.priceXof
        : q.sort === "oldest"
          ? properties.indexOf(b) - properties.indexOf(a)
          : properties.indexOf(a) - properties.indexOf(b),
  );
}
