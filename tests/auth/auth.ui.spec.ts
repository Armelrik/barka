import { test, expect, registrationData } from "./fixtures";
test("inscription, espace client et reconnexion sur ordinateur et mobile", async ({
  page,
  accounts,
}, testInfo) => {
  const data = registrationData();
  accounts.trackPhone(data.phone);
  await page.goto("/inscription");
  await expect(
    page.getByRole("heading", { name: "Faisons connaissance." }),
  ).toBeVisible();
  await page.getByLabel("Prénom", { exact: true }).fill(data.firstName);
  await page.getByLabel("Nom", { exact: true }).fill(data.lastName);
  await page.getByLabel("Téléphone", { exact: true }).fill(data.phone);
  await page.getByLabel("Email (facultatif)", { exact: true }).fill(data.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(data.password);
  await page.getByRole("checkbox").check();
  await page.screenshot({
    path: testInfo.outputPath("inscription.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Créer mon compte gratuit" }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await expect(
    page.getByRole("heading", { name: "Bonjour Compte." }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Navigation de mon espace" })
      .getByRole("link", { name: "Mon équipe" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("espace-client.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Me déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.getByLabel("Téléphone ou email").fill(data.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(data.password);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Compte." }),
  ).toBeVisible();
});
test("espace et annuaire d'équipe réservés au manager autorisé", async ({
  page,
  accounts,
}, testInfo) => {
  const manager = await accounts.create("MANAGER");
  const commercial = await accounts.create("COMMERCIAL", {
    parentId: manager.id,
  });
  const client = await accounts.create("CLIENT", { parentId: commercial.id });
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(manager.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(manager.password);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Compte." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Navigation de mon espace" })
    .getByRole("link", { name: "Mon équipe" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Mon équipe." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "2 membres" })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(
    table.getByRole("cell", { name: commercial.phone, exact: true }),
  ).toBeVisible();
  await expect(
    table.getByRole("cell", { name: client.phone, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("equipe.png"),
    fullPage: true,
  });
});
