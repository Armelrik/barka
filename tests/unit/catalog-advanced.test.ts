import { describe, expect, it } from "vitest";
import {
  catalogQueryFields,
  catalogSearchParams,
  validPriceRange,
} from "../../src/modules/catalog/query";
import {
  ouagaNeighborhoods,
  neighborhoodVariants,
  mergeNeighborhoods,
} from "../../src/modules/catalog/locations";
import { filterProperties } from "../../src/modules/catalog/filters";
import { demoProperties } from "../../src/modules/catalog/demo";
describe("filtres du catalogue", () => {
  it("charge les quartiers sourcés et reconnaît leurs variantes accentuées", () => {
    expect(ouagaNeighborhoods).toHaveLength(77);
    expect(neighborhoodVariants("somgande")).toContain("Somgandé");
    expect(neighborhoodVariants("Ouaga2000")).toContain("Ouaga 2000");
    expect(
      mergeNeighborhoods([{ name: "Somgande", city: "Ouagadougou" }]).length,
    ).toBe(77);
  });
  it("combine ville, quartier, prix minimum et maximum et type précis", () => {
    expect(
      filterProperties(demoProperties, {
        city: "Ouagadougou",
        location: "zone du bois",
        minPrice: 300000,
        maxPrice: 500000,
        category: "townhouse",
        offer: "RENT",
      }).map((p) => p.reference),
    ).toEqual(["DEMO-003"]);
    expect(
      filterProperties(demoProperties, {
        city: "Bobo-Dioulasso",
        location: "Ouaga 2000",
      }),
    ).toHaveLength(0);
  });
  it("ne transforme pas un ameublement ou une durée inconnus en fausse information", () => {
    const p = {
      ...demoProperties[2],
      furnishing: "FURNISHED" as const,
      rentalDuration: "SHORT" as const,
      rentPricePeriod: "NIGHT" as const,
    };
    expect(
      filterProperties([p, demoProperties[2]], {
        furnishing: "FURNISHED",
        rentalDuration: "SHORT",
        pricePeriod: "NIGHT",
      }),
    ).toEqual([p]);
  });
  it("trie sans modifier les données initiales", () => {
    const original = demoProperties.map((p) => p.reference);
    const asc = filterProperties(demoProperties, { sort: "price_asc" });
    expect(asc[0].priceXof).toBe(
      Math.min(...demoProperties.map((p) => p.priceXof)),
    );
    expect(filterProperties(demoProperties, { sort: "oldest" })[0]).toEqual(
      demoProperties.at(-1),
    );
    expect(demoProperties.map((p) => p.reference)).toEqual(original);
  });
  it("conserve tous les filtres mais réinitialise la pagination", () => {
    const q = catalogQueryFields.parse({
      city: "Ouagadougou",
      location: "Somgandé",
      minPrice: 100000,
      furnishing: "FURNISHED",
      sort: "oldest",
      rentalDuration: "LONG",
    });
    const params = catalogSearchParams({ ...q, page: 9 } as typeof q);
    expect(params.get("page")).toBeNull();
    expect(params.get("city")).toBe("Ouagadougou");
    expect(params.get("sort")).toBe("oldest");
    expect(catalogSearchParams(q, 2).get("page")).toBe("2");
  });
  it("refuse une fourchette inversée et les paramètres invalides", () => {
    expect(
      validPriceRange(
        catalogQueryFields.parse({ minPrice: 300, maxPrice: 100 }),
      ),
    ).toBe(false);
    expect(() =>
      filterProperties(demoProperties, { minPrice: 300, maxPrice: 100 }),
    ).toThrow();
    for (const data of [
      { sort: "random" },
      { minPrice: -1 },
      { category: "invented" },
      { furnishing: "maybe" },
    ])
      expect(catalogQueryFields.safeParse(data).success).toBe(false);
  });
});
