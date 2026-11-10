import { requirePageUser } from "@/lib/server/page-auth";
import { DatabaseCatalog } from "@/components/database-catalog";
export const metadata = { title: "Mes favoris | BARKA SARL" };
export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser();
  return (
    <DatabaseCatalog query={await searchParams} favoriteUserId={actor.id} />
  );
}
