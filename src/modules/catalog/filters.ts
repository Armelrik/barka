import { z } from "zod";
import type { DemoProperty } from "./demo";
export const catalogFiltersSchema = z.object({
  offer: z.enum(["ALL", "SALE", "RENT"]).default("ALL"),
  category: z.enum(["all", "villa", "parcelle", "bureau"]).default("all"),
  location: z.string().trim().max(100).default(""),
  maxPrice: z
    .union([
      z.literal(""),
      z.coerce.number().int().nonnegative().max(2147483647),
    ])
    .default(""),
});
export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function filterProperties(
  properties: readonly DemoProperty[],
  input: unknown,
): DemoProperty[] {
  const filters = catalogFiltersSchema.parse(input);
  return properties.filter(
    (p) =>
      (filters.offer === "ALL" || p.offer === filters.offer) &&
      (filters.category === "all" || p.category === filters.category) &&
      normalize(`${p.city} ${p.district}`).includes(
        normalize(filters.location),
      ) &&
      (filters.maxPrice === "" || p.priceXof <= filters.maxPrice),
  );
}
