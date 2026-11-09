import { test, expect } from "@playwright/test";
test("véritable panorama 360°, navigation entre pièces et modèle GLB", async ({
  page,
}, testInfo) => {
  await page.goto("/visites/demo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Une autre façon de visiter",
  );
  await expect(page.locator(".webgl-surface")).toHaveAttribute(
    "data-renderer-state",
    "ready",
    { timeout: 20000 },
  );
  await expect(
    page.getByText("Démonstration géométrique fictive", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Vignettes des pièces" })
    .getByRole("button", { name: "Cuisine", exact: true })
    .click();
  await expect(page.locator(".tour-room-title")).toHaveText("Cuisine");
  await expect(page.locator(".webgl-surface")).toHaveAttribute(
    "data-renderer-state",
    "ready",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Lancer la visite guidée" }).click();
  await expect(
    page.getByRole("button", { name: "Arrêter la visite guidée" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Arrêter la visite guidée" }).click();
  await page.getByRole("button", { name: "Modèle 3D", exact: true }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "aria-label",
    /Modèle 3D/,
  );
  await expect(page.locator(".webgl-surface")).toHaveAttribute(
    "data-renderer-state",
    "ready",
    { timeout: 20000 },
  );
  await page.locator("canvas").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("+");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("modele-3d.png"),
    fullPage: true,
    scale: "css",
  });
});
test("carte publique, points fictifs et liens vers les fiches", async ({
  page,
}, testInfo) => {
  await page.route("https://tile.openstreetmap.org/**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
        "base64",
      ),
    }),
  );
  await page.goto("/carte");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Les biens sur la carte",
  );
  await expect(
    page.getByRole("region", { name: "Carte des biens immobiliers" }),
  ).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(8);
  await expect(page.getByText("OpenStreetMap", { exact: true })).toBeVisible();
  await page.locator(".leaflet-marker-icon").first().click();
  await expect(
    page.getByRole("link", { name: "Voir le bien", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("carte.png"),
    fullPage: true,
    scale: "css",
  });
});
