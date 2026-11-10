import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { getAuthConfig } from "@/lib/server/auth-config";
import { sealMail, openMail } from "./crypto";

const mailSchema = z.object({
  to: z.email(),
  subject: z.string().max(200),
  text: z.string().max(10000),
  resetId: z.string().optional(),
});
export const mailReady = () =>
  process.env.MAIL_PROVIDER === "resend" &&
  !!process.env.RESEND_API_KEY &&
  !!process.env.MAIL_FROM;
export async function queueMail(
  tx: Prisma.TransactionClient,
  userId: string,
  key: string,
  mail: z.infer<typeof mailSchema>,
  expiresAt = new Date(Date.now() + 23 * 3600000),
) {
  await tx.mailDelivery.create({
    data: {
      userId,
      key,
      payload: sealMail(mailSchema.parse(mail), getAuthConfig().secret),
      expiresAt,
    },
  });
}
export async function notifyVisit(
  tx: Prisma.TransactionClient,
  userIds: string[],
  template: string,
  key: string,
  body: string,
  requesterId: string,
) {
  const users = await tx.user.findMany({
    where: { id: { in: [...new Set(userIds)] }, status: "ACTIVE" },
    select: { id: true, email: true, emailNotifications: true },
  });
  for (const user of users) {
    const title =
      template === "VISIT_REQUESTED"
        ? "Nouvelle demande de visite"
        : "Votre visite a été mise à jour";
    const item = await tx.notification.create({
      data: {
        userId: user.id,
        channel: "IN_APP",
        template,
        title,
        body,
        href:
          user.id === requesterId
            ? "/espace/visites"
            : "/espace/visites?view=team",
        dedupeKey: `${key}:${user.id}`,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    if (user.email && user.emailNotifications && mailReady()) {
      await queueMail(tx, user.id, `notification:${item.id}`, {
        to: user.email,
        subject: `${title} — BARKA`,
        text: `${body}\n\nRetrouvez les détails dans votre espace : ${getAuthConfig().origin}${item.href}`,
      });
    }
  }
}
export async function deliverMailBatch(limit = 5, priorityResetId?: string) {
  if (!mailReady()) return { sent: 0, configured: false };
  let sent = 0;
  for (let i = 0; i < limit; i++) {
    const row = await getDb().$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "MailDelivery" WHERE (status = 'PENDING' AND "nextRunAt" <= NOW()) OR (status = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '5 minutes') ORDER BY CASE WHEN "key" = ${priorityResetId ? `password-reset:${priorityResetId}` : ""} THEN 0 ELSE 1 END, "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!rows[0]) return null;
      return tx.mailDelivery.update({
        where: { id: rows[0].id },
        data: {
          status: "PROCESSING",
          lockedAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    });
    if (!row) break;
    try {
      const mail = mailSchema.parse(
        openMail(row.payload, getAuthConfig().secret),
      );
      const user = await getDb().user.findUnique({
        where: { id: row.userId },
        select: { status: true, email: true, emailNotifications: true },
      });
      const reset = mail.resetId
        ? await getDb().passwordReset.findUnique({
            where: { id: mail.resetId },
          })
        : null;
      if (
        row.expiresAt <= new Date() ||
        !user ||
        user.status !== "ACTIVE" ||
        user.email !== mail.to ||
        (!mail.resetId && !user.emailNotifications) ||
        (mail.resetId &&
          (!reset || reset.consumedAt || reset.expiresAt <= new Date()))
      ) {
        await getDb().mailDelivery.update({
          where: { id: row.id },
          data: { status: "FAILED", payload: "", lockedAt: null },
        });
        continue;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": row.key,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("MAIL_DELIVERY_FAILED");
      const result = await response.json();
      await getDb().mailDelivery.update({
        where: { id: row.id },
        data: {
          status: "SENT",
          providerId: typeof result.id === "string" ? result.id : null,
          payload: "",
          lockedAt: null,
        },
      });
      sent++;
    } catch {
      // Never log the recipient, provider response, token or encrypted payload.
      await getDb().mailDelivery.update({
        where: { id: row.id },
        data: {
          status: row.attempts >= 5 ? "FAILED" : "PENDING",
          nextRunAt: new Date(
            Date.now() + Math.min(3600, 60 * 2 ** row.attempts) * 1000,
          ),
          lockedAt: null,
          ...(row.attempts >= 5 ? { payload: "" } : {}),
        },
      });
    }
  }
  return { sent, configured: true };
}
