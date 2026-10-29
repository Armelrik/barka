import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";
const databaseUrl = process.env.TEST_DATABASE_URL;
if (
  !databaseUrl ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname)
)
  throw new Error(
    "TEST_DATABASE_URL doit viser une base locale de test dédiée, migrée et seedée.",
  );
const testSecret = randomBytes(48).toString("hex");
export default defineConfig({
  testDir: "./tests/auth",
  fullyParallel: false,
  workers: 1,
  outputDir: "auth-test-results",
  timeout: 45000,
  use: { baseURL: "http://127.0.0.1:3002", trace: "retain-on-failure" },
  projects: [
    { name: "security", testMatch: "**/auth.api.spec.ts" },
    {
      name: "desktop",
      testMatch: "**/auth.ui.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: "**/auth.ui.spec.ts",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3002",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      AUTH_SECRET: testSecret,
      DATABASE_URL: databaseUrl,
      DATABASE_POOL_MAX: "1",
      AUTH_URL: "http://127.0.0.1:3002",
      BARKA_COMPANY_CODE: "BARKA-DEMO",
      REGISTRATION_ENABLED: "true",
      LEGAL_DOCUMENTS_APPROVED: "true",
      AUTH_TRUST_PROXY_HEADERS: "false",
    },
  },
});
