import { test, expect } from "@playwright/test";
test("accueil français, recherche et fiche, sans débordement mobile", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Trouvez le bien",
  );
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
  }));
  expect(fonts.heading).toBe(fonts.body);
  expect(fonts.body.toLowerCase()).not.toContain("arial");
  await expect(
    page.getByText("Version de démonstration", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const img of await page.locator("article img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty("complete", true);
    expect(
      await img.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: testInfo.outputPath("accueil.png"),
    fullPage: true,
  });
  await page.getByLabel("Votre projet").selectOption("RENT");
  await page.getByLabel("Localisation").fill("Zone du Bois");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page
    .getByRole("heading", { name: "Un duplex ouvert sur la lumière" })
    .getByRole("link")
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Un duplex ouvert sur la lumière",
  );
  await expect(
    page.getByText("Il ne peut pas être réservé", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("favoris persistants et navigation accessible", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Navigation mobile" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Navigation mobile" })
      .getByRole("link", { name: "Nos biens" })
      .click();
    await expect(
      page.getByRole("button", { name: "Ouvrir le menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  await page
    .getByRole("button", {
      name: "Ajouter aux favoris : Une villa pour toute la famille",
    })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Retirer des favoris : Une villa pour toute la famille",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Mes favoris/ }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Retirer des favoris : Une villa pour toute la famille",
    })
    .click();
  await expect(page.getByText("Aucun favori pour le moment.")).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher tous les exemples" })
    .click();
  await expect(page.locator("article")).toHaveCount(4);
});
test("recherche sans résultat puis retour aux exemples", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Budget maximum").fill("1");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(
    page.getByText("Aucun exemple ne correspond à votre recherche."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher tous les exemples" })
    .click();
  await expect(page.locator("article")).toHaveCount(4);
  await expect(page.getByLabel("Budget maximum")).toHaveValue("");
});
