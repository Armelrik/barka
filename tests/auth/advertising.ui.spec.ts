import { test, expect, db } from "./fixtures";
test("publicités : carrousel responsive, gestion et rapport superadministrateur", async ({
  page,
  accounts,
}) => {
  const root = await accounts.create("SUPER_ADMIN");
  const from = new Date(Date.now() - 3600000),
    to = new Date(Date.now() + 86400000);
  for (const [i, placement] of [
    "HERO",
    "HERO",
    "AFTER_HERO",
    "BEFORE_FOOTER",
  ].entries())
    await db.advertisement.create({
      data: {
        title: `Campagne présentation ${i + 1}`,
        sponsorName: "BARKA",
        campaignKind: "HOUSE",
        placement,
        targetUrl: "/biens",
        imagePath: "/afriloc/house1.jpg",
        startsAt: from,
        endsAt: to,
        active: true,
        ownerId: root.id,
        companyId: root.companyId,
        priority: 100 - i,
      },
    });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trouvez la Maison de Vos Rêves.",
  );
  const hero = page.getByRole("region", { name: "Annonces à la une" });
  await expect(hero).toBeVisible();
  const first = await hero.locator("h2").innerText();
  await hero.getByRole("button", { name: "Publicité suivante" }).click();
  await expect(hero.locator("h2")).not.toHaveText(first);
  await expect(page.locator(".ad-slot-after_hero")).toBeVisible();
  await expect(page.locator(".ad-slot-before_footer")).toBeAttached();
  const stats = await page.locator(".hero-stats").boundingBox();
  const ad = await hero.boundingBox();
  expect(ad!.y + ad!.height).toBeLessThanOrEqual(stats!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(root.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(root.password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/espace/publicites");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Publicités et campagnes",
  );
  await page
    .getByLabel("Titre de la publicité", { exact: true })
    .fill("Campagne créée dans le formulaire");
  await page
    .getByRole("button", { name: "Créer la campagne", exact: true })
    .click();
  await expect(
    page.getByText("Campagne créée.", { exact: true }),
  ).toBeVisible();
  await page.goto("/espace/statistiques");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Audience et performances",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exporter l’audience (CSV)" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(
    /^barka-audience-.*\.csv$/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
