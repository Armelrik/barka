import { test, expect } from "@playwright/test";
test("charte Afriloc et connexion en fenêtre modale", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.locator(".brand-name").first()).toHaveCSS(
    "color",
    "rgb(249, 115, 22)",
  );
  await expect(page.locator(".site-header")).toHaveCSS("position", "fixed");
  await expect(page.locator(".brand-icon").first()).toHaveCSS(
    "background-image",
    /249, 115, 22/,
  );
  await expect(
    page.getByRole("heading", { name: "Comment Ça Marche" }),
  ).toBeVisible();
  const cta = await page
    .locator("main > section")
    .first()
    .getByRole("link", { name: "Créer mon compte client" })
    .boundingBox();
  const stats = await page.locator(".hero-stats").boundingBox();
  expect(cta && stats && cta.y + cta.height <= stats.y).toBe(true);
  if (isMobile)
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("button", { name: "Connexion", exact: true }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await expect(modal.getByLabel("Mot de passe", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
});
test("catalogue, contact et inscription reprennent la charte", async ({
  page,
}, testInfo) => {
  for (const path of ["/biens", "/contact", "/inscription"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(path.slice(1) + ".png"),
      fullPage: true,
      scale: "css",
    });
  }
});
