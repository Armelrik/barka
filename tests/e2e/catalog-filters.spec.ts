import { test, expect } from "@playwright/test";
test("navigation en haut, filtres latéraux, quartier recherchable et tri", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/");
  await page
    .locator("footer")
    .getByRole("link", { name: "Toutes les propriétés", exact: true })
    .click();
  await expect(page).toHaveURL(/\/biens$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(120);
  await expect(page.locator("article.property-card")).toHaveCount(8);
  const first = await page.locator("article h3").first().innerText();
  await page.getByLabel("Trier par").selectOption("oldest");
  await expect(page.locator("article h3").first()).not.toHaveText(first);
  if (!isMobile) {
    await page.evaluate(() => scrollTo({ top: 800, behavior: "instant" }));
    await expect
      .poll(async () =>
        Math.round(
          (await page.locator(".catalog-filter-sidebar").boundingBox())!.y,
        ),
      )
      .toBe(96);
  }
  await page
    .getByRole("combobox", { name: "Ville", exact: true })
    .selectOption("Ouagadougou");
  const district = page.getByRole("combobox", {
    name: "Quartier",
    exact: true,
  });
  await district.fill("zone du bois");
  await page.getByRole("option", { name: "Zone du Bois", exact: true }).click();
  await page.getByLabel("Votre projet").selectOption("RENT");
  await page
    .getByRole("combobox", { name: "Type de bien", exact: true })
    .selectOption("townhouse");
  await page.getByLabel("Budget minimum").fill("300000");
  await page.getByLabel("Budget maximum").fill("500000");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.locator("article.property-card")).toHaveCount(1);
  await expect(page.locator("article h3")).toContainText(
    "Un duplex ouvert sur la lumière",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("catalogue-filtres.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
});
