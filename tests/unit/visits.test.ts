import { describe, it, expect } from "vitest";
import {
  visitRequestSchema,
  visitActionSchema,
  validVisitDate,
  visitTransition,
  formatVisitDate,
} from "../../src/modules/visits/validation";
describe("Demandes de visite", () => {
  const now = new Date("2026-11-10T10:00:00Z");
  it("borne les demandes entre 30 minutes et 90 jours", () => {
    expect(validVisitDate(new Date("2026-11-10T10:29:59Z"), now)).toBe(false);
    expect(validVisitDate(new Date("2026-11-10T10:30:00Z"), now)).toBe(true);
    expect(validVisitDate(new Date(now.getTime() + 90 * 86400000), now)).toBe(
      true,
    );
    expect(
      validVisitDate(new Date(now.getTime() + 90 * 86400000 + 1), now),
    ).toBe(false);
    expect(validVisitDate(new Date("invalid"), now)).toBe(false);
  });
  it("exige une date avec fuseau et limite le message", () => {
    expect(
      visitRequestSchema.safeParse({
        slug: "bien",
        desiredAt: "2026-11-11T11:00:00",
        message: "",
      }).success,
    ).toBe(false);
    expect(
      visitRequestSchema.safeParse({
        slug: "bien",
        desiredAt: "2026-11-11T11:00:00Z",
        message: "a".repeat(1001),
      }).success,
    ).toBe(false);
    expect(
      visitRequestSchema.safeParse({
        slug: "bien",
        desiredAt: "2026-11-11T11:00:00Z",
        userId: "other",
      }).success,
    ).toBe(false);
  });
  it("réserve l’auto-gestion à l’annulation de demandes actives", () => {
    for (const status of ["REQUESTED", "CONFIRMED"]) {
      expect(visitTransition(status, "CANCEL", true, now, now)).toBe(true);
      expect(
        visitTransition(
          status,
          "CONFIRM",
          true,
          new Date(now.getTime() + 60000),
          now,
        ),
      ).toBe(false);
    }
    for (const status of ["CANCELLED", "REJECTED", "COMPLETED"])
      expect(visitTransition(status, "CANCEL", true, now, now)).toBe(false);
  });
  it("interdit la confirmation passée et la clôture avant la fin de l’heure", () => {
    expect(visitTransition("REQUESTED", "CONFIRM", false, now, now)).toBe(
      false,
    );
    expect(
      visitTransition(
        "REQUESTED",
        "CONFIRM",
        false,
        new Date(now.getTime() + 1),
        now,
      ),
    ).toBe(true);
    expect(
      visitTransition(
        "CONFIRMED",
        "COMPLETE",
        false,
        new Date(now.getTime() - 3599999),
        now,
      ),
    ).toBe(false);
    expect(
      visitTransition(
        "CONFIRMED",
        "COMPLETE",
        false,
        new Date(now.getTime() - 3600000),
        now,
      ),
    ).toBe(true);
  });
  it("rejette actions inconnues et versions manquantes", () => {
    expect(visitActionSchema.safeParse({ action: "PAY" }).success).toBe(false);
    expect(
      visitActionSchema.safeParse({
        action: "CONFIRM",
        expectedUpdatedAt: now.toISOString(),
      }).success,
    ).toBe(true);
  });
  it("affiche l’heure du Burkina indépendamment du poste", () =>
    expect(formatVisitDate("2026-11-10T12:30:00+02:00")).toContain("10:30"));
});
