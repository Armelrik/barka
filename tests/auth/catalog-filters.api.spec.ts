import { test, expect, db } from "./visits-fixtures";
import { randomUUID } from "node:crypto";
test("catalogue connecté : filtres cumulés, tris, pagination et annonces privées", async ({
  visits,
}) => {
  const row = await db.listing.findUniqueOrThrow({
    where: { id: visits.listingId },
    include: {
      property: { include: { location: { include: { parent: true } } } },
    },
  });
  await db.property.update({
    where: { id: row.propertyId },
    data: {
      type: "APARTMENT",
      furnishing: "FURNISHED",
      rentalDuration: "SHORT",
      rentPricePeriod: "NIGHT",
    },
  });
  await db.listing.update({
    where: { id: row.id },
    data: {
      offer: "RENT",
      priceXof: 45001,
      publishedAt: new Date(Date.now() - 86400000),
    },
  });
  const newer = await db.listing.create({
    data: {
      slug: `recent-${randomUUID()}`,
      propertyId: row.propertyId,
      authorId: row.authorId,
      offer: "RENT",
      priceXof: 55001,
      status: "PUBLISHED",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  await db.listing.create({
    data: {
      slug: `private-${randomUUID()}`,
      propertyId: row.propertyId,
      authorId: row.authorId,
      offer: "RENT",
      priceXof: 45001,
      status: "DRAFT",
    },
  });
  const params = new URLSearchParams({
    offer: "RENT",
    city: row.property.location.parent!.name,
    location: row.property.location.name,
    category: "apartment",
    furnishing: "FURNISHED",
    rentalDuration: "SHORT",
    pricePeriod: "NIGHT",
    minPrice: "45000",
    maxPrice: "56000",
  });
  const fetch = async () => {
    const r = await visits.anonymous.get(`/api/v1/catalog?${params}`);
    expect(r.status()).toBe(200);
    return r.json();
  };
  let data = await fetch();
  expect(data.items.map((p: { slug: string }) => p.slug)).toEqual([
    newer.slug,
    row.slug,
  ]);
  expect(data.items[0].rentPricePeriod).toBe("NIGHT");
  params.set("sort", "oldest");
  data = await fetch();
  expect(data.items.map((p: { slug: string }) => p.slug)).toEqual([
    row.slug,
    newer.slug,
  ]);
  params.set("sort", "price_desc");
  data = await fetch();
  expect(data.items[0].priceXof).toBe(55001);
  params.set("sort", "price_asc");
  data = await fetch();
  expect(data.items[0].priceXof).toBe(45001);
  params.set("furnishing", "UNFURNISHED");
  expect((await fetch()).total).toBe(0);
  params.set("furnishing", "FURNISHED");
  params.set("rentalDuration", "LONG");
  expect((await fetch()).total).toBe(0);
  params.set("rentalDuration", "SHORT");
  params.set("city", "Ville inexistante");
  expect((await fetch()).total).toBe(0);
  params.set("city", row.property.location.parent!.name);
  params.set("page", "2");
  expect((await fetch()).items).toHaveLength(0);
  params.set("minPrice", "999999");
  expect(
    (await visits.anonymous.get(`/api/v1/catalog?${params}`)).status(),
  ).toBe(400);
});
