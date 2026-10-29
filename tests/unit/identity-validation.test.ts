import { describe, expect, it } from "vitest";
import {
  registrationSchema,
  loginSchema,
  normalizePhone,
} from "../../src/modules/identity/validation";
const valid = {
  firstName: "Moussa",
  lastName: "Test",
  phone: "70 12 34 56",
  email: "",
  password: "Une phrase fictive assez longue",
  consent: true,
};
describe("Inscription et identifiants", () => {
  it("normalise les téléphones locaux et internationaux", () => {
    expect(normalizePhone("70 12 34 56")).toBe("+22670123456");
    expect(normalizePhone("00226 (70) 12-34-56")).toBe("+22670123456");
  });
  it("accepte un compte sans email et le même DTO après validation client", () => {
    const parsed = registrationSchema.parse(valid);
    expect(parsed.email).toBeNull();
    expect(registrationSchema.parse(parsed)).toEqual(parsed);
  });
  it("normalise l'email sans altérer le mot de passe", () => {
    const parsed = registrationSchema.parse({
      ...valid,
      email: "  CLIENT@BARKA.EXAMPLE ",
    });
    expect(parsed.email).toBe("client@barka.example");
    expect(parsed.password).toBe(valid.password);
  });
  it("refuse le rôle, la société et le parent soumis par le navigateur", () => {
    for (const injected of [
      { role: "ADMIN" },
      { companyId: "other" },
      { parentId: "other" },
    ])
      expect(
        registrationSchema.safeParse({ ...valid, ...injected }).success,
      ).toBe(false);
  });
  it("exige le consentement et un téléphone", () => {
    expect(
      registrationSchema.safeParse({ ...valid, consent: false }).success,
    ).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, phone: "" }).success).toBe(
      false,
    );
  });
  it("refuse un mot de passe trop court ou trop long en octets", () => {
    expect(
      registrationSchema.safeParse({ ...valid, password: "court" }).success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({ ...valid, password: "é".repeat(37) })
        .success,
    ).toBe(false);
  });
  it("accepte les noms accentués et refuse les chaînes techniques", () => {
    expect(
      registrationSchema.safeParse({
        ...valid,
        firstName: "Aïcha",
        lastName: "N’Diaye",
      }).success,
    ).toBe(true);
    expect(
      registrationSchema.safeParse({ ...valid, firstName: "<script>" }).success,
    ).toBe(false);
  });
  it("valide la connexion sans accepter de redirection arbitraire", () => {
    expect(
      loginSchema.parse({
        identifier: " CLIENT@BARKA.EXAMPLE ",
        password: "mot de passe",
      }).identifier,
    ).toBe("client@barka.example");
    expect(
      loginSchema.safeParse({
        identifier: valid.phone,
        password: valid.password,
        next: "https://evil.example",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ identifier: "???", password: "x" }).success,
    ).toBe(false);
  });
});
