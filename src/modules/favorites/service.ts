import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { lockIdentity } from "@/lib/server/identity-lock";
import { AppError } from "@/lib/server/errors";
import { publicListingWhere } from "@/modules/listings/access";
export const favoriteSchema = z
  .object({ slug: z.string().min(1).max(200), saved: z.boolean() })
  .strict();
export async function saveFavorite(actorId: string, input: unknown) {
  const { slug, saved } = favoriteSchema.parse(input);
  await getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { status: true },
    });
    if (actor?.status !== "ACTIVE")
      throw new AppError(
        401,
        "UNAUTHENTICATED",
        "Reconnectez-vous pour continuer.",
      );
    const listing = await tx.listing.findFirst({
      where: saved ? { AND: [{ slug }, publicListingWhere()] } : { slug },
      select: { id: true },
    });
    if (!listing) {
      if (!saved) return;
      throw new AppError(404, "NOT_FOUND", "Ce bien n’est plus disponible.");
    }
    if (saved)
      await tx.favorite.upsert({
        where: { userId_listingId: { userId: actorId, listingId: listing.id } },
        create: { userId: actorId, listingId: listing.id },
        update: {},
      });
    else
      await tx.favorite.deleteMany({
        where: { userId: actorId, listingId: listing.id },
      });
  });
}
