import { test, expect, db, jsonHeaders, registrationData } from "./fixtures";

test("les accès privés anonymes sont refusés et la page redirige", async ({
  request,
  page,
}) => {
  for (const path of ["/api/v1/me", "/api/v1/users"])
    expect((await request.get(path)).status()).toBe(401);
  await page.goto("/espace");
  await expect(page).toHaveURL(/\/connexion$/);
});
test("une inscription sans email est atomique, CLIENT et rattachée au commercial par défaut", async ({
  request,
  accounts,
}) => {
  const data = registrationData();
  accounts.trackPhone(data.phone);
  const response = await request.post("/api/v1/auth/register", {
    headers: jsonHeaders,
    data: { ...data, email: null },
  });
  expect(response.status()).toBe(201);
  expect(response.headers()["set-cookie"]).toContain("HttpOnly");
  expect(response.headers()["set-cookie"].toLowerCase()).toContain(
    "samesite=lax",
  );
  const user = await db.user.findUniqueOrThrow({
    where: { phone: data.phone },
    include: {
      role: true,
      parentLink: true,
      company: true,
      consents: true,
      clientProfile: true,
      sessions: true,
    },
  });
  expect(user.role.code).toBe("CLIENT");
  expect(user.email).toBeNull();
  expect(user.parentLink?.parentId).toBe(user.company.defaultCommercialId);
  expect(user.consents).toHaveLength(2);
  expect(user.clientProfile).not.toBeNull();
  expect(user.sessions).toHaveLength(1);
  expect(user.sessions[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  const me = await request.get("/api/v1/me");
  expect(me.status()).toBe(200);
  expect(await me.text()).not.toContain("passwordHash");
  expect((await request.get("/api/v1/users")).status()).toBe(403);
});
test("l'inscription refuse une élévation de rôle, une autre société et un doublon", async ({
  request,
  accounts,
}) => {
  const data = registrationData();
  accounts.trackPhone(data.phone);
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers: jsonHeaders,
        data: { ...data, role: "SUPER_ADMIN", companyId: "other" },
      })
    ).status(),
  ).toBe(400);
  expect(await db.user.count({ where: { phone: data.phone } })).toBe(0);
  const account = await accounts.create("CLIENT");
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers: jsonHeaders,
        data: { ...data, phone: account.phone },
      })
    ).status(),
  ).toBe(409);
});
test("connexion par email et téléphone, cookie falsifié refusé et déconnexion révoquée", async ({
  request,
  accounts,
}) => {
  const account = await accounts.create("CLIENT");
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: {
          identifier: account.email.toUpperCase(),
          password: account.password,
        },
      })
    ).status(),
  ).toBe(200);
  const state = await request.storageState();
  const cookie = state.cookies.find(
    (cookie) => cookie.name === "barka.session",
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  expect(
    (
      await request.get("/api/v1/me", {
        headers: { Cookie: "barka.session=forged.invalid" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/v1/auth/logout", {
        headers: jsonHeaders,
        data: {},
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.get("/api/v1/me", {
        headers: { Cookie: `barka.session=${cookie.value}` },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: account.phone, password: account.password },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/v1/me")).status()).toBe(200);
});
test("un compte suspendu ou une session expirée perd immédiatement l'accès", async ({
  request,
  accounts,
}) => {
  const account = await accounts.create("CLIENT");
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: account.phone, password: account.password },
      })
    ).status(),
  ).toBe(200);
  await db.user.update({
    where: { id: account.id },
    data: { status: "SUSPENDED" },
  });
  expect((await request.get("/api/v1/me")).status()).toBe(401);
  await db.user.update({
    where: { id: account.id },
    data: { status: "ACTIVE" },
  });
  await db.authSession.updateMany({
    where: { userId: account.id },
    data: {
      createdAt: new Date(Date.now() - 86400000),
      expiresAt: new Date(Date.now() - 60000),
    },
  });
  expect((await request.get("/api/v1/me")).status()).toBe(401);
});
test("un manager ne voit ni ses pairs, ni les autres équipes ou sociétés, et son rôle est relu", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER");
  const commercial = await accounts.create("COMMERCIAL", {
    parentId: manager.id,
  });
  const client = await accounts.create("CLIENT", { parentId: commercial.id });
  const sibling = await accounts.create("MANAGER");
  const otherTeam = await accounts.create("CLIENT", { parentId: sibling.id });
  const otherCompany = await accounts.create("CLIENT", {
    companyId: await accounts.createCompany(),
  });
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: manager.phone, password: manager.password },
      })
    ).status(),
  ).toBe(200);
  const response = await request.get("/api/v1/users");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.items.map((item: { id: string }) => item.id).sort()).toEqual(
    [commercial.id, client.id].sort(),
  );
  expect(body.total).toBe(2);
  expect(JSON.stringify(body)).not.toContain("passwordHash");
  expect((await request.get(`/api/v1/users/${client.id}`)).status()).toBe(200);
  for (const id of [manager.id, sibling.id, otherTeam.id, otherCompany.id])
    expect((await request.get(`/api/v1/users/${id}`)).status()).toBe(404);
  const role = await db.role.findUniqueOrThrow({ where: { code: "CLIENT" } });
  await db.user.update({
    where: { id: manager.id },
    data: { roleId: role.id },
  });
  expect((await request.get("/api/v1/users")).status()).toBe(403);
});
test("les origines étrangères, contenus invalides et redirections injectées sont refusés", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: { ...jsonHeaders, Origin: "https://evil.example" },
        data: { identifier: "test@barka.example", password: "x" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: { Origin: jsonHeaders.Origin, "Content-Type": "text/plain" },
        data: "{}",
      })
    ).status(),
  ).toBe(415);
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: {
          identifier: "test@barka.example",
          password: "x",
          next: "https://evil.example",
        },
      })
    ).status(),
  ).toBe(400);
});
test("les tentatives sont limitées en base même en changeant un en-tête IP non fiable", async ({
  request,
}) => {
  const data = registrationData();
  for (let i = 0; i < 5; i++)
    expect(
      (
        await request.post("/api/v1/auth/login", {
          headers: { ...jsonHeaders, "x-forwarded-for": `192.0.2.${i}` },
          data: { identifier: data.phone, password: data.password },
        })
      ).status(),
    ).toBe(401);
  const blocked = await request.post("/api/v1/auth/login", {
    headers: { ...jsonHeaders, "x-forwarded-for": "192.0.2.99" },
    data: { identifier: data.phone, password: data.password },
  });
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
});
