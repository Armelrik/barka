import {
  test,
  expect,
  db,
  proposal,
  decision,
  proposedAt,
  visitLogin,
} from "./visits-fixtures";

test("authentification, origine, dates et annonces non publiques", async ({
  visits,
  request,
}) => {
  expect((await proposal(visits.anonymous, visits.slug)).status()).toBe(401);
  expect(
    (
      await visits.customer.post("/api/v1/visits", {
        headers: { Origin: "https://foreign.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await proposal(visits.customer, visits.slug, new Date().toISOString())
    ).status(),
  ).toBe(400);
  expect(
    (
      await proposal(visits.customer, visits.slug, proposedAt(24 * 91))
    ).status(),
  ).toBe(400);
  expect((await proposal(request, visits.slug)).status()).toBe(409);
  await db.listing.update({
    where: { id: visits.listingId },
    data: { status: "DRAFT" },
  });
  expect((await proposal(visits.customer, visits.slug)).status()).toBe(404);
  expect(
    await db.visitRequest.count({ where: { listingId: visits.listingId } }),
  ).toBe(0);
});
test("création privée, doublon et périmètres sans coordonnées personnelles", async ({
  visits,
  request,
  accounts,
}) => {
  const response = await proposal(visits.customer, visits.slug);
  expect(response.status()).toBe(201);
  const { visit } = await response.json();
  expect(visit.status).toBe("REQUESTED");
  expect(visit).not.toHaveProperty("requester");
  expect((await proposal(visits.customer, visits.slug)).status()).toBe(409);
  const mine = await (await visits.customer.get("/api/v1/visits")).json();
  expect(mine.items.map((v: { id: string }) => v.id)).toContain(visit.id);
  expect((await (await visits.second.get("/api/v1/visits")).json()).total).toBe(
    0,
  );
  expect((await visits.customer.get("/api/v1/visits?view=team")).status()).toBe(
    403,
  );
  expect((await decision(visits.second, visit.id, "CANCEL")).status()).toBe(
    404,
  );
  const team = await (await request.get("/api/v1/visits?view=team")).json();
  expect(team.items.map((v: { id: string }) => v.id)).toContain(visit.id);
  expect(JSON.stringify(team)).not.toMatch(
    /"(?:phone|email|objectKey|passwordHash)"/,
  );
  const outsider = await accounts.create("MANAGER", {
    companyId: await accounts.createCompany(),
  });
  await visitLogin(request, outsider);
  expect(
    (await (await request.get("/api/v1/visits?view=team")).json()).total,
  ).toBe(0);
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(404);
});
test("confirmations concurrentes : un seul rendez-vous, sans divulgation du conflit", async ({
  visits,
  request,
}) => {
  const time = proposedAt();
  const first = (
    await (await proposal(visits.customer, visits.slug, time)).json()
  ).visit;
  const second = (
    await (
      await proposal(
        visits.second,
        visits.slug,
        new Date(new Date(time).getTime() + 30 * 60000).toISOString(),
      )
    ).json()
  ).visit;
  const responses = await Promise.all([
    decision(request, first.id, "CONFIRM"),
    decision(request, second.id, "CONFIRM"),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  expect(
    await db.visitRequest.count({
      where: { listingId: visits.listingId, status: "CONFIRMED" },
    }),
  ).toBe(1);
  const conflict = await responses.find((r) => r.status() === 409)!.json();
  expect(conflict.error.code).toBe("VISIT_CONFLICT");
  expect(JSON.stringify(conflict)).not.toContain(visits.clientId);
  expect(
    await db.auditLog.count({
      where: {
        targetId: { in: [first.id, second.id] },
        action: "VISIT_CONFIRMED",
      },
    }),
  ).toBe(1);
});
test("annulation par le client, version obsolète et nouvelle proposition", async ({
  visits,
  request,
}) => {
  const { visit } = await (await proposal(visits.customer, visits.slug)).json();
  expect((await decision(visits.customer, visit.id, "CONFIRM")).status()).toBe(
    409,
  );
  expect(
    (
      await decision(
        request,
        visit.id,
        "CONFIRM",
        "Retrouvez-nous devant l’entrée.",
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await decision(visits.customer, visit.id, "CANCEL", "", visit.updatedAt)
    ).status(),
  ).toBe(409);
  expect((await decision(visits.customer, visit.id, "CANCEL")).status()).toBe(
    200,
  );
  expect((await decision(visits.customer, visit.id, "CANCEL")).status()).toBe(
    409,
  );
  expect((await proposal(visits.customer, visits.slug)).status()).toBe(201);
});
test("motif de refus, clôture après la visite et conservation de la réponse", async ({
  visits,
  request,
}) => {
  let { visit } = await (await proposal(visits.customer, visits.slug)).json();
  expect((await decision(request, visit.id, "REJECT")).status()).toBe(400);
  expect(
    (
      await decision(
        request,
        visit.id,
        "REJECT",
        "Le commercial sera absent à cet horaire.",
      )
    ).status(),
  ).toBe(200);
  ({ visit } = await (
    await proposal(visits.customer, visits.slug, proposedAt(72))
  ).json());
  expect(
    (
      await decision(
        request,
        visit.id,
        "CONFIRM",
        "Merci de venir à l’entrée principale.",
      )
    ).status(),
  ).toBe(200);
  expect((await decision(request, visit.id, "COMPLETE")).status()).toBe(409);
  await db.visitRequest.update({
    where: { id: visit.id },
    data: { desiredAt: new Date(Date.now() - 2 * 3600000) },
  });
  const complete = await decision(request, visit.id, "COMPLETE");
  expect(complete.status()).toBe(200);
  expect((await complete.json()).visit.reply).toBe(
    "Merci de venir à l’entrée principale.",
  );
  const filtered = await (
    await visits.customer.get("/api/v1/visits?status=COMPLETED")
  ).json();
  expect(filtered.total).toBe(1);
});
test("annonce retirée ou compte suspendu : confirmation bloquée, annulation permise", async ({
  visits,
  request,
}) => {
  const { visit } = await (await proposal(visits.customer, visits.slug)).json();
  await db.listing.update({
    where: { id: visits.listingId },
    data: { status: "SUSPENDED" },
  });
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(409);
  await db.listing.update({
    where: { id: visits.listingId },
    data: { status: "PUBLISHED" },
  });
  await db.user.update({
    where: { id: visits.clientId },
    data: { status: "SUSPENDED" },
  });
  expect((await decision(request, visit.id, "CONFIRM")).status()).toBe(409);
  await db.user.update({
    where: { id: visits.clientId },
    data: { status: "ACTIVE" },
  });
  expect((await decision(visits.customer, visit.id, "CANCEL")).status()).toBe(
    200,
  );
});
