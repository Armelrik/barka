import {
  test,
  expect,
  db,
  proposal,
  decision,
  proposedAt,
} from "./visits-fixtures";
import { jsonHeaders } from "./fixtures";
import { createHash, randomBytes } from "node:crypto";
const digest = (v: string) => createHash("sha256").update(v).digest("hex");

test("récupération : service non configuré, origine et absence de divulgation", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/v1/auth/forgot-password", {
        headers: { Origin: "https://foreign.example" },
        data: { email: "person@barka.example" },
      })
    ).status(),
  ).toBe(403);
  const response = await request.post("/api/v1/auth/forgot-password", {
    headers: jsonHeaders,
    data: { email: "person@barka.example" },
  });
  expect(response.status()).toBe(503);
  expect(await response.text()).not.toContain("token");
});
test("récupération : lien unique, expiration et révocation des sessions", async ({
  accounts,
  request,
}) => {
  const user = await accounts.create("CLIENT");
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: user.phone, password: user.password },
      })
    ).status(),
  ).toBe(200);
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  async function token(
    expiresAt: Date,
    passwordVersion = digest(row.passwordHash),
  ) {
    const raw = randomBytes(32).toString("hex");
    await db.passwordReset.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash: digest(raw),
        passwordVersion,
        expiresAt,
      },
    });
    return raw;
  }
  const expired = await token(new Date(Date.now() - 60000));
  const change = (raw: string) =>
    request.post("/api/v1/auth/reset-password", {
      headers: jsonHeaders,
      data: { token: raw, password: "A-new-password-for-account-2026" },
    });
  expect((await change(expired)).status()).toBe(400);
  const changed = await token(new Date(Date.now() + 600000), "0".repeat(64));
  expect((await change(changed)).status()).toBe(400);
  const valid = await token(new Date(Date.now() + 600000));
  const results = await Promise.all([change(valid), change(valid)]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 400]);
  expect(await db.authSession.count({ where: { userId: user.id } })).toBe(0);
  expect((await change(valid)).status()).toBe(400);
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: {
          identifier: user.phone,
          password: "A-new-password-for-account-2026",
        },
      })
    ).status(),
  ).toBe(200);
});
test("favoris : authentification, idempotence, isolation et annonce retirée", async ({
  visits,
}) => {
  const path = "/api/v1/favorites",
    data = { slug: visits.slug, saved: true };
  expect(
    (await visits.anonymous.put(path, { headers: jsonHeaders, data })).status(),
  ).toBe(401);
  for (let i = 0; i < 2; i++)
    expect(
      (
        await visits.customer.put(path, { headers: jsonHeaders, data })
      ).status(),
    ).toBe(200);
  expect(
    await db.favorite.count({
      where: { userId: visits.clientId, listingId: visits.listingId },
    }),
  ).toBe(1);
  expect((await (await visits.customer.get(path)).json()).total).toBe(1);
  expect((await (await visits.second.get(path)).json()).total).toBe(0);
  expect(
    (
      await visits.customer.put(path, {
        headers: jsonHeaders,
        data: { ...data, userId: visits.secondId },
      })
    ).status(),
  ).toBe(400);
  await db.listing.update({
    where: { id: visits.listingId },
    data: { status: "DRAFT" },
  });
  expect((await (await visits.customer.get(path)).json()).total).toBe(0);
  expect(
    (await visits.second.put(path, { headers: jsonHeaders, data })).status(),
  ).toBe(404);
  expect(
    (
      await visits.customer.put(path, {
        headers: jsonHeaders,
        data: { slug: visits.slug, saved: false },
      })
    ).status(),
  ).toBe(200);
});
test("notifications : événements de visite, lecture privée et préférences", async ({
  visits,
  request,
}) => {
  const result = await proposal(visits.customer, visits.slug);
  expect(result.status()).toBe(201);
  const { visit } = await result.json();
  const mine = await (
    await visits.customer.get("/api/v1/notifications")
  ).json();
  expect(mine.unread).toBe(1);
  expect(mine.items[0].href).toBe("/espace/visites");
  expect(
    (await (await visits.second.get("/api/v1/notifications")).json()).total,
  ).toBe(0);
  await visits.second.patch("/api/v1/notifications", {
    headers: jsonHeaders,
    data: { action: "read", id: mine.items[0].id },
  });
  expect(
    (await (await visits.customer.get("/api/v1/notifications")).json()).unread,
  ).toBe(1);
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(200);
  expect(
    (await (await visits.customer.get("/api/v1/notifications")).json()).total,
  ).toBe(2);
  await visits.customer.patch("/api/v1/notifications", {
    headers: jsonHeaders,
    data: { action: "read" },
  });
  expect(
    (await (await visits.customer.get("/api/v1/notifications")).json()).unread,
  ).toBe(0);
  await visits.customer.patch("/api/v1/notifications", {
    headers: jsonHeaders,
    data: { action: "preferences", emailNotifications: false },
  });
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: visits.clientId } }))
      .emailNotifications,
  ).toBe(false);
});
test("agenda : périmètre, chevauchements, horaires publiés et suppression réservée", async ({
  visits,
  request,
  accounts,
}) => {
  const listing = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: { property: true },
  });
  const startsAt = proposedAt(24),
    endsAt = new Date(Date.parse(startsAt) + 3 * 3600000).toISOString();
  const data = { agentId: listing.property.agentId!, startsAt, endsAt };
  expect(
    (
      await visits.customer.post("/api/v1/availability", {
        headers: jsonHeaders,
        data,
      })
    ).status(),
  ).toBe(403);
  const other = await accounts.create("COMMERCIAL", {
    companyId: await accounts.createCompany(),
  });
  expect(
    (
      await request.post("/api/v1/availability", {
        headers: jsonHeaders,
        data: { ...data, agentId: other.id },
      })
    ).status(),
  ).toBe(404);
  const create = await request.post("/api/v1/availability", {
    headers: jsonHeaders,
    data,
  });
  expect(create.status()).toBe(201);
  const slot = await create.json();
  expect(
    (
      await request.post("/api/v1/availability", { headers: jsonHeaders, data })
    ).status(),
  ).toBe(409);
  expect(
    (await proposal(visits.customer, visits.slug, proposedAt(28))).status(),
  ).toBe(409);
  const available = await (
    await visits.customer.get(`/api/v1/catalog/${visits.slug}/availability`)
  ).json();
  expect(available.mode).toBe("scheduled");
  expect(available.slots).toContain(startsAt);
  const requested = await proposal(visits.customer, visits.slug, startsAt);
  expect(requested.status()).toBe(201);
  const { visit } = await requested.json();
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(200);
  const remaining = await (
    await visits.customer.get(`/api/v1/catalog/${visits.slug}/availability`)
  ).json();
  expect(remaining.slots).not.toContain(startsAt);
  expect(
    (
      await request.delete(`/api/v1/availability/${slot.id}`, {
        headers: jsonHeaders,
      })
    ).status(),
  ).toBe(409);
});
test("agenda : disponibilité relue avant la confirmation", async ({
  visits,
  request,
}) => {
  const listing = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: { property: true },
  });
  const startsAt = proposedAt(24),
    endsAt = new Date(Date.parse(startsAt) + 3600000).toISOString();
  const create = await request.post("/api/v1/availability", {
    headers: jsonHeaders,
    data: { agentId: listing.property.agentId!, startsAt, endsAt },
  });
  const slot = await create.json();
  const { visit } = await (
    await proposal(visits.customer, visits.slug, startsAt)
  ).json();
  expect(
    (
      await request.delete(`/api/v1/availability/${slot.id}`, {
        headers: jsonHeaders,
      })
    ).status(),
  ).toBe(200);
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(409);
});
test("recherches enregistrées : filtres validés et suppression limitée au propriétaire", async ({
  visits,
}) => {
  const data = {
    name: "Projet location",
    filters: {
      offer: "RENT",
      category: "all",
      location: "Zone du Bois",
      maxPrice: 500000,
    },
  };
  expect(
    (
      await visits.customer.post("/api/v1/searches", {
        headers: jsonHeaders,
        data,
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await visits.customer.post("/api/v1/searches", {
        headers: jsonHeaders,
        data,
      })
    ).status(),
  ).toBe(409);
  const row = await db.savedSearch.findFirstOrThrow({
    where: { userId: visits.clientId },
  });
  expect(
    (
      await visits.second.delete(`/api/v1/searches/${row.id}`, {
        headers: jsonHeaders,
      })
    ).status(),
  ).toBe(200);
  expect(await db.savedSearch.count({ where: { id: row.id } })).toBe(1);
  expect(
    (
      await visits.customer.delete(`/api/v1/searches/${row.id}`, {
        headers: jsonHeaders,
      })
    ).status(),
  ).toBe(200);
  expect(await db.savedSearch.count({ where: { id: row.id } })).toBe(0);
});
