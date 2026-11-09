import "server-only";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { getDb } from "@/lib/server/db";
import { lockIdentity } from "@/lib/server/identity-lock";
import { AppError } from "@/lib/server/errors";
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z
      .string()
      .min(12)
      .max(72)
      .refine((s) => Buffer.byteLength(s, "utf8") <= 72),
  })
  .strict()
  .refine((s) => s.currentPassword !== s.newPassword, {
    message: "Choisissez un mot de passe différent.",
  });
export async function changeOwnPassword(id: string, input: unknown) {
  const data = passwordChangeSchema.parse(input),
    db = getDb();
  const before = await db.user.findUnique({
    where: { id },
    select: { passwordHash: true, status: true },
  });
  if (
    !before ||
    before.status !== "ACTIVE" ||
    !(await compare(data.currentPassword, before.passwordHash))
  )
    throw new AppError(
      400,
      "PASSWORD_INVALID",
      "Le mot de passe actuel est incorrect.",
    );
  const next = await hash(data.newPassword, 12);
  await db.$transaction(async (tx) => {
    await lockIdentity(tx);
    const fresh = await tx.user.findUnique({
      where: { id },
      select: { passwordHash: true, status: true, companyId: true },
    });
    if (
      !fresh ||
      fresh.status !== "ACTIVE" ||
      fresh.passwordHash !== before.passwordHash
    )
      throw new AppError(
        409,
        "STALE_UPDATE",
        "Le compte a changé. Reconnectez-vous.",
      );
    await tx.user.update({ where: { id }, data: { passwordHash: next } });
    await tx.authSession.deleteMany({ where: { userId: id } });
    await tx.auditLog.create({
      data: {
        actorId: id,
        companyId: fresh.companyId,
        action: "PASSWORD_CHANGED",
        targetType: "User",
        targetId: id,
        metadata: { sessionsRevoked: true },
      },
    });
  });
}
