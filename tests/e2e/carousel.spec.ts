import { test, expect } from "@playwright/test";

test("photos des cartes, navigation clavier et fiche complète", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto("/biens");
  await expect(page.locator("article")).toHaveCount(8);
  const card = page.locator("article").first();
  const image = card.locator("img");
  const original = await image.getAttribute("src");
  await card
    .getByRole("button", { name: "Photo suivante", exact: true })
    .click();
  await expect(card.locator(".carousel-counter")).toHaveText("2 / 3");
  await expect(image).not.toHaveAttribute("src", original!);
  await expect(image).toHaveJSProperty("complete", true);
  await page.keyboard.press("ArrowRight");
  await expect(card.locator(".carousel-counter")).toHaveText("3 / 3");
  await card
    .getByRole("button", { name: "Photo suivante", exact: true })
    .click();
  await expect(card.locator(".carousel-counter")).toHaveText("1 / 3");
  await card
    .getByRole("button", { name: "Photo précédente", exact: true })
    .click();
  await expect(card.locator(".carousel-counter")).toHaveText("3 / 3");
  await card
    .getByRole("button", { name: "Photo 2 sur 3", exact: true })
    .click();
  await expect(
    card.getByRole("button", { name: "Photo 2 sur 3" }),
  ).toHaveAttribute("aria-pressed", "true");
  if (isMobile) {
    const carousel = card.getByRole("region");
    await carousel.dispatchEvent("touchstart", {
      touches: [{ identifier: 1, clientX: 240 }],
    });
    await carousel.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 100 }],
    });
    await expect(card.locator(".carousel-counter")).toHaveText("3 / 3");
    await carousel.dispatchEvent("touchstart", {
      touches: [{ identifier: 1, clientX: 150 }],
    });
    await carousel.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 150 }],
    });
  }
  await expect(page).toHaveURL(/\/biens$/);
  await card.getByRole("link", { name: /Découvrir/ }).click();
  await expect(page).toHaveURL(/\/biens\/villa-familiale-ouaga-2000$/);
  await expect(page.locator("h1")).toHaveText(
    "Une villa pour toute la famille",
  );
  const gallery = page.getByRole("region", { name: /Photos/ });
  await gallery
    .getByRole("button", { name: "Photo suivante", exact: true })
    .click();
  await expect(gallery.locator(".carousel-counter")).toHaveText("2 / 3");
  await expect(page.locator("h1")).toHaveText(
    "Une villa pour toute la famille",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const actions = page.locator(".detail-panel > .legacy-button");
  const firstAction = await actions.nth(0).boundingBox();
  const secondAction = await actions.nth(1).boundingBox();
  expect(
    firstAction &&
      secondAction &&
      secondAction.y >= firstAction.y + firstAction.height + 8,
  ).toBe(true);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: testInfo.outputPath("fiche-galerie.png"),
    fullPage: true,
    scale: "css",
  });
});
