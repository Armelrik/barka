import { test, expect, db } from "./fixtures";
import { readFile } from "node:fs/promises";
test("dossier immobilier : formulaire, médias, carte privée et éditeur immersif", async ({
  page,
  accounts,
}, testInfo) => {
  const manager = await accounts.create("MANAGER"),
    commercial = await accounts.create("COMMERCIAL", { parentId: manager.id });
  const location = await db.location.findUniqueOrThrow({
    where: { code: "LOCATION-DEMO-001" },
  });
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(manager.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(manager.password);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/espace/biens");
  await page
    .getByRole("link", { name: "Ajouter un bien", exact: true })
    .click();
  await page
    .getByLabel("Titre du bien", { exact: true })
    .fill("Maison fictive du parcours navigateur");
  await page.getByLabel("Prix en FCFA").fill("12000000");
  await page.getByLabel("Surface en m²").fill("180");
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "Description fictive du bien destinée à tester le formulaire immobilier.",
    );
  await page.getByLabel("Commercial responsable").selectOption(commercial.id);
  await page.getByLabel("Localité", { exact: true }).selectOption(location.id);
  await page.getByLabel("Latitude (facultative)").fill("12.3456");
  await page.getByLabel("Longitude (facultative)").fill("-1.5123");
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page).toHaveURL(/\/espace\/biens\/[^/?]+\?saved=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Maison fictive du parcours navigateur",
  );
  await expect(
    page.getByRole("heading", { name: "Validation et publication" }),
  ).toBeVisible();
  const panorama = await readFile(
    new URL("../../public/immersive-demo/salon.jpg", import.meta.url),
  );
  await page.getByLabel("Usage du fichier").selectOption("PANORAMA");
  await page.getByLabel("Fichier", { exact: true }).setInputFiles({
    name: "panorama-test.jpg",
    mimeType: "image/jpeg",
    buffer: panorama,
  });
  await page.getByLabel("Légende", { exact: true }).fill("Salon test");
  await page.getByRole("button", { name: "Ajouter le fichier" }).click();
  await expect(page.getByText("Salon test", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter une pièce" }).click();
  await page.getByLabel("Nom de la pièce 1").fill("Salon");
  await page
    .getByRole("button", { name: "Enregistrer la visite", exact: true })
    .click();
  await expect(page.getByLabel("Nom de la pièce 1")).toHaveValue("Salon");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dossier-immobilier.png"),
    fullPage: true,
    scale: "css",
  });
  await page
    .getByRole("link", { name: "Prévisualiser la visite enregistrée" })
    .click();
  await expect(
    page.getByText("Prévisualisation privée du dossier enregistré."),
  ).toBeVisible();
  await expect(page.locator(".tour-room-title")).toHaveText("Salon");
});
