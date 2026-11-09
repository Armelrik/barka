import { describe, it, expect } from "vitest";
import { deploymentProblems } from "../../src/modules/deployment/config";
import { bootstrapSchema } from "../../src/modules/deployment/bootstrap";
import { hostedMediaRelay, mediaLimitMb } from "../../src/modules/media/limits";
import { vi, afterEach } from "vitest";
const ready = {
  DATABASE_URL:
    "postgresql://user:secret@ep-fixture-pooler.neon.tech/main?sslmode=require",
  DIRECT_URL:
    "postgresql://user:secret@ep-fixture.neon.tech/main?sslmode=require",
  AUTH_SECRET: "a".repeat(48),
  AUTH_URL: "https://barka.example",
  BARKA_COMPANY_CODE: "BARKA",
  CATALOG_MODE: "database",
  MEDIA_DRIVER: "s3",
  S3_BUCKET: "private",
  S3_REGION: "auto",
  S3_ACCESS_KEY_ID: "fixture",
  S3_SECRET_ACCESS_KEY: "fixture",
  NEXT_PUBLIC_MEDIA_MAX_MB: "4",
};
describe("Configuration hébergée", () => {
  it("refuse deux branches Neon différentes pour migrations et application", () =>
    expect(
      deploymentProblems({
        ...ready,
        DIRECT_URL: ready.DIRECT_URL.replace("ep-fixture.", "ep-other."),
      }),
    ).toHaveLength(1));
  afterEach(() => vi.unstubAllEnvs());
  it("valide une configuration Neon/Vercel sans retourner de valeurs secrètes", () =>
    expect(deploymentProblems(ready)).toEqual([]));
  it("refuse les connexions locales et les migrations via le pooler", () => {
    expect(
      deploymentProblems({
        ...ready,
        DATABASE_URL: "postgresql://user:password@localhost/main",
        DIRECT_URL: ready.DATABASE_URL,
      }).length,
    ).toBeGreaterThan(0);
  });
  it("bloque comptes démo, bootstrap persistant et stockage local", () => {
    const problems = deploymentProblems({
      ...ready,
      DEMO_PASSWORD: "secret",
      BOOTSTRAP_ADMIN_PASSWORD: "secret",
      MEDIA_DRIVER: "local",
    });
    expect(problems).toHaveLength(3);
    expect(problems.join(" ")).not.toContain("secret");
  });
  it("refuse une origine HTTP et les inscriptions sans textes validés", () =>
    expect(
      deploymentProblems({
        ...ready,
        AUTH_URL: "http://barka.example",
        REGISTRATION_ENABLED: "true",
      }),
    ).toHaveLength(2));
  it("accepte une preview sur son origine Vercel explicite", () =>
    expect(
      deploymentProblems({
        ...ready,
        AUTH_URL: "",
        VERCEL_ENV: "preview",
        VERCEL_URL: "barka-preview.vercel.app",
      }),
    ).toEqual([]));
  it("refuse une initialisation avec comptes identiques ou société démo", () => {
    const data = {
      companyCode: "BARKA",
      companyName: "Barka SARL",
      admin: {
        firstName: "Compte",
        lastName: "Initial",
        phone: "+22670000001",
        password: "fixture-password-1234",
      },
      defaultPhone: "+22670000001",
    };
    expect(bootstrapSchema.safeParse(data).success).toBe(false);
    expect(
      bootstrapSchema.safeParse({
        ...data,
        companyCode: "BARKA-DEMO",
        defaultPhone: "+22670000002",
      }).success,
    ).toBe(false);
  });
  it("limite le relais Vercel à 4 Mo et garde les limites locales", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NEXT_PUBLIC_MEDIA_MAX_MB", "");
    expect(hostedMediaRelay()).toBe(false);
    expect(mediaLimitMb("MODEL_3D")).toBe(32);
    expect(mediaLimitMb("PHOTO")).toBe(16);
    vi.stubEnv("VERCEL", "1");
    expect(mediaLimitMb("MODEL_3D")).toBe(4);
  });
});
