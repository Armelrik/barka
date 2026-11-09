import { test, expect } from "@playwright/test";
test("demande de visite de démonstration explicite et sans écriture", async ({
  page,
}) => {
  let mutations = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/visits") && request.method() === "POST")
      mutations++;
  });
  await page.goto("/biens/villa-familiale-ouaga-2000");
  await expect(
    page.getByText("Le formulaire simule une demande sans l’envoyer.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Jour et heure souhaités")
    .fill(new Date(Date.now() - 86400000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Simuler une demande" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Choisissez un horaire" }),
  ).toBeVisible();
  await page
    .getByLabel("Jour et heure souhaités")
    .fill(new Date(Date.now() + 48 * 3600000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Simuler une demande" }).click();
  await expect(
    page.getByText("Aucun rendez-vous n’a été créé.", { exact: true }),
  ).toBeVisible();
  expect(mutations).toBe(0);
  await page.getByRole("button", { name: "Essayer un autre horaire" }).click();
  await expect(page.getByLabel("Jour et heure souhaités")).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Choisissez un horaire" }),
  ).toHaveCount(0);
});
