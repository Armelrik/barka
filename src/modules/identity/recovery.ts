import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { getDb } from "@/lib/server/db";
import { lockIdentity } from "@/lib/server/identity-lock";
import { getAuthConfig } from "@/lib/server/auth-config";
import { AppError } from "@/lib/server/errors";
import { queueMail, mailReady } from "@/modules/messaging/service";
import {
  recoveryRequestSchema,
  recoveryResetSchema,
} from "./recovery-validation";
const digest = (v: string) => createHash("sha256").update(v).digest("hex");
const invalid = () =>
  new AppError(
    400,
    "RESET_INVALID",
    "Ce lien est invalide ou expiré. Demandez un nouveau lien.",
  );
export async function requestPasswordReset(input: unknown) {
  const { email } = recoveryRequestSchema.parse(input);
  if (!mailReady())
    throw new AppError(
      503,
      "RECOVERY_CONFIGURATION",
      "L’envoi des liens de récupération n’est pas encore disponible. Contactez votre responsable pour réinitialiser votre accès.",
    );
  return getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const user = await tx.user.findUnique({
      where: { email },
      select: { id: true, status: true, passwordHash: true },
    });
    if (!user || user.status !== "ACTIVE") return;
    // One link per minute; return exactly the same public response on every branch.
    const recent = await tx.passwordReset.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60000) },
      },
    });
    if (recent) return;
    await tx.passwordReset.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    const token = randomBytes(32).toString("hex"),
      expiresAt = new Date(Date.now() + 15 * 60000);
    const row = await tx.passwordReset.create({
      data: {
        userId: user.id,
        email,
        tokenHash: digest(token),
        passwordVersion: digest(user.passwordHash),
        expiresAt,
      },
    });
    // A fragment keeps the token out of HTTP request URLs, access logs and referrers.
    const link = `${getAuthConfig().origin}/reinitialiser-mot-de-passe#token=${token}`;
    await queueMail(
      tx,
      user.id,
      `password-reset:${row.id}`,
      {
        to: email,
        subject: "Réinitialiser votre mot de passe BARKA",
        text: `Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 15 minutes et ne peut servir qu’une fois :\n\n${link}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
        resetId: row.id,
      },
      expiresAt,
    );
    return row.id;
  });
}
export async function completePasswordReset(input: unknown) {
  const data = recoveryResetSchema.parse(input),
    tokenHash = digest(data.token);
  const before = await getDb().passwordReset.findUnique({
    where: { tokenHash },
  });
  if (!before || before.consumedAt || before.expiresAt <= new Date())
    throw invalid();
  const passwordHash = await hash(data.password, 12);
  await getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const row = await tx.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !row ||
      row.consumedAt ||
      row.expiresAt <= new Date() ||
      row.user.status !== "ACTIVE" ||
      row.user.email !== row.email ||
      digest(row.user.passwordHash) !== row.passwordVersion
    )
      throw invalid();
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.passwordReset.updateMany({
      where: { userId: row.userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.authSession.deleteMany({ where: { userId: row.userId } });
    await tx.auditLog.create({
      data: {
        actorId: row.userId,
        companyId: row.user.companyId,
        action: "PASSWORD_RECOVERED",
        targetType: "User",
        targetId: row.userId,
      },
    });
  });
}
