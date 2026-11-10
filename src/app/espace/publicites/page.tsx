import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/server/page-auth";
import { manageAds } from "@/modules/advertising/service";
import { CampaignManager } from "@/components/advertising/campaign-manager";
export const metadata = { title: "Publicités | BARKA SARL" };
export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser();
  if (actor.role.code !== "SUPER_ADMIN") notFound();
  const q = await searchParams,
    page = z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .catch(1)
      .parse(q.page ?? 1),
    data = await manageAds(actor, page);
  return (
    <>
      <div className="workspace-heading">
        <h1>Publicités et campagnes</h1>
        <p>
          Gérez les annonces du hero et les deux bandeaux publicitaires de
          l’accueil.
        </p>
        <Link href="/espace/statistiques" className="text-link">
          Consulter les performances et exporter
        </Link>
      </div>
      <CampaignManager data={data} />
      <nav className="team-pagination" aria-label="Pages des campagnes">
        {page > 1 && (
          <Link href={`/espace/publicites?page=${page - 1}`}>Précédente</Link>
        )}
        <span>
          Page {page} sur {Math.max(1, Math.ceil(data.total / 20))}
        </span>
        {page * 20 < data.total && (
          <Link href={`/espace/publicites?page=${page + 1}`}>Suivante</Link>
        )}
      </nav>
    </>
  );
}
