import { describe, it, expect } from "vitest";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  teamQuerySchema,
  parentQuerySchema,
} from "../../src/modules/identity/validation";
const account = {
  firstName: "Compte",
  lastName: "Test",
  phone: "70 12 34 56",
  email: "TEST@BARKA.EXAMPLE",
  password: "mot-de-passe-initial",
  role: "COMMERCIAL",
  parentId: "manager",
};
const version = "2026-11-09T12:00:00.000Z";
describe("Entrées privilégiées de gestion des utilisateurs", () => {
  it("normalise les coordonnées sans imposer d'email", () => {
    expect(createManagedUserSchema.parse(account)).toMatchObject({
      phone: "+22670123456",
      email: "test@barka.example",
    });
    expect(
      createManagedUserSchema.parse({ ...account, email: "" }).email,
    ).toBeNull();
  });
  it("refuse la création ordinaire d'un super administrateur et d'un commercial par défaut", () => {
    for (const role of ["SUPER_ADMIN", "VISITOR", "DEFAULT_COMMERCIAL"])
      expect(
        createManagedUserSchema.safeParse({ ...account, role }).success,
      ).toBe(false);
  });
  it("refuse les attributs de privilège injectés et un mot de passe dépassant bcrypt", () => {
    expect(
      createManagedUserSchema.safeParse({
        ...account,
        permissions: ["users.manage"],
      }).success,
    ).toBe(false);
    expect(
      createManagedUserSchema.safeParse({
        ...account,
        password: "é".repeat(37),
      }).success,
    ).toBe(false);
  });
  it("exige une version et au moins un champ pour modifier", () => {
    expect(
      updateManagedUserSchema.safeParse({ status: "SUSPENDED" }).success,
    ).toBe(false);
    expect(
      updateManagedUserSchema.safeParse({ expectedUpdatedAt: version }).success,
    ).toBe(false);
    expect(
      updateManagedUserSchema.safeParse({
        expectedUpdatedAt: "hier",
        status: "SUSPENDED",
      }).success,
    ).toBe(false);
  });
  it("interdit les transferts de société et les changements de mot de passe via PATCH", () => {
    for (const extra of [
      { companyId: "other" },
      { password: "secret" },
      { passwordHash: "injected" },
      { role: "SUPER_ADMIN" },
    ])
      expect(
        updateManagedUserSchema.safeParse({
          expectedUpdatedAt: version,
          ...extra,
        }).success,
      ).toBe(false);
  });
  it("autorise une modification partielle et un effacement explicite d'email", () => {
    expect(
      updateManagedUserSchema.parse({ expectedUpdatedAt: version, email: "" }),
    ).toEqual({ expectedUpdatedAt: version, email: null });
    expect(
      updateManagedUserSchema.parse({
        expectedUpdatedAt: version,
        status: "SUSPENDED",
      }).status,
    ).toBe("SUSPENDED");
  });
  it("borne les filtres et la recherche de responsables", () => {
    expect(teamQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    expect(teamQuerySchema.safeParse({ q: "a".repeat(101) }).success).toBe(
      false,
    );
    expect(parentQuerySchema.safeParse({ role: "VISITOR" }).success).toBe(
      false,
    );
    expect(teamQuerySchema.parse({ q: " Compte ", status: "ACTIVE" }).q).toBe(
      "Compte",
    );
  });
});
