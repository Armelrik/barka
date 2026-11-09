import { test, expect, db, jsonHeaders, origin } from "./fixtures";
import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
async function login(
  ctx: APIRequestContext,
  a: { phone: string; password: string },
) {
  return ctx.post("/api/v1/auth/login", {
    headers: jsonHeaders,
    data: { identifier: a.phone, password: a.password },
  });
}
test("mot de passe personnel : ancien secret requis, sessions révoquées, nouvelle connexion", async ({
  accounts,
  request,
  playwright,
}) => {
  const account = await accounts.create("CLIENT");
  expect((await login(request, account)).status()).toBe(200);
  const second = await playwright.request.newContext({ baseURL: origin });
  try {
    expect((await login(second, account)).status()).toBe(200);
    const next = randomBytes(24).toString("hex");
    expect(
      (
        await request.post("/api/v1/auth/password", {
          headers: jsonHeaders,
          data: { currentPassword: "incorrect", newPassword: next },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post("/api/v1/auth/password", {
          headers: jsonHeaders,
          data: { currentPassword: account.password, newPassword: next },
        })
      ).status(),
    ).toBe(200);
    expect(await db.authSession.count({ where: { userId: account.id } })).toBe(
      0,
    );
    expect((await second.get("/api/v1/visits")).status()).toBe(401);
    expect((await login(request, account)).status()).toBe(401);
    expect(
      (await login(request, { ...account, password: next })).status(),
    ).toBe(200);
  } finally {
    await second.dispose();
  }
});
test("administrateur : réinitialisation limitée au périmètre et protégée contre une version obsolète", async ({
  accounts,
  request,
  playwright,
}) => {
  const manager = await accounts.create("MANAGER"),
    client = await accounts.create("CLIENT", { parentId: manager.id }),
    outside = await accounts.create("CLIENT", {
      companyId: await accounts.createCompany(),
    });
  await login(request, manager);
  const next = randomBytes(24).toString("hex"),
    endpoint = (id: string) => `/api/v1/users/${id}/password`,
    row = await db.user.findUniqueOrThrow({ where: { id: client.id } });
  const data = {
    password: next,
    expectedUpdatedAt: row.updatedAt.toISOString(),
  };
  expect(
    (
      await request.post(endpoint(outside.id), { headers: jsonHeaders, data })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(endpoint(manager.id), { headers: jsonHeaders, data })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(endpoint(client.id), {
        headers: { ...jsonHeaders, Origin: "https://foreign.example" },
        data,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(endpoint(client.id), {
        headers: jsonHeaders,
        data: { ...data, expectedUpdatedAt: "2000-01-01T00:00:00.000Z" },
      })
    ).status(),
  ).toBe(409);
  const ctx = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(ctx, client);
    expect(
      (
        await request.post(endpoint(client.id), { headers: jsonHeaders, data })
      ).status(),
    ).toBe(200);
    expect((await ctx.get("/api/v1/visits")).status()).toBe(401);
    expect((await login(ctx, { ...client, password: next })).status()).toBe(
      200,
    );
  } finally {
    await ctx.dispose();
  }
});
test("paramètres de société : permission, bornes et concurrence optimiste", async ({
  accounts,
  request,
}) => {
  const admin = await accounts.create("ADMIN", {
    companyId: await accounts.createCompany(),
  });
  await login(request, admin);
  const first = await (await request.get("/api/v1/admin/settings")).json();
  expect(
    (
      await request.patch("/api/v1/admin/settings", {
        headers: jsonHeaders,
        data: {
          revalidationDays: 0,
          expectedUpdatedAt: first.expectedUpdatedAt,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch("/api/v1/admin/settings", {
        headers: jsonHeaders,
        data: {
          revalidationDays: 21,
          expectedUpdatedAt: first.expectedUpdatedAt,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.patch("/api/v1/admin/settings", {
        headers: jsonHeaders,
        data: {
          revalidationDays: 30,
          expectedUpdatedAt: first.expectedUpdatedAt,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await (await request.get("/api/v1/admin/settings")).json())
      .revalidationDays,
  ).toBe(21);
  const client = await accounts.create("CLIENT");
  await login(request, client);
  expect((await request.get("/api/v1/admin/settings")).status()).toBe(403);
});
