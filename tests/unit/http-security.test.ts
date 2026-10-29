import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertSameOrigin,
  readJsonBody,
} from "../../src/lib/server/http-security";
import { getSessionOptions } from "../../src/lib/server/auth-config";
beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-only-secret-with-at-least-32-characters");
  vi.stubEnv("AUTH_URL", "https://barka.example");
});
afterEach(() => vi.unstubAllEnvs());
describe("Protection des opérations d'authentification", () => {
  it("accepte uniquement les alias loopback de même protocole et port en local", () => {
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    expect(() =>
      assertSameOrigin(
        new Request("http://127.0.0.1:3000/api", {
          headers: { origin: "http://127.0.0.1:3000" },
        }),
      ),
    ).not.toThrow();
    for (const origin of [
      "http://127.0.0.1:3001",
      "http://localhost.evil.example:3000",
      "http://127.0.0.1:3000/path",
      "https://localhost:3000",
    ])
      expect(() =>
        assertSameOrigin(
          new Request("http://localhost:3000/api", { headers: { origin } }),
        ),
      ).toThrow();
  });
  it("refuse une origine absente ou étrangère", () => {
    for (const origin of [undefined, "https://evil.example", "null"])
      expect(() =>
        assertSameOrigin(
          new Request("https://barka.example/api", {
            headers: origin ? { origin } : {},
          }),
        ),
      ).toThrow();
    expect(() =>
      assertSameOrigin(
        new Request("https://barka.example/api", {
          headers: { origin: "https://barka.example" },
        }),
      ),
    ).not.toThrow();
  });
  it("refuse un contexte cross-site même avec une origine copiée", () =>
    expect(() =>
      assertSameOrigin(
        new Request("https://barka.example/api", {
          headers: {
            origin: "https://barka.example",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toThrow());
  it("configure le cookie scellé, HttpOnly, Secure et SameSite", () => {
    const options = getSessionOptions();
    expect(options.cookieName).toBe("__Host-barka.session");
    expect(options.cookieOptions).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    expect(options.ttl).toBe(28800);
  });
  it("refuse une configuration faible ou un HTTP public", () => {
    vi.stubEnv("AUTH_SECRET", "court");
    expect(() => getSessionOptions()).toThrow();
    vi.stubEnv("AUTH_SECRET", "test-only-secret-with-at-least-32-characters");
    vi.stubEnv("AUTH_URL", "http://barka.example");
    expect(() => getSessionOptions()).toThrow();
  });
  it("refuse le mauvais type de contenu et un JSON malformé", async () => {
    await expect(
      readJsonBody(
        new Request("https://barka.example", { method: "POST", body: "{}" }),
      ),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readJsonBody(
        new Request("https://barka.example", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("borne aussi un corps sans Content-Length", async () => {
    await expect(
      readJsonBody(
        new Request("https://barka.example", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: "x".repeat(9000) }),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
});
