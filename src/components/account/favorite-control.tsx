import { currentUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { FavoriteButton } from "./favorite-button";
export async function FavoriteControl({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const actor = await currentUser();
  const saved = actor
    ? !!(await getDb().favorite.findFirst({
        where: { userId: actor.id, listing: { slug } },
        select: { listingId: true },
      }))
    : false;
  return (
    <FavoriteButton
      key={`${slug}:${saved}`}
      slug={slug}
      title={title}
      saved={saved}
      authenticated={!!actor}
    />
  );
}
