import directory from "@/data/ouagadougou-neighborhoods.json";
import { normalizeLocation } from "./query";
export type NeighborhoodOption = {
  name: string;
  city: string;
  aliases?: string[];
};
export const ouagaNeighborhoods: NeighborhoodOption[] = directory.neighborhoods;
export function neighborhoodVariants(name: string) {
  const normalized = normalizeLocation(name);
  const found = ouagaNeighborhoods.find((n) =>
    [n.name, ...(n.aliases ?? [])].some(
      (s) => normalizeLocation(s) === normalized,
    ),
  );
  const variants = found
    ? [name, found.name, ...(found.aliases ?? [])]
    : [name];
  return [
    ...new Set(
      variants.flatMap((s) => [
        s,
        s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      ]),
    ),
  ];
}
export function mergeNeighborhoods(extra: NeighborhoodOption[]) {
  const result = [...ouagaNeighborhoods];
  for (const option of extra)
    if (
      !result.some(
        (n) =>
          normalizeLocation(n.city) === normalizeLocation(option.city) &&
          [n.name, ...(n.aliases ?? [])].some(
            (s) => normalizeLocation(s) === normalizeLocation(option.name),
          ),
      )
    )
      result.push(option);
  return result.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
