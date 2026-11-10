import { describe, it, expect } from "vitest";
import { sealMail, openMail } from "../../src/modules/messaging/crypto";
import { recoveryResetSchema } from "../../src/modules/identity/recovery-validation";
import {
  availabilitySchema,
  containsVisit,
} from "../../src/modules/availability/validation";
describe("récupération et agenda", () => {
  it("chiffre les messages, varie les IV et refuse toute altération", () => {
    const value = { text: "secret-link", to: "private@barka.example" },
      secret = "a".repeat(48);
    const a = sealMail(value, secret),
      b = sealMail(value, secret);
    expect(a).not.toBe(b);
    expect(a).not.toContain("secret-link");
    expect(openMail(a, secret)).toEqual(value);
    expect(() => openMail(a, "wrong")).toThrow();
    const pieces = a.split(".");
    pieces[2] = (pieces[2][0] === "A" ? "B" : "A") + pieces[2].slice(1);
    expect(() => openMail(pieces.join("."), secret)).toThrow();
  });
  it("limite le jeton, le mot de passe et les champs de récupération", () => {
    expect(
      recoveryResetSchema.safeParse({
        token: "a".repeat(64),
        password: "long-password-valid",
      }).success,
    ).toBe(true);
    expect(
      recoveryResetSchema.safeParse({
        token: "a".repeat(64),
        password: "é".repeat(40),
      }).success,
    ).toBe(false);
    expect(
      recoveryResetSchema.safeParse({
        token: "a".repeat(64),
        password: "long-password-valid",
        userId: "victim",
      }).success,
    ).toBe(false);
  });
  it("refuse les plages trop courtes, passées et trop longues", () => {
    const startsAt = new Date(Date.now() + 86400000).toISOString();
    expect(
      availabilitySchema.safeParse({
        agentId: "agent",
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 3600000).toISOString(),
      }).success,
    ).toBe(true);
    for (const duration of [-3600000, 30 * 60000, 13 * 3600000])
      expect(
        availabilitySchema.safeParse({
          agentId: "agent",
          startsAt,
          endsAt: new Date(Date.parse(startsAt) + duration).toISOString(),
        }).success,
      ).toBe(false);
  });
  it("une visite doit tenir entièrement dans la plage", () => {
    const start = new Date("2026-12-01T09:00:00Z"),
      end = new Date("2026-12-01T12:00:00Z");
    expect(containsVisit(start, end, new Date("2026-12-01T11:00:00Z"))).toBe(
      true,
    );
    expect(containsVisit(start, end, new Date("2026-12-01T11:01:00Z"))).toBe(
      false,
    );
  });
});
