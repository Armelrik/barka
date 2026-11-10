import { validPriceRange } from "@/modules/catalog/query";
import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { apiError, privateJson, AppError } from "@/lib/server/errors";
import { lockIdentity } from "@/lib/server/identity-lock";
import { publicQuerySchema } from "@/modules/listings/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await consumeRateLimit(`searches:${user.id}`, 30, 900);
    const data = z
      .object({
        name: z.string().trim().min(2).max(80),
        filters: publicQuerySchema.omit({ page: true }).strict(),
      })
      .strict()
      .parse(await readJsonBody(request));
    if (!validPriceRange(data.filters))
      throw new AppError(400, "PRICE_RANGE", "Vérifiez la fourchette de prix.");
    await getDb().$transaction(async (tx) => {
      await lockIdentity(tx);
      if (
        (
          await tx.user.findUnique({
            where: { id: user.id },
            select: { status: true },
          })
        )?.status !== "ACTIVE"
      )
        throw new AppError(401, "UNAUTHENTICATED", "Reconnectez-vous.");
      if ((await tx.savedSearch.count({ where: { userId: user.id } })) >= 30)
        throw new AppError(
          409,
          "LIMIT",
          "Trente recherches enregistrées maximum.",
        );
      if (
        await tx.savedSearch.findUnique({
          where: { userId_name: { userId: user.id, name: data.name } },
        })
      )
        throw new AppError(
          409,
          "DUPLICATE",
          "Choisissez un autre nom pour cette recherche.",
        );
      await tx.savedSearch.create({
        data: { userId: user.id, name: data.name, filters: data.filters },
      });
    });
    return privateJson({ ok: true }, 201);
  } catch (e) {
    return apiError(e);
  }
}
