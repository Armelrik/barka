import type { APIRequestContext } from "@playwright/test";
import {
  test,
  expect,
  db,
  jsonHeaders,
  registrationData,
  origin,
} from "./fixtures";
async function login(
  request: APIRequestContext,
  account: { phone: string; password: string },
) {
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers: jsonHeaders,
        data: { identifier: account.phone, password: account.password },
      })
    ).status(),
  ).toBe(200);
}
async function detail(request: APIRequestContext, id: string) {
  const response = await request.get(`/api/v1/users/${id}`);
  expect(response.status()).toBe(200);
  return (await response.json()).user;
}
async function patch(
  request: APIRequestContext,
  id: string,
  change: Record<string, unknown>,
  version?: string,
) {
  const expectedUpdatedAt = version ?? (await detail(request, id)).updatedAt;
  return request.patch(`/api/v1/users/${id}`, {
    headers: jsonHeaders,
    data: { expectedUpdatedAt, ...change },
  });
}

test("la création professionnelle est atomique, normalisée, numérotée et auditée sans secret", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER");
  await login(request, manager);
  const { consent: _, ...data } = registrationData();
  void _;
  accounts.trackPhone(data.phone);
  const response = await request.post("/api/v1/users", {
    headers: jsonHeaders,
    data: {
      ...data,
      email: data.email.toUpperCase(),
      role: "COMMERCIAL",
      parentId: manager.id,
    },
  });
  expect(response.status()).toBe(201);
  const user = (await response.json()).user;
  accounts.trackId(user.id);
  expect(user.role).toBe("COMMERCIAL");
  expect(user.parent.id).toBe(manager.id);
  expect(user.email).toBe(data.email);
  expect(user.agentIdentifier).toMatch(/^BARKA-D\d{9}$/);
  expect(JSON.stringify(user)).not.toContain("passwordHash");
  const stored = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { consents: true },
  });
  expect(stored.passwordHash).not.toBe(data.password);
  expect(stored.consents).toHaveLength(0);
  const logs = await db.auditLog.findMany({
    where: { targetId: user.id, action: "USER_CREATED" },
  });
  expect(logs).toHaveLength(1);
  expect(JSON.stringify(logs)).not.toContain(data.password);
  expect(JSON.stringify(logs)).not.toContain(data.phone);
});
test("création : refus des pairs, super administrateurs, société étrangère et parent hors équipe", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER"),
    otherManager = await accounts.create("MANAGER"),
    foreignCompany = await accounts.createCompany();
  await login(request, manager);
  const { consent: _, ...data } = registrationData();
  void _;
  accounts.trackPhone(data.phone);
  for (const [extra, status] of [
    [{ role: "MANAGER" }, 403],
    [{ role: "SUPER_ADMIN" }, 400],
    [{ companyId: foreignCompany }, 403],
    [{ parentId: otherManager.id }, 403],
  ] as const) {
    const response = await request.post("/api/v1/users", {
      headers: jsonHeaders,
      data: Object.assign(
        {},
        data,
        { role: "COMMERCIAL", parentId: manager.id },
        extra,
      ),
    });
    expect(response.status()).toBe(status);
  }
  expect(await db.user.count({ where: { phone: data.phone } })).toBe(0);
});
test("modification : auto-promotion, pair, hors équipe, société injectée et CSRF refusés", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER"),
    member = await accounts.create("COMMERCIAL", { parentId: manager.id }),
    peer = await accounts.create("MANAGER"),
    outside = await accounts.create("CLIENT", { parentId: peer.id });
  await login(request, manager);
  const initial = await detail(request, member.id);
  expect(
    (
      await patch(request, member.id, { role: "MANAGER" }, initial.updatedAt)
    ).status(),
  ).toBe(403);
  expect(
    (
      await patch(
        request,
        member.id,
        { companyId: "injected" },
        initial.updatedAt,
      )
    ).status(),
  ).toBe(400);
  expect(
    (
      await patch(
        request,
        member.id,
        { role: "SUPER_ADMIN" },
        initial.updatedAt,
      )
    ).status(),
  ).toBe(400);
  for (const id of [manager.id, peer.id, outside.id])
    expect(
      (
        await patch(request, id, { status: "SUSPENDED" }, initial.updatedAt)
      ).status(),
    ).toBe(404);
  expect(
    (
      await request.patch(`/api/v1/users/${member.id}`, {
        headers: { ...jsonHeaders, Origin: "https://evil.example" },
        data: { expectedUpdatedAt: initial.updatedAt, status: "SUSPENDED" },
      })
    ).status(),
  ).toBe(403);
  expect(
    await db.auditLog.count({
      where: { targetId: member.id, action: "USER_UPDATED" },
    }),
  ).toBe(0);
});
test("une suspension révoque la session et une réactivation ne restaure pas l'ancien cookie", async ({
  request,
  accounts,
  playwright,
}) => {
  const manager = await accounts.create("MANAGER"),
    member = await accounts.create("CLIENT", { parentId: manager.id });
  const client = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(client, member);
    const state = await client.storageState();
    const cookie = state.cookies.find((c) => c.name === "barka.session")!;
    await login(request, manager);
    expect(
      (await patch(request, member.id, { status: "SUSPENDED" })).status(),
    ).toBe(200);
    expect(await db.authSession.count({ where: { userId: member.id } })).toBe(
      0,
    );
    expect((await client.get("/api/v1/me")).status()).toBe(401);
    expect(
      (await patch(request, member.id, { status: "ACTIVE" })).status(),
    ).toBe(200);
    expect(
      (
        await client.get("/api/v1/me", {
          headers: { Cookie: `barka.session=${cookie.value}` },
        })
      ).status(),
    ).toBe(401);
    await login(client, member);
    expect((await client.get("/api/v1/me")).status()).toBe(200);
  } finally {
    await client.dispose();
  }
});
test("une modification obsolète ou un doublon n'écrit ni changement partiel ni audit", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER"),
    member = await accounts.create("CLIENT", { parentId: manager.id }),
    other = await accounts.create("CLIENT", { parentId: manager.id });
  await login(request, manager);
  const initial = await detail(request, member.id);
  expect(
    (
      await patch(
        request,
        member.id,
        { firstName: "Modifié" },
        initial.updatedAt,
      )
    ).status(),
  ).toBe(200);
  const stale = await patch(
    request,
    member.id,
    { status: "SUSPENDED" },
    initial.updatedAt,
  );
  expect(stale.status()).toBe(409);
  expect((await stale.json()).error.code).toBe("STALE_UPDATE");
  expect(
    (
      await patch(request, member.id, {
        phone: other.phone,
        lastName: "Interdit",
      })
    ).status(),
  ).toBe(409);
  const current = await detail(request, member.id);
  expect(current.firstName).toBe("Modifié");
  expect(current.lastName).toBe("Test");
  expect(current.status).toBe("ACTIVE");
  expect(
    await db.auditLog.count({
      where: { targetId: member.id, action: "USER_UPDATED" },
    }),
  ).toBe(1);
});
test("rattachements : cycles et rétrogradation sous le niveau des enfants refusés", async ({
  request,
  accounts,
}) => {
  const admin = await accounts.create("ADMIN"),
    manager = await accounts.create("MANAGER", { parentId: admin.id }),
    commercial = await accounts.create("COMMERCIAL", { parentId: manager.id });
  await login(request, admin);
  const cycle = await patch(request, manager.id, {
    role: "CLIENT",
    parentId: commercial.id,
  });
  expect(cycle.status()).toBe(409);
  expect((await cycle.json()).error.code).toBe("HIERARCHY_CYCLE");
  expect(
    (
      await patch(request, manager.id, { role: "CLIENT", parentId: admin.id })
    ).status(),
  ).toBe(409);
  expect(
    (
      await db.userHierarchy.findUniqueOrThrow({
        where: { childId: manager.id },
      })
    ).parentId,
  ).toBe(admin.id);
  expect((await detail(request, manager.id)).role).toBe("MANAGER");
});
test("un déplacement d'équipe complet exige un administrateur et révoque le sous-arbre", async ({
  request,
  accounts,
  playwright,
}) => {
  const admin = await accounts.create("ADMIN"),
    supervisor = await accounts.create("SUPERVISOR", { parentId: admin.id }),
    managerA = await accounts.create("MANAGER", { parentId: supervisor.id }),
    managerB = await accounts.create("MANAGER", { parentId: supervisor.id }),
    commercial = await accounts.create("COMMERCIAL", { parentId: managerA.id }),
    client = await accounts.create("CLIENT", { parentId: commercial.id });
  await login(request, supervisor);
  expect(
    (await patch(request, commercial.id, { parentId: managerB.id })).status(),
  ).toBe(403);
  const childContext = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(childContext, client);
    await login(request, admin);
    expect(
      (await patch(request, commercial.id, { parentId: managerB.id })).status(),
    ).toBe(200);
    expect(
      await db.authSession.count({
        where: { userId: { in: [commercial.id, client.id] } },
      }),
    ).toBe(0);
    expect(
      (
        await db.userHierarchy.findUniqueOrThrow({
          where: { childId: commercial.id },
        })
      ).parentId,
    ).toBe(managerB.id);
    const log = await db.auditLog.findFirstOrThrow({
      where: { targetId: commercial.id, action: "USER_UPDATED" },
    });
    expect(log.metadata).toMatchObject({ subtreeSize: 2 });
  } finally {
    await childContext.dispose();
  }
});
test("un manager peut rattacher un client à un autre commercial de sa propre équipe", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER"),
    a = await accounts.create("COMMERCIAL", { parentId: manager.id }),
    b = await accounts.create("COMMERCIAL", { parentId: manager.id }),
    client = await accounts.create("CLIENT", { parentId: a.id });
  await login(request, manager);
  expect((await patch(request, client.id, { parentId: b.id })).status()).toBe(
    200,
  );
  expect(
    (
      await db.userHierarchy.findUniqueOrThrow({
        where: { childId: client.id },
      })
    ).parentId,
  ).toBe(b.id);
  const options = await request.get(
    `/api/v1/users/parents?role=CLIENT&targetId=${a.id}&companyId=${manager.companyId}`,
  );
  expect(options.status()).toBe(200);
  const ids = (await options.json()).items.map((u: { id: string }) => u.id);
  expect(ids).not.toContain(a.id);
  expect(ids).toContain(b.id);
});
test("le commercial par défaut est protégé et les parents étrangers ou inactifs sont refusés", async ({
  request,
  accounts,
}) => {
  const companyId = await accounts.createCompany(),
    admin = await accounts.create("ADMIN", { companyId }),
    parent = await accounts.create("MANAGER", {
      companyId,
      parentId: admin.id,
    }),
    member = await accounts.create("CLIENT", {
      companyId,
      parentId: parent.id,
    }),
    defaultUser = await accounts.create("DEFAULT_COMMERCIAL", {
      companyId,
      parentId: parent.id,
    });
  await db.company.update({
    where: { id: companyId },
    data: { defaultCommercialId: defaultUser.id },
  });
  const foreign = await accounts.create("MANAGER");
  await login(request, admin);
  expect(
    (await patch(request, defaultUser.id, { status: "SUSPENDED" })).status(),
  ).toBe(409);
  expect(
    (await patch(request, defaultUser.id, { role: "COMMERCIAL" })).status(),
  ).toBe(409);
  expect(
    (await patch(request, member.id, { parentId: foreign.id })).status(),
  ).toBe(409);
  await db.user.update({
    where: { id: parent.id },
    data: { status: "SUSPENDED" },
  });
  expect(
    (
      await patch(request, member.id, {
        parentId: parent.id,
        role: "COMMERCIAL",
      })
    ).status(),
  ).toBe(409);
});
test("filtres et historique respectent le périmètre et les métadonnées sont limitées", async ({
  request,
  accounts,
}) => {
  const manager = await accounts.create("MANAGER"),
    member = await accounts.create("CLIENT", { parentId: manager.id }),
    outside = await accounts.create("CLIENT");
  await login(request, manager);
  expect(
    (
      await patch(request, member.id, {
        lastName: "Modifié",
        status: "SUSPENDED",
      })
    ).status(),
  ).toBe(200);
  const list = await request.get(
    "/api/v1/users?q=Modifié&status=SUSPENDED&role=CLIENT",
  );
  expect(list.status()).toBe(200);
  expect((await list.json()).items.map((u: { id: string }) => u.id)).toEqual([
    member.id,
  ]);
  const history = await request.get(`/api/v1/users/${member.id}/history`);
  expect(history.status()).toBe(200);
  const text = await history.text();
  expect(text).not.toContain(member.phone);
  expect(text).not.toContain("passwordHash");
  expect(JSON.parse(text).items[0].statusChange).toEqual({
    from: "ACTIVE",
    to: "SUSPENDED",
  });
  expect(
    (await request.get(`/api/v1/users/${outside.id}/history`)).status(),
  ).toBe(404);
});
test("un super administrateur crée un administrateur racine dans une autre société", async ({
  request,
  accounts,
}) => {
  const root = await accounts.create("SUPER_ADMIN"),
    companyId = await accounts.createCompany();
  await login(request, root);
  const { consent: _, ...data } = registrationData();
  void _;
  accounts.trackPhone(data.phone);
  const response = await request.post("/api/v1/users", {
    headers: jsonHeaders,
    data: { ...data, role: "ADMIN", companyId, parentId: null },
  });
  expect(response.status()).toBe(201);
  const user = (await response.json()).user;
  accounts.trackId(user.id);
  expect(user.companyId).toBe(companyId);
  expect(user.parent).toBeNull();
});

test("deux rattachements concurrents ne créent pas de cycle", async ({
  request,
  accounts,
}) => {
  const admin = await accounts.create("ADMIN"),
    a = await accounts.create("MANAGER", { parentId: admin.id }),
    b = await accounts.create("COMMERCIAL", { parentId: admin.id });
  await login(request, admin);
  const av = (await detail(request, a.id)).updatedAt,
    bv = (await detail(request, b.id)).updatedAt;
  const responses = await Promise.all([
    patch(request, a.id, { role: "CLIENT", parentId: b.id }, av),
    patch(request, b.id, { parentId: a.id }, bv),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  const links = await db.userHierarchy.findMany({
    where: { childId: { in: [a.id, b.id] } },
  });
  expect(
    links.some((link) => link.childId === a.id && link.parentId === b.id) &&
      links.some((link) => link.childId === b.id && link.parentId === a.id),
  ).toBe(false);
});
