import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { requireUser } from "@/lib/server/session";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(),
      page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .parse(new URL(request.url).searchParams.get("page") || 1);
    const where = { userId: user.id, channel: "IN_APP" as const };
    const [items, unread, total] = await Promise.all([
      getDb().notification.findMany({
        where,
        select: {
          id: true,
          title: true,
          body: true,
          href: true,
          createdAt: true,
          readAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        skip: (page - 1) * 20,
      }),
      getDb().notification.count({ where: { ...where, readAt: null } }),
      getDb().notification.count({ where }),
    ]);
    return privateJson({ items, unread, total, page });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await consumeRateLimit(`notifications:${user.id}`, 60, 900);
    const data = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("read"),
            id: z.string().max(100).optional(),
          })
          .strict(),
        z
          .object({
            action: z.literal("preferences"),
            emailNotifications: z.boolean(),
          })
          .strict(),
      ])
      .parse(await readJsonBody(request));
    if (data.action === "read")
      await getDb().notification.updateMany({
        where: {
          userId: user.id,
          channel: "IN_APP",
          readAt: null,
          ...(data.id ? { id: data.id } : {}),
        },
        data: { readAt: new Date() },
      });
    else
      await getDb().user.update({
        where: { id: user.id },
        data: { emailNotifications: data.emailNotifications },
      });
    return privateJson({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
