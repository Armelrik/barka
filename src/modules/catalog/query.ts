import { z } from "zod";
export const catalogCategories = [
  ["all", "Tous les types"],
  ["apartment", "Appartements"],
  ["house", "Maisons et villas"],
  ["townhouse", "Maisons mitoyennes et duplex"],
  ["office", "Bureaux"],
  ["commercial", "Locaux commerciaux"],
  ["shop", "Boutiques"],
  ["warehouse", "Entrepôts"],
  ["retail", "Espaces de vente"],
  ["guesthouse", "Maisons d’hôtes"],
  ["land", "Terrains et parcelles"],
] as const;
const money = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(2147483647)])
  .default("");
export const catalogQueryFields = z.object({
  offer: z.enum(["ALL", "SALE", "RENT"]).default("ALL"),
  category: z
    .enum([
      "all",
      "apartment",
      "house",
      "townhouse",
      "office",
      "commercial",
      "shop",
      "warehouse",
      "retail",
      "guesthouse",
      "land",
      "villa",
      "parcelle",
      "bureau",
    ])
    .default("all"),
  city: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
  minPrice: money,
  maxPrice: money,
  furnishing: z.enum(["all", "FURNISHED", "UNFURNISHED"]).default("all"),
  rentalDuration: z.enum(["all", "SHORT", "LONG"]).default("all"),
  pricePeriod: z.enum(["all", "NIGHT", "WEEK", "MONTH"]).default("all"),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc"])
    .default("newest"),
});
export type CatalogFilters = z.infer<typeof catalogQueryFields>;
export function validPriceRange(
  q: Pick<CatalogFilters, "minPrice" | "maxPrice">,
) {
  return q.minPrice === "" || q.maxPrice === "" || q.minPrice <= q.maxPrice;
}
export function catalogSearchParams(q: CatalogFilters, page?: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(catalogQueryFields.parse(q)))
    if (
      value !== "" &&
      value !== "all" &&
      value !== "ALL" &&
      !(key === "sort" && value === "newest")
    )
      params.set(key, String(value));
  if (page && page > 1) params.set("page", String(page));
  return params;
}
export const categoryTypes: Record<
  CatalogFilters["category"],
  readonly string[]
> = {
  all: [],
  apartment: ["APARTMENT"],
  house: ["HOUSE", "VILLA", "RENTAL_VILLA", "BUILDING"],
  townhouse: ["TOWNHOUSE", "DUPLEX"],
  office: ["OFFICE"],
  commercial: ["COMMERCIAL_SPACE"],
  shop: ["SHOP"],
  warehouse: ["WAREHOUSE"],
  retail: ["RETAIL_SPACE"],
  guesthouse: ["GUEST_HOUSE"],
  land: ["BARE_PARCEL", "DEMARCATED_PARCEL", "WALLED_PARCEL", "LAND"],
  villa: ["VILLA", "HOUSE", "RENTAL_VILLA", "DUPLEX", "BUILDING"],
  parcelle: ["BARE_PARCEL", "DEMARCATED_PARCEL", "WALLED_PARCEL", "LAND"],
  bureau: ["OFFICE", "COMMERCIAL_SPACE"],
};
export function normalizeLocation(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'\s-]+/g, " ")
    .trim();
}
