import { describe, expect, it } from "vitest";
import { filterProperties } from "../../src/modules/catalog/filters";
import { demoProperties } from "../../src/modules/catalog/demo";
describe("Catalogue d'exemples", () => {
  it("combine type, localisation, offre et budget", () => {
    const result = filterProperties(demoProperties, {
      offer: "RENT",
      category: "villa",
      location: "zone du bois",
      maxPrice: "500000",
    });
    expect(result.map((p) => p.reference)).toEqual(["DEMO-003"]);
  });
  it("renvoie une liste vide pour un budget insuffisant", () =>
    expect(filterProperties(demoProperties, { maxPrice: 1 })).toEqual([]));
  it("rejette prix négatif, non numérique et offre invalide", () => {
    for (const input of [
      { maxPrice: -1 },
      { maxPrice: "abc" },
      { offer: "FREE" },
    ])
      expect(() => filterProperties(demoProperties, input)).toThrow();
  });
  it("laisse le budget vide sans plafond implicite", () =>
    expect(filterProperties(demoProperties, { maxPrice: "" })).toHaveLength(4));
  it("ignore casse, espaces et accents de localisation", () =>
    expect(
      filterProperties(demoProperties, { location: "  OUAGADOUGÓU " }),
    ).toHaveLength(4));
});
