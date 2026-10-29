import { describe, expect, it } from "vitest";
import {
  canAssignRole,
  canManageUser,
  type Principal,
  type ManagedUser,
} from "../../src/modules/identity/policy";
const actor: Principal = {
  id: "manager",
  companyId: "barka",
  countryId: "BF",
  role: "MANAGER",
  permissions: ["users.manage"],
  status: "ACTIVE",
};
const target: ManagedUser = {
  id: "commercial",
  companyId: "barka",
  countryId: "BF",
  role: "COMMERCIAL",
};
const scope = new Set([target.id]);
describe("Gestion des utilisateurs : refus par défaut et périmètre", () => {
  it("autorise un descendant strict avec permission", () =>
    expect(canManageUser(actor, target, scope)).toBe(true));
  it("refuse un utilisateur sans lien hiérarchique", () =>
    expect(canManageUser(actor, target, new Set())).toBe(false));
  it("refuse une autre société même si l'id est soumis comme descendant", () =>
    expect(canManageUser(actor, { ...target, companyId: "other" }, scope)).toBe(
      false,
    ));
  it("refuse un autre pays", () =>
    expect(canManageUser(actor, { ...target, countryId: "CI" }, scope)).toBe(
      false,
    ));
  it("refuse un pair ou un supérieur", () => {
    expect(canManageUser(actor, { ...target, role: "MANAGER" }, scope)).toBe(
      false,
    );
    expect(canManageUser(actor, { ...target, role: "ADMIN" }, scope)).toBe(
      false,
    );
  });
  it("refuse un acteur suspendu ou sans permission", () => {
    expect(
      canManageUser({ ...actor, status: "SUSPENDED" }, target, scope),
    ).toBe(false);
    expect(canManageUser({ ...actor, permissions: [] }, target, scope)).toBe(
      false,
    );
  });
  it("empêche l'élévation au niveau de l'acteur et au-delà", () => {
    expect(canAssignRole(actor, target, "MANAGER", scope)).toBe(false);
    expect(canAssignRole(actor, target, "SUPER_ADMIN", scope)).toBe(false);
    expect(canAssignRole(actor, target, "CLIENT", scope)).toBe(true);
    expect(canAssignRole(actor, target, "VISITOR", scope)).toBe(false);
  });
  it("refuse les mutations sensibles sur soi-même", () =>
    expect(
      canManageUser(actor, { ...target, id: actor.id }, new Set([actor.id])),
    ).toBe(false));
  it("réserve la traversée des sociétés au super administrateur", () => {
    expect(
      canManageUser(
        { ...actor, role: "SUPER_ADMIN" },
        { ...target, companyId: "other" },
        new Set(),
      ),
    ).toBe(true);
    expect(
      canManageUser(
        { ...actor, role: "ADMIN" },
        { ...target, companyId: "other" },
        scope,
      ),
    ).toBe(false);
  });
});
