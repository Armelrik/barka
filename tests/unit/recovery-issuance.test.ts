import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const mocks = vi.hoisted(() => {
  const tx = {
    user: { findUnique: vi.fn() },
    passwordReset: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  };
  return { tx, queue: vi.fn(), ready: vi.fn(), db: { $transaction: vi.fn() } };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/db", () => ({ getDb: () => mocks.db }));
vi.mock("@/lib/server/identity-lock", () => ({ lockIdentity: vi.fn() }));
vi.mock("@/lib/server/auth-config", () => ({
  getAuthConfig: () => ({
    secret: "s".repeat(48),
    origin: "https://barka.example",
  }),
}));
vi.mock("@/modules/messaging/service", () => ({
  queueMail: mocks.queue,
  mailReady: mocks.ready,
}));
import { requestPasswordReset } from "../../src/modules/identity/recovery";
describe("émission des liens de récupération sans envoi réel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ready.mockReturnValue(true);
    mocks.db.$transaction.mockImplementation((fn) => fn(mocks.tx));
    mocks.tx.user.findUnique.mockResolvedValue({
      id: "user",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    });
    mocks.tx.passwordReset.findFirst.mockResolvedValue(null);
    mocks.tx.passwordReset.create.mockResolvedValue({ id: "reset" });
  });
  it("ne stocke que le hash du jeton et utilise un fragment dans le courrier", async () => {
    expect(await requestPasswordReset({ email: "client@barka.example" })).toBe(
      "reset",
    );
    const row = mocks.tx.passwordReset.create.mock.calls[0][0].data;
    const mail = mocks.queue.mock.calls[0][3];
    const raw = mail.text.match(/#token=([a-f0-9]{64})/)[1];
    expect(row.tokenHash).toBe(createHash("sha256").update(raw).digest("hex"));
    expect(row.tokenHash).not.toBe(raw);
    expect(row.expiresAt.getTime() - Date.now()).toBeGreaterThan(14 * 60000);
    expect(mail.text).not.toContain("?token=");
    expect(mocks.tx.passwordReset.updateMany).toHaveBeenCalled();
  });
  it("ne divulgue ni compte inconnu, ni compte suspendu, ni limite de renvoi", async () => {
    for (const user of [null, { id: "user", status: "SUSPENDED" }]) {
      mocks.tx.user.findUnique.mockResolvedValueOnce(user);
      expect(
        await requestPasswordReset({ email: "client@barka.example" }),
      ).toBeUndefined();
    }
    mocks.tx.passwordReset.findFirst.mockResolvedValue({ id: "recent" });
    expect(
      await requestPasswordReset({ email: "client@barka.example" }),
    ).toBeUndefined();
    expect(mocks.queue).not.toHaveBeenCalled();
    expect(mocks.tx.passwordReset.create).not.toHaveBeenCalled();
  });
  it("refuse globalement le service non configuré sans créer de jeton", async () => {
    mocks.ready.mockReturnValue(false);
    await expect(
      requestPasswordReset({ email: "client@barka.example" }),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
