import { test, expect, db, proposal } from "./visits-fixtures";
test("exemple public explicite sans identité vérifiée et sans rendez-vous réel", async ({
  visits,
}) => {
  const listing = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: { property: true },
  });
  await db.agentProfile.update({
    where: { userId: listing.property.agentId! },
    data: { verification: "PENDING" },
  });
  expect(
    (await visits.anonymous.get(`/api/v1/catalog/${visits.slug}`)).status(),
  ).toBe(404);
  await db.listing.update({
    where: { id: visits.listingId },
    data: {
      isDemo: true,
      property: { update: { details: { fictitious: true } } },
    },
  });
  const response = await visits.anonymous.get(`/api/v1/catalog/${visits.slug}`);
  expect(response.status()).toBe(200);
  const dto = await response.json();
  expect(dto.isDemo).toBe(true);
  expect(dto).not.toHaveProperty("legalStatus");
  expect(dto).not.toHaveProperty("agent");
  const page = await visits.anonymous.get(`/biens/${visits.slug}`);
  expect(await page.text()).toContain("EXEMPLE FICTIF");
  expect((await proposal(visits.customer, visits.slug)).status()).toBe(404);
  expect(
    await db.visitRequest.count({ where: { listingId: visits.listingId } }),
  ).toBe(0);
});
test("le mode exemple exige la société de démonstration et le marquage fictif", async ({
  visits,
  accounts,
}) => {
  await db.listing.update({
    where: { id: visits.listingId },
    data: { isDemo: true },
  });
  expect(
    (await visits.anonymous.get(`/api/v1/catalog/${visits.slug}`)).status(),
  ).toBe(404);
  await db.listing.update({
    where: { id: visits.listingId },
    data: {
      property: {
        update: {
          details: { fictitious: true },
          companyId: await accounts.createCompany(),
        },
      },
    },
  });
  expect(
    (await visits.anonymous.get(`/api/v1/catalog/${visits.slug}`)).status(),
  ).toBe(404);
});

test("un exemple modifié conserve une modération indépendante sans fabriquer de vérification", async ({
  visits,
  accounts,
  request,
  playwright,
}) => {
  const { readFile } = await import("node:fs/promises");
  const photo = await readFile(
    new URL("../../public/afriloc/house1.jpg", import.meta.url),
  );
  const before = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: { property: true },
  });
  await db.agentProfile.update({
    where: { userId: before.property.agentId! },
    data: { verification: "PENDING" },
  });
  await db.listing.update({
    where: { id: visits.listingId },
    data: {
      isDemo: true,
      property: { update: { details: { fictitious: true } } },
    },
  });
  const upload = await request.post(
    `/api/v1/properties/${visits.listingId}/media`,
    {
      headers: { Origin: "http://127.0.0.1:3002" },
      multipart: {
        kind: "PHOTO",
        alt: "Illustration fictive",
        file: { name: "fixture.jpg", mimeType: "image/jpeg", buffer: photo },
      },
    },
  );
  expect(upload.status()).toBe(201);
  const root = await accounts.create("SUPER_ADMIN"),
    ctx = await playwright.request.newContext({
      baseURL: "http://127.0.0.1:3002",
    });
  try {
    await ctx.post("/api/v1/auth/login", {
      headers: {
        Origin: "http://127.0.0.1:3002",
        "Content-Type": "application/json",
      },
      data: { identifier: root.phone, password: root.password },
    });
    for (const action of ["SUBMIT", "REVIEW", "APPROVE", "PUBLISH"]) {
      const row = await db.listing.findUniqueOrThrow({
        where: { id: visits.listingId },
      });
      const response = await (action === "SUBMIT" ? request : ctx).post(
        `/api/v1/properties/${row.id}/actions`,
        {
          headers: {
            Origin: "http://127.0.0.1:3002",
            "Content-Type": "application/json",
          },
          data: {
            action,
            expectedUpdatedAt: row.updatedAt.toISOString(),
            reason: "Validation de la présentation fictive.",
          },
        },
      );
      expect(response.status()).toBe(200);
    }
    expect(
      (await visits.anonymous.get(`/api/v1/catalog/${visits.slug}`)).status(),
    ).toBe(200);
    expect(
      (
        await db.agentProfile.findUniqueOrThrow({
          where: { userId: before.property.agentId! },
        })
      ).verification,
    ).toBe("PENDING");
  } finally {
    await ctx.dispose();
  }
});
