import { test, expect, db, proposal, proposedAt } from "./visits-fixtures";
import { createHash, randomBytes } from "node:crypto";

test("favoris, recherche enregistrée, notification et agenda depuis les interfaces", async ({
  page,
  visits,
}) => {
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(visits.client.phone);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(visits.client.password);
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto(`/biens/${visits.slug}`);
  await page.getByRole("button", { name: /Ajouter aux favoris/ }).click();
  await expect(
    page.getByRole("button", { name: /Retirer des favoris/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/espace/favoris");
  await expect(
    page.getByRole("heading", { name: "Mes favoris", exact: true }),
  ).toBeVisible();
  await expect(page.locator("article.property-card")).toHaveCount(1);
  await page.goto("/biens");
  await page.getByText("Enregistrer cette recherche", { exact: true }).click();
  await page.getByLabel("Nom de la recherche").fill("Mon projet immobilier");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByText("Recherche enregistrée.", { exact: false }),
  ).toBeVisible();
  await page.goto("/espace/recherches");
  await expect(
    page.getByRole("heading", { name: "Mon projet immobilier" }),
  ).toBeVisible();
  expect((await proposal(visits.customer, visits.slug)).status()).toBe(201);
  await page.goto("/espace/notifications");
  await expect(
    page.getByRole("heading", { name: "Nouvelle demande de visite" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(
    page.getByText("0 notification non lue", { exact: true }),
  ).toBeVisible();
  await page.context().clearCookies();
  await page.goto("/connexion");
  await page.getByLabel("Téléphone ou email").fill(visits.manager.phone);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(visits.manager.password);
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/espace/disponibilites");
  const start = proposedAt(48);
  await page.getByLabel("Début", { exact: true }).fill(start.slice(0, 16));
  await page
    .getByLabel("Fin", { exact: true })
    .fill(new Date(Date.parse(start) + 2 * 3600000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Ajouter la disponibilité" }).click();
  await expect(page.locator(".availability-list li")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("récupération par lien : jeton hors URL HTTP et nouveau mot de passe", async ({
  page,
  accounts,
}) => {
  const user = await accounts.create("CLIENT"),
    raw = randomBytes(32).toString("hex");
  const hash = (v: string) => createHash("sha256").update(v).digest("hex");
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  await db.passwordReset.create({
    data: {
      userId: user.id,
      email: user.email,
      tokenHash: hash(raw),
      passwordVersion: hash(row.passwordHash),
      expiresAt: new Date(Date.now() + 15 * 60000),
    },
  });
  const leaked: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes(raw)) leaked.push(req.url());
  });
  await page.goto(`/reinitialiser-mot-de-passe#token=${raw}`);
  await page
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("My-new-long-password-2026");
  await page
    .getByLabel("Confirmer le mot de passe")
    .fill("My-new-long-password-2026");
  await page
    .getByRole("button", { name: "Enregistrer mon mot de passe" })
    .click();
  await expect(page).toHaveURL(/\/connexion\?passwordChanged=1$/);
  expect(leaked).toEqual([]);
  await page.getByLabel("Téléphone ou email").fill(user.phone);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("My-new-long-password-2026");
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
});
