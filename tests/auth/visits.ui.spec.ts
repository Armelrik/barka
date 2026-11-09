import { test, expect, proposedAt } from "./visits-fixtures";
test("demande client, confirmation par l’équipe et annulation", async ({
  page,
  visits,
}, testInfo) => {
  async function signIn(account: { phone: string; password: string }) {
    await page.goto("/connexion");
    await page.getByLabel("Téléphone ou email").fill(account.phone);
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill(account.password);
    await page
      .getByRole("button", { name: "Me connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/espace$/);
  }
  await signIn(visits.client);
  await page.goto(`/biens/${visits.slug}`);
  await page
    .getByLabel("Jour et heure souhaités")
    .fill(proposedAt().slice(0, 16));
  await page
    .getByLabel("Votre message (facultatif)")
    .fill("Je souhaite visiter avec ma famille.");
  await page
    .getByRole("button", { name: "Demander ce créneau", exact: true })
    .click();
  await expect(
    page.getByText("Votre demande a été enregistrée", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Suivre ma demande" }).click();
  await expect(page.locator(".visit-card")).toHaveCount(1);
  await expect(page.locator(".visit-status")).toHaveText("En attente");
  await page.getByRole("button", { name: "Me déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await signIn(visits.manager);
  await page.goto("/espace/visites?view=team");
  await page
    .getByLabel("Réponse au client")
    .fill("Nous vous attendons devant l’entrée.");
  await page.getByRole("button", { name: "Confirmer le créneau" }).click();
  await expect(page.locator(".visit-status")).toHaveText("Confirmée");
  await expect(
    page.getByText("Nous vous attendons devant l’entrée.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({
    path: testInfo.outputPath("visite-confirmee.png"),
    fullPage: true,
    scale: "css",
  });
  await page.getByRole("button", { name: "Me déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await signIn(visits.client);
  await page.goto("/espace/visites");
  await expect(page.locator(".visit-status")).toHaveText("Confirmée");
  await page.getByRole("button", { name: "Annuler la visite" }).click();
  await expect(page.locator(".visit-status")).toHaveText("Annulée");
});
