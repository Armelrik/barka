import { randomUUID, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, db, jsonHeaders } from "./fixtures";
const draft = () => ({
  title: "Maison campagne",
  description: "Découvrez nos biens",
  sponsorName: "BARKA",
  campaignKind: "HOUSE",
  placement: "HERO",
  targetUrl: "/biens",
  imagePath: "/afriloc/house1.jpg",
  cta: "Voir les biens",
  startsAt: new Date(Date.now() - 3600000).toISOString(),
  endsAt: new Date(Date.now() + 86400000).toISOString(),
  active: true,
});
test("campagnes : droits superadministrateur, modification concurrente et visuels privés", async ({
  request,
  playwright,
  accounts,
}) => {
  expect((await request.get("/api/v1/admin/advertisements")).status()).toBe(
    401,
  );
  expect((await request.get("/api/v1/admin/audience/export")).status()).toBe(
    401,
  );
  const admin = await accounts.create("ADMIN");
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: admin.phone, password: admin.password },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/v1/admin/audience")).status()).toBe(403);
  expect(
    (
      await request.post("/api/v1/admin/advertisements", {
        headers: jsonHeaders,
        data: draft(),
      })
    ).status(),
  ).toBe(403);
  const root = await accounts.create("SUPER_ADMIN");
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: root.phone, password: root.password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/v1/admin/advertisements", {
        headers: { ...jsonHeaders, Origin: "https://other.example" },
        data: draft(),
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/v1/admin/advertisements", {
        headers: jsonHeaders,
        data: { ...draft(), targetUrl: "javascript:alert(1)" },
      })
    ).status(),
  ).toBe(400);
  const created = await request.post("/api/v1/admin/advertisements", {
    headers: jsonHeaders,
    data: draft(),
  });
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  const old = await db.advertisement.findUniqueOrThrow({ where: { id } });
  const patch = {
    ...draft(),
    title: "Campagne modifiée",
    expectedUpdatedAt: old.updatedAt.toISOString(),
  };
  expect(
    (
      await request.patch(`/api/v1/admin/advertisements/${id}`, {
        headers: jsonHeaders,
        data: patch,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.patch(`/api/v1/admin/advertisements/${id}`, {
        headers: jsonHeaders,
        data: patch,
      })
    ).status(),
  ).toBe(409);
  const uploaded = await request.post(
    "/api/v1/admin/advertisements/creatives",
    {
      headers: { Origin: jsonHeaders.Origin },
      multipart: {
        kind: "PHOTO",
        file: {
          name: "banner.jpg",
          mimeType: "image/jpeg",
          buffer: await readFile("public/afriloc/house1.jpg"),
        },
      },
    },
  );
  expect(uploaded.status()).toBe(201);
  const creative = await uploaded.json();
  const anon = await playwright.request.newContext({
    baseURL: jsonHeaders.Origin,
  });
  try {
    expect((await anon.get(creative.url)).status()).toBe(404);
    expect((await request.get(creative.url)).status()).toBe(200);
    const version = await db.advertisement.findUniqueOrThrow({ where: { id } });
    expect(
      (
        await request.patch(`/api/v1/admin/advertisements/${id}`, {
          headers: jsonHeaders,
          data: {
            ...draft(),
            creativeId: creative.id,
            expectedUpdatedAt: version.updatedAt.toISOString(),
          },
        })
      ).status(),
    ).toBe(200);
    const image = await anon.get(creative.url);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
  } finally {
    await anon.dispose();
  }
});
test("audience : dédoublonnage, clic/affichage, consentement et exports agrégés", async ({
  request,
  accounts,
}) => {
  const root = await accounts.create("SUPER_ADMIN");
  const ad = await db.advertisement.create({
    data: { ...draft(), ownerId: root.id, companyId: root.companyId },
  });
  const sessionId = randomUUID(),
    viewId = randomUUID();
  const sessionHash = createHmac("sha256", process.env.BARKA_TEST_AUTH_SECRET!)
    .update(`audience:${new Date().toISOString().slice(0, 10)}:${sessionId}`)
    .digest("hex");
  const event = {
    sessionId,
    viewId,
    path: "/",
    device: "DESKTOP",
    kind: "PAGE_VIEW",
  };
  const headers = {
    ...jsonHeaders,
    "User-Agent": "Mozilla/5.0 BarkaAudienceTest",
  };
  try {
    for (let i = 0; i < 2; i++)
      expect(
        (
          await request.post("/api/v1/audience", { headers, data: event })
        ).status(),
      ).toBe(202);
    expect(
      await db.audienceEvent.count({
        where: { sessionHash, kind: "PAGE_VIEW" },
      }),
    ).toBe(1);
    for (let i = 0; i < 2; i++)
      await request.post("/api/v1/audience", {
        headers,
        data: {
          ...event,
          kind: "AD_CLICK",
          campaignId: ad.id,
          placement: "HERO",
        },
      });
    expect(
      await db.audienceEvent.count({
        where: { sessionHash, kind: "AD_CLICK" },
      }),
    ).toBe(1);
    expect(
      await db.audienceEvent.count({
        where: { sessionHash, kind: "AD_IMPRESSION" },
      }),
    ).toBe(1);
    await request.post("/api/v1/audience", {
      headers: { ...headers, DNT: "1" },
      data: { ...event, viewId: randomUUID() },
    });
    await request.post("/api/v1/audience", {
      headers: { ...headers, "User-Agent": "HeadlessChrome" },
      data: { ...event, viewId: randomUUID() },
    });
    expect(await db.audienceEvent.count({ where: { sessionHash } })).toBe(3);
    expect(
      (
        await request.post("/api/v1/audience", {
          headers,
          data: { ...event, path: "/espace" },
        })
      ).status(),
    ).toBe(400);
    await request.post("/api/v1/auth/login", {
      headers: jsonHeaders,
      data: { identifier: root.phone, password: root.password },
    });
    const report = await request.get("/api/v1/admin/audience");
    expect(report.status()).toBe(200);
    const campaign = (await report.json()).campaigns.find(
      (r: { id: string }) => r.id === ad.id,
    );
    expect(campaign).toMatchObject({ impressions: 1, clicks: 1, ctr: 100 });
    const csv = await request.get(
      "/api/v1/admin/audience/export?kind=campaigns",
    );
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("Maison campagne");
    expect(await csv.text()).not.toContain(sessionId);
    await request.post("/api/v1/audience", {
      headers,
      data: { ...event, viewId: randomUUID() },
    });
    expect(await db.audienceEvent.count({ where: { sessionHash } })).toBe(3);
  } finally {
    await db.audienceEvent.deleteMany({ where: { sessionHash } });
  }
});
