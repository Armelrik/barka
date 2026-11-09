import { test as base, expect, db, jsonHeaders, origin } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";
import type { ListingDto } from "../../src/modules/listings/service";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
async function login(
  ctx: APIRequestContext,
  account: { phone: string; password: string },
) {
  expect(
    (
      await ctx.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: account.phone, password: account.password },
      })
    ).status(),
  ).toBe(200);
}
async function current(
  ctx: APIRequestContext,
  id: string,
): Promise<ListingDto> {
  const response = await ctx.get(`/api/v1/properties/${id}`);
  expect(response.status()).toBe(200);
  return (await response.json()).listing;
}
async function upload(
  ctx: APIRequestContext,
  path: string,
  kind: string,
  buffer: Buffer,
  mimeType = "image/jpeg",
) {
  return ctx.post(path, {
    headers: { Origin: origin },
    multipart: {
      kind,
      alt: `Fixture ${kind}`,
      file: {
        name: kind === "MODEL_3D" ? "fixture.glb" : "fixture.jpg",
        mimeType,
        buffer,
      },
    },
  });
}
async function action(ctx: APIRequestContext, id: string, name: string) {
  const row = await current(ctx, id);
  return ctx.post(`/api/v1/properties/${id}/actions`, {
    headers: jsonHeaders,
    data: {
      action: name,
      expectedUpdatedAt: row.updatedAt,
      reason: "Vérification fictive dans la base de test.",
    },
  });
}
const photo = readFile(
  new URL("../../public/afriloc/house1.jpg", import.meta.url),
);
const panorama = readFile(
  new URL("../../public/immersive-demo/salon.jpg", import.meta.url),
);
type Estate = {
  root: APIRequestContext;
  agent: APIRequestContext;
  anonymous: APIRequestContext;
  agentId: string;
  rootId: string;
  input: {
    title: string;
    description: string;
    type: string;
    offer: string;
    priceXof: number;
    surfaceM2: number;
    locationId: string;
    agentId: string;
    latitude: number;
    longitude: number;
    showMap: boolean;
  };
  listing: ListingDto;
};
const test = base.extend<{ estate: Estate }>({
  estate: async ({ accounts, request, playwright }, provide) => {
    const rootUser = await accounts.create("SUPER_ADMIN"),
      manager = await accounts.create("MANAGER", { parentId: rootUser.id }),
      agentUser = await accounts.create("COMMERCIAL", { parentId: manager.id });
    await db.agentProfile.create({
      data: {
        userId: agentUser.id,
        identifier: `TEST-${randomBytes(10).toString("hex")}`,
      },
    });
    const location = await db.location.findUniqueOrThrow({
      where: { code: "LOCATION-DEMO-001" },
    });
    await login(request, manager);
    const root = await playwright.request.newContext({ baseURL: origin }),
      agent = await playwright.request.newContext({ baseURL: origin }),
      anonymous = await playwright.request.newContext({ baseURL: origin });
    await login(root, rootUser);
    await login(agent, agentUser);
    const input = {
      title: `Bien de test ${randomBytes(4).toString("hex")}`,
      description:
        "Bien fictif utilisé exclusivement pour vérifier le workflow de publication.",
      type: "VILLA",
      offer: "SALE",
      priceXof: 15000000,
      surfaceM2: 120,
      locationId: location.id,
      agentId: agentUser.id,
      latitude: 12.345678,
      longitude: -1.512345,
      showMap: true,
    };
    const response = await request.post("/api/v1/properties", {
      headers: jsonHeaders,
      data: input,
    });
    expect(response.status()).toBe(201);
    const listing = (await response.json()).listing;
    try {
      await provide({
        root,
        agent,
        anonymous,
        input,
        listing,
        agentId: agentUser.id,
        rootId: rootUser.id,
      });
    } finally {
      await root.dispose();
      await agent.dispose();
      await anonymous.dispose();
    }
  },
});
async function publish(estate: Estate, request: APIRequestContext) {
  expect(
    (
      await upload(estate.agent, "/api/v1/identity", "IDENTITY", await photo)
    ).status(),
  ).toBe(201);
  const profile = await db.agentProfile.findUniqueOrThrow({
    where: { userId: estate.agentId },
  });
  expect(
    (
      await estate.root.patch(`/api/v1/identity/${estate.agentId}`, {
        headers: jsonHeaders,
        data: {
          approve: true,
          reason: "Image fictive de test examinée.",
          expectedUpdatedAt: profile.updatedAt.toISOString(),
        },
      })
    ).status(),
  ).toBe(200);
  for (const kind of ["PHOTO", "LEGAL_DOCUMENT"])
    expect(
      (
        await upload(
          request,
          `/api/v1/properties/${estate.listing.id}/media`,
          kind,
          await photo,
        )
      ).status(),
    ).toBe(201);
  expect((await action(request, estate.listing.id, "SUBMIT")).status()).toBe(
    200,
  );
  for (const command of ["REVIEW", "APPROVE", "PUBLISH"])
    expect(
      (await action(estate.root, estate.listing.id, command)).status(),
    ).toBe(200);
}
test("brouillons privés, prix et localisation précis visibles uniquement au responsable", async ({
  request,
  estate,
}) => {
  expect(estate.listing.status).toBe("DRAFT");
  expect(estate.listing.latitude).toBe(12.345678);
  expect(
    (
      await estate.anonymous.get(`/api/v1/properties/${estate.listing.id}`)
    ).status(),
  ).toBe(401);
  expect(
    (
      await estate.anonymous.get(`/api/v1/catalog/${estate.listing.slug}`)
    ).status(),
  ).toBe(404);
  const catalogue = await estate.anonymous.get("/api/v1/catalog");
  expect(await catalogue.text()).not.toContain(estate.listing.slug);
  expect(
    (
      await request.patch(`/api/v1/properties/${estate.listing.id}`, {
        headers: jsonHeaders,
        data: {
          ...estate.input,
          status: "PUBLISHED",
          expectedUpdatedAt: estate.listing.updatedAt,
        },
      })
    ).status(),
  ).toBe(400);
});
test("refus d’un autre périmètre, d’une origine étrangère et d’une version obsolète", async ({
  request,
  estate,
  accounts,
  playwright,
}) => {
  const outsider = await accounts.create("MANAGER"),
    ctx = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(ctx, outsider);
    expect(
      (await ctx.get(`/api/v1/properties/${estate.listing.id}`)).status(),
    ).toBe(404);
    expect(
      (
        await ctx.patch(`/api/v1/properties/${estate.listing.id}`, {
          headers: jsonHeaders,
          data: {
            ...estate.input,
            expectedUpdatedAt: estate.listing.updatedAt,
          },
        })
      ).status(),
    ).toBe(404);
  } finally {
    await ctx.dispose();
  }
  expect(
    (
      await request.patch(`/api/v1/properties/${estate.listing.id}`, {
        headers: { ...jsonHeaders, Origin: "https://evil.example" },
        data: { ...estate.input, expectedUpdatedAt: estate.listing.updatedAt },
      })
    ).status(),
  ).toBe(403);
  const changed = await request.patch(
    `/api/v1/properties/${estate.listing.id}`,
    {
      headers: jsonHeaders,
      data: {
        ...estate.input,
        title: "Nouveau titre du bien de test",
        expectedUpdatedAt: estate.listing.updatedAt,
      },
    },
  );
  expect(changed.status()).toBe(200);
  expect(
    (
      await request.patch(`/api/v1/properties/${estate.listing.id}`, {
        headers: jsonHeaders,
        data: { ...estate.input, expectedUpdatedAt: estate.listing.updatedAt },
      })
    ).status(),
  ).toBe(409);
});
test("médias contrôlés : fausse image, mauvais ratio panorama et GLB externe refusés", async ({
  request,
  estate,
}) => {
  const path = `/api/v1/properties/${estate.listing.id}/media`;
  expect(
    (
      await upload(
        request,
        path,
        "PHOTO",
        Buffer.from('<svg onload="alert(1)"/>'),
        "image/jpeg",
      )
    ).status(),
  ).toBe(400);
  expect((await upload(request, path, "PANORAMA", await photo)).status()).toBe(
    400,
  );
  expect(
    (
      await upload(
        request,
        path,
        "MODEL_3D",
        Buffer.from("fake"),
        "model/gltf-binary",
      )
    ).status(),
  ).toBe(400);
  expect((await upload(request, path, "IDENTITY", await photo)).status()).toBe(
    400,
  );
  expect(
    await db.mediaAsset.count({
      where: {
        propertyMedia: {
          some: {
            propertyId: (
              await db.listing.findUniqueOrThrow({
                where: { id: estate.listing.id },
              })
            ).propertyId,
          },
        },
      },
    }),
  ).toBe(0);
});
test("publication : vérification réelle du profil, pièces du dossier et étapes imposées", async ({
  request,
  estate,
}) => {
  expect(
    (await action(estate.root, estate.listing.id, "PUBLISH")).status(),
  ).toBe(409);
  expect((await action(request, estate.listing.id, "SUBMIT")).status()).toBe(
    200,
  );
  expect(
    (await action(estate.root, estate.listing.id, "REVIEW")).status(),
  ).toBe(200);
  expect(
    (await action(estate.root, estate.listing.id, "APPROVE")).status(),
  ).toBe(409);
  const row = await current(request, estate.listing.id);
  expect(row.status).toBe("VERIFYING");
});
test("publication indépendante, médias publics limités et carte arrondie", async ({
  request,
  estate,
}) => {
  await publish(estate, request);
  const response = await estate.anonymous.get("/api/v1/catalog");
  expect(response.status()).toBe(200);
  const rows = (await response.json()).items;
  const row = rows.find(
    (r: { slug: string }) => r.slug === estate.listing.slug,
  );
  expect(row.latitude).toBe(12.346);
  expect(row.longitude).toBe(-1.512);
  const text = JSON.stringify(row);
  for (const secret of [
    "objectKey",
    "legalStatus",
    "agentId",
    "12.345678",
    "identityAssetId",
  ])
    expect(text).not.toContain(secret);
  const dossier = await current(request, estate.listing.id),
    image = dossier.media.find((m) => m.kind === "PHOTO")!,
    doc = dossier.documents[0];
  expect((await estate.anonymous.get(image.url)).status()).toBe(200);
  expect((await estate.anonymous.get(doc.url)).status()).toBe(404);
  expect((await request.get(doc.url)).status()).toBe(200);
  const agent = await db.agentProfile.findUniqueOrThrow({
    where: { userId: estate.agentId },
  });
  expect(
    (
      await estate.anonymous.get(`/api/v1/media/${agent.identityAssetId}`)
    ).status(),
  ).toBe(404);
  expect(
    (await estate.root.get(`/api/v1/media/${agent.identityAssetId}`)).status(),
  ).toBe(200);
  expect(
    (
      await estate.anonymous.get(`/api/v1/catalog/${estate.listing.slug}`)
    ).status(),
  ).toBe(200);
});
test("un modérateur ne peut pas valider sa propre annonce", async ({
  estate,
}) => {
  const response = await estate.root.post("/api/v1/properties", {
    headers: jsonHeaders,
    data: { ...estate.input, title: "Annonce créée par le modérateur" },
  });
  expect(response.status()).toBe(201);
  const id = (await response.json()).listing.id;
  expect((await action(estate.root, id, "SUBMIT")).status()).toBe(200);
  expect((await action(estate.root, id, "REVIEW")).status()).toBe(403);
});
test("modification ou expiration retire immédiatement l’annonce du public", async ({
  request,
  estate,
}) => {
  await publish(estate, request);
  const dossier = await current(request, estate.listing.id);
  expect(
    (
      await request.patch(`/api/v1/properties/${dossier.id}`, {
        headers: jsonHeaders,
        data: {
          ...estate.input,
          title: "Le bien a été modifié après publication",
          expectedUpdatedAt: dossier.updatedAt,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await estate.anonymous.get(`/api/v1/catalog/${dossier.slug}`)).status(),
  ).toBe(404);
  expect((await current(request, dossier.id)).status).toBe("DRAFT");
  await db.listing.update({
    where: { id: dossier.id },
    data: { status: "PUBLISHED", expiresAt: new Date(Date.now() - 1000) },
  });
  expect(
    (await estate.anonymous.get(`/api/v1/catalog/${dossier.slug}`)).status(),
  ).toBe(404);
});
test("éditeur 360° et GLB : scènes cohérentes, pointage interne et suppression protégée", async ({
  request,
  estate,
}) => {
  const path = `/api/v1/properties/${estate.listing.id}/media`;
  const first = await upload(request, path, "PANORAMA", await panorama);
  expect(first.status()).toBe(201);
  const panoramaId = (await first.json()).asset.id;
  const glb = await readFile(
    new URL("../../public/immersive-demo/maison.glb", import.meta.url),
  );
  const second = await upload(
    request,
    path,
    "MODEL_3D",
    glb,
    "model/gltf-binary",
  );
  expect(second.status()).toBe(201);
  const modelId = (await second.json()).asset.id;
  let row = await current(request, estate.listing.id);
  const scene = {
    key: "salon",
    title: "Salon",
    assetId: panoramaId,
    hotspots: [],
  };
  expect(
    (
      await request.put(`/api/v1/properties/${row.id}/tour`, {
        headers: jsonHeaders,
        data: {
          expectedUpdatedAt: row.updatedAt,
          title: "Visite de test",
          scenes: [
            {
              ...scene,
              hotspots: [
                {
                  label: "Pièce étrangère",
                  targetKey: "other",
                  yaw: 0,
                  pitch: 0,
                },
              ],
            },
          ],
          modelAssetId: modelId,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.put(`/api/v1/properties/${row.id}/tour`, {
        headers: jsonHeaders,
        data: {
          expectedUpdatedAt: row.updatedAt,
          title: "Visite de test",
          scenes: [scene],
          modelAssetId: modelId,
        },
      })
    ).status(),
  ).toBe(200);
  row = await current(request, row.id);
  expect(row.tours).toHaveLength(2);
  expect(
    (
      await request.delete(`${path}?assetId=${panoramaId}`, {
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await estate.anonymous.get(`/api/v1/catalog/${row.slug}/tour`)).status(),
  ).toBe(404);
  await publish(estate, request);
  expect(
    (await estate.anonymous.get(`/api/v1/catalog/${row.slug}/tour`)).status(),
  ).toBe(200);
  expect(
    (await estate.anonymous.get(`/api/v1/media/${modelId}`)).status(),
  ).toBe(200);
});
test("remplacement de l’identité suspend les annonces et bloque les anciens documents", async ({
  request,
  estate,
}) => {
  await publish(estate, request);
  const before = await db.agentProfile.findUniqueOrThrow({
    where: { userId: estate.agentId },
  });
  expect(
    (
      await upload(estate.agent, "/api/v1/identity", "IDENTITY", await photo)
    ).status(),
  ).toBe(201);
  expect((await current(request, estate.listing.id)).status).toBe("SUSPENDED");
  expect(
    (await estate.root.get(`/api/v1/media/${before.identityAssetId}`)).status(),
  ).toBe(404);
  expect(
    await db.outboxJob.count({
      where: { idempotencyKey: `media-delete:${before.identityAssetId}` },
    }),
  ).toBe(1);
});
