import { test, expect, registrationData } from "./fixtures";
test("gestion d'équipe : création, modification, suspension et historique", async ({
  page,
  accounts,
}, testInfo) => {
  const manager = await accounts.create("MANAGER"),
    data = registrationData();
  accounts.trackPhone(data.phone);
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(manager.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(manager.password);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/espace/equipe");
  await page
    .getByRole("link", { name: "Créer un compte", exact: true })
    .click();
  await page.getByLabel("Prénom", { exact: true }).fill(data.firstName);
  await page.getByLabel("Nom", { exact: true }).fill(data.lastName);
  await page.getByLabel("Téléphone", { exact: true }).fill(data.phone);
  await page.getByLabel("Email (facultatif)", { exact: true }).fill(data.email);
  await page
    .getByLabel("Mot de passe initial", { exact: true })
    .fill(data.password);
  await page.getByLabel("Rôle", { exact: true }).selectOption("COMMERCIAL");
  await expect(
    page
      .getByLabel("Responsable de rattachement")
      .getByRole("option", { name: /Compte Test — Manager/ }),
  ).toHaveCount(1);
  await page.getByLabel("Responsable de rattachement").selectOption(manager.id);
  await page
    .getByRole("button", { name: "Créer le compte", exact: true })
    .click();
  await expect(page).toHaveURL(/\/espace\/equipe\/[^/?]+\?saved=1$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;
  accounts.trackId(id);
  await expect(
    page.getByText("Les informations ont été enregistrées."),
  ).toBeVisible();
  await expect(page.getByText(/^Identifiant démarcheur/)).toBeVisible();
  await page.getByLabel("Nom", { exact: true }).fill("Modifié");
  await page.getByLabel("Statut du compte").selectOption("SUSPENDED");
  await page
    .getByRole("button", { name: "Enregistrer les modifications" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Compte Modifié",
  );
  await expect(page.getByLabel("Statut du compte")).toHaveValue("SUSPENDED");
  await expect(
    page.getByRole("heading", { name: "Historique des changements" }),
  ).toBeVisible();
  await expect(page.getByText("Statut : Actif → Suspendu.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("gestion-compte.png"),
    fullPage: true,
    scale: "css",
  });
  await page.getByRole("link", { name: "Retour à l’équipe" }).click();
  await page.getByLabel("Rechercher", { exact: true }).fill("Modifié");
  await page.getByRole("button", { name: "Filtrer", exact: true }).click();
  await expect(
    page.getByRole("table").getByText("Compte Modifié"),
  ).toBeVisible();
});
