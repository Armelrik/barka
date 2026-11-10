import { test, expect, db } from "./visits-fixtures";
test("filtres connectés : paramètres conservés dans l’URL et après rechargement", async ({
  page,
  visits,
}, info) => {
  const row = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: {
      property: { include: { location: { include: { parent: true } } } },
    },
  });
  await db.property.update({
    where: { id: row.propertyId },
    data: {
      type: "APARTMENT",
      furnishing: "FURNISHED",
      rentalDuration: "SHORT",
      rentPricePeriod: "NIGHT",
    },
  });
  await db.listing.update({
    where: { id: row.id },
    data: { offer: "RENT", priceXof: 45001, publishedAt: new Date() },
  });
  await page.goto("/biens");
  await page
    .getByRole("combobox", { name: "Ville", exact: true })
    .selectOption(row.property.location.parent!.name);
  await page
    .getByRole("combobox", { name: "Quartier", exact: true })
    .fill(row.property.location.name);
  await page
    .getByRole("option", { name: row.property.location.name, exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Votre projet", exact: true })
    .selectOption("RENT");
  await page
    .getByRole("combobox", { name: "Type de bien", exact: true })
    .selectOption("apartment");
  await page
    .getByRole("combobox", { name: "Ameublement", exact: true })
    .selectOption("FURNISHED");
  await page
    .getByRole("combobox", { name: "Durée de location", exact: true })
    .selectOption("SHORT");
  await page
    .getByRole("combobox", { name: "Prix de location par", exact: true })
    .selectOption("NIGHT");
  await page.getByLabel("Budget minimum").fill("40000");
  await page.getByLabel("Budget maximum").fill("50000");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page).toHaveURL(/furnishing=FURNISHED/);
  await expect(page.locator("article.property-card")).toHaveCount(1);
  await expect(page.locator(".card-price")).toContainText("/ nuit");
  await page
    .getByRole("combobox", { name: "Trier par", exact: true })
    .selectOption("oldest");
  await expect(page).toHaveURL(/sort=oldest/);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Ameublement", exact: true }),
  ).toHaveValue("FURNISHED");
  await expect(
    page.getByRole("combobox", { name: "Trier par", exact: true }),
  ).toHaveValue("oldest");
  await expect(page.locator("article.property-card")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("catalogue-connecte.png"),
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
});

test("pagination : arrivée sur les résultats et filtres conservés", async ({
  page,
  visits,
}) => {
  const listing = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
  });
  await db.property.update({
    where: { id: listing.propertyId },
    data: { type: "WAREHOUSE" },
  });
  await db.listing.createMany({
    data: Array.from({ length: 13 }, (_, i) => ({
      slug: `pagination-${listing.id}-${i}`,
      propertyId: listing.propertyId,
      authorId: listing.authorId,
      offer: "SALE" as const,
      priceXof: 99555,
      status: "PUBLISHED" as const,
      publishedAt: new Date(Date.now() - i * 1000),
      expiresAt: new Date(Date.now() + 86400000),
    })),
  });
  await page.goto("/biens?category=warehouse&minPrice=99555&maxPrice=99555");
  await expect(page.locator("article.property-card")).toHaveCount(12);
  await page.getByRole("link", { name: "Suivante", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("article.property-card")).toHaveCount(1);
  await expect
    .poll(async () =>
      Math.round((await page.locator(".catalog-results").boundingBox())!.y),
    )
    .toBe(100);
  expect(new URL(page.url()).searchParams.get("category")).toBe("warehouse");
  expect(new URL(page.url()).searchParams.get("minPrice")).toBe("99555");
});
