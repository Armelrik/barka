import { describe, it, expect } from "vitest";
import { adSchema, safeAdTarget } from "@/modules/advertising/validation";
import {
  publicAudiencePath,
  reportRange,
  csvCell,
  isAutomatedAgent,
} from "@/modules/audience/validation";
describe("Publicités et audience", () => {
  it("accepte des destinations internes et HTTPS sans redirection ambiguë", () => {
    for (const path of [
      "/biens",
      "/biens/villa?offer=RENT",
      "https://annonceur.bf/offre",
    ])
      expect(safeAdTarget(path)).toBe(true);
    for (const path of [
      "javascript:alert(1)",
      "//evil.com",
      "/%2Fevil.com",
      "/\\evil.com",
      "https://user:secret@evil.com",
      "http://evil.com",
      "https://evil.com\n",
    ])
      expect(safeAdTarget(path)).toBe(false);
  });
  it("refuse une campagne sans durée valide ou contenant des champs privilégiés", () => {
    const ad = {
      title: "Une maison",
      sponsorName: "Barka",
      campaignKind: "HOUSE",
      placement: "HERO",
      targetUrl: "/biens",
      startsAt: "2026-11-01T00:00:00Z",
      endsAt: "2026-12-01T00:00:00Z",
    };
    expect(adSchema.safeParse(ad).success).toBe(true);
    expect(adSchema.safeParse({ ...ad, endsAt: ad.startsAt }).success).toBe(
      false,
    );
    expect(adSchema.safeParse({ ...ad, ownerId: "someone" }).success).toBe(
      false,
    );
    expect(
      adSchema.safeParse({ ...ad, imagePath: "https://other/image.jpg" })
        .success,
    ).toBe(false);
  });
  it("exclut les espaces privés et regroupe les fiches sans leurs identifiants", () => {
    expect(publicAudiencePath("/biens/villa")).toBe("/biens/[slug]");
    expect(publicAudiencePath("/visites/villa")).toBe("/visites/[slug]");
    for (const path of [
      "/espace",
      "/connexion",
      "/api/v1/me",
      "/reinitialiser-mot-de-passe?token=secret",
      "/biens?phone=123",
    ])
      expect(publicAudiencePath(path)).toBeNull();
    expect(isAutomatedAgent("Mozilla HeadlessChrome/123")).toBe(true);
  });
  it("borne les rapports à 90 jours et échappe les formules CSV", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(
      reportRange({ from: today, to: today }).end.getTime() -
        reportRange({ from: today, to: today }).start.getTime(),
    ).toBe(86400000);
    expect(() => reportRange({ from: "2020-01-01", to: today })).toThrow();
    expect(() => reportRange({ from: "2026-02-30", to: today })).toThrow();
    expect(csvCell('=HYPERLINK("url")')).toBe('"\'=HYPERLINK(""url"")"');
  });
});
