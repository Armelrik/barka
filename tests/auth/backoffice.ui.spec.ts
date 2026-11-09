import { test, expect, db } from "./fixtures";
import { randomUUID } from "node:crypto";
test("back-office : tableau de bord, navigation active, activité, réglages et sécurité", async ({
  page,
  accounts,
}, info) => {
  const admin = await accounts.create("ADMIN");
  const agent = await accounts.create("COMMERCIAL", { parentId: admin.id });
  const location = await db.location.findUniqueOrThrow({
    where: { code: "LOCATION-DEMO-001" },
  });
  for (let i = 1; i <= 3; i++) {
    const property = await db.property.create({
      data: {
        reference: `BACKOFFICE-${randomUUID()}`,
        title: `Villa de démonstration ${i}`,
        description: "Dossier fictif du test d’interface et de son périmètre.",
        type: "VILLA",
        companyId: admin.companyId,
        agentId: agent.id,
        locationId: location.id,
        surfaceM2: 150,
      },
    });
    await db.listing.create({
      data: {
        slug: `backoffice-${randomUUID()}`,
        propertyId: property.id,
        authorId: admin.id,
        offer: "SALE",
        priceXof: 15000000,
      },
    });
  }

  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(admin.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(admin.password);
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await expect(
    page.getByRole("heading", { name: "Derniers dossiers" }),
  ).toBeVisible();
  await expect(page.locator(".backoffice-metrics strong").first()).toHaveText(
    "3",
  );
  await expect(
    page.getByText("Villa de démonstration 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Répartition des biens par commercial" }),
  ).toBeVisible();
  await page.goto("/espace/parametres");
  await expect(
    page.getByRole("link", { name: "Paramètres", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByLabel("Durée de validation des annonces (jours)"),
  ).toBeVisible();
  await page.goto("/espace/activite");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Historique d’activité.",
  );
  await page.goto("/espace/compte");
  await expect(page.getByLabel("Mot de passe actuel")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/espace");
  await expect(page.getByRole("heading", { name: "Derniers dossiers" })).toBeVisible();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: info.outputPath("backoffice.png"),
    fullPage: true,
    scale: "css",
  });
});
