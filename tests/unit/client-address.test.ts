import { afterEach, describe, it, expect, vi } from "vitest";
import { rateLimitAddress } from "../../src/lib/server/client-address";
import { propertySchema } from "../../src/modules/listings/validation";
describe("Adresse de limitation des comptes", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("ignore les en-têtes non approuvés hors Vercel", () =>
    expect(
      rateLimitAddress(
        new Headers({
          "x-forwarded-for": "203.0.113.1",
          "x-vercel-forwarded-for": "203.0.113.2",
        }),
        {},
      ),
    ).toBe("untrusted-shared-ingress"));
  it("utilise uniquement l’en-tête canonique Vercel sur Vercel", () =>
    expect(
      rateLimitAddress(
        new Headers({
          "x-forwarded-for": "203.0.113.1",
          "x-vercel-forwarded-for": "203.0.113.2",
        }),
        { VERCEL: "1" },
      ),
    ).toBe("203.0.113.2"));
  it("valide les adresses et n’accepte pas une adresse fournie sous un autre en-tête", () => {
    expect(
      rateLimitAddress(
        new Headers({
          "x-vercel-forwarded-for": "invalide",
          "x-forwarded-for": "203.0.113.1",
        }),
        { VERCEL: "1" },
      ),
    ).toBe("untrusted-shared-ingress");
    expect(
      rateLimitAddress(new Headers({ "x-forwarded-for": "2001:db8::1" }), {
        AUTH_TRUST_PROXY_HEADERS: "true",
      }),
    ).toBe("2001:db8::1");
  });
  it("interdit de choisir le statut fictif depuis une création de bien ordinaire", () => {
    const base = {
      title: "Villa de contrôle",
      description:
        "Description de contrôle suffisamment longue pour le dossier.",
      type: "VILLA",
      offer: "SALE",
      priceXof: 15000000,
      surfaceM2: 150,
      locationId: "locality",
      agentId: "agent",
    };
    expect(propertySchema.safeParse(base).success).toBe(true);
    expect(propertySchema.safeParse({ ...base, isDemo: true }).success).toBe(
      false,
    );
  });
});
