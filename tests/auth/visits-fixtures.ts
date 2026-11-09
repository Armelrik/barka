import { test as base, expect, db, origin, jsonHeaders } from "./fixtures";
import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
export async function visitLogin(
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
type Estate = {
  slug: string;
  listingId: string;
  managerId: string;
  clientId: string;
  secondId: string;
  manager: { phone: string; password: string };
  client: { phone: string; password: string };
  customer: APIRequestContext;
  second: APIRequestContext;
  anonymous: APIRequestContext;
};
export const test = base.extend<{ visits: Estate }>({
  visits: async ({ accounts, request, playwright }, provide) => {
    const manager = await accounts.create("MANAGER"),
      agent = await accounts.create("COMMERCIAL", { parentId: manager.id }),
      client = await accounts.create("CLIENT"),
      secondClient = await accounts.create("CLIENT");
    const identity = await db.mediaAsset.create({
      data: {
        ownerId: agent.id,
        kind: "IDENTITY",
        status: "READY",
        objectKey: `local/${randomUUID()}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 100,
      },
    });
    await db.agentProfile.create({
      data: {
        userId: agent.id,
        identifier: `VISIT-${randomUUID()}`,
        verification: "VERIFIED",
        identityAssetId: identity.id,
      },
    });
    const location = await db.location.findUniqueOrThrow({
      where: { code: "LOCATION-DEMO-001" },
    });
    const listing = await db.listing.create({
      data: {
        slug: `visite-${randomUUID()}`,
        author: { connect: { id: manager.id } },
        offer: "SALE",
        priceXof: 15000000,
        status: "PUBLISHED",
        expiresAt: new Date(Date.now() + 14 * 86400000),
        property: {
          create: {
            companyId: manager.companyId,
            agentId: agent.id,
            locationId: location.id,
            reference: `VISIT-${randomUUID()}`,
            title: "Villa fictive pour les visites",
            description:
              "Un bien fictif réservé aux vérifications des demandes de visite.",
            type: "VILLA",
            surfaceM2: 150,
          },
        },
      },
    });
    const customer = await playwright.request.newContext({ baseURL: origin }),
      second = await playwright.request.newContext({ baseURL: origin }),
      anonymous = await playwright.request.newContext({ baseURL: origin });
    try {
      await visitLogin(request, manager);
      await visitLogin(customer, client);
      await visitLogin(second, secondClient);
      await provide({
        slug: listing.slug,
        listingId: listing.id,
        managerId: manager.id,
        clientId: client.id,
        secondId: secondClient.id,
        manager,
        client,
        customer,
        second,
        anonymous,
      });
    } finally {
      await customer.dispose();
      await second.dispose();
      await anonymous.dispose();
    }
  },
});
export const proposedAt = (hours = 48) =>
  new Date(Date.now() + hours * 3600000).toISOString();
export async function proposal(
  ctx: APIRequestContext,
  slug: string,
  desiredAt = proposedAt(),
) {
  return ctx.post("/api/v1/visits", {
    headers: jsonHeaders,
    data: {
      slug,
      desiredAt,
      message: "Je souhaite découvrir ce bien avec ma famille.",
    },
  });
}
export async function decision(
  ctx: APIRequestContext,
  id: string,
  action: string,
  reply = "",
  expectedUpdatedAt?: string,
) {
  const row = await db.visitRequest.findUniqueOrThrow({ where: { id } });
  return ctx.patch(`/api/v1/visits/${id}`, {
    headers: jsonHeaders,
    data: {
      action,
      reply,
      expectedUpdatedAt: expectedUpdatedAt ?? row.updatedAt.toISOString(),
    },
  });
}
export { expect, db, jsonHeaders, origin };
