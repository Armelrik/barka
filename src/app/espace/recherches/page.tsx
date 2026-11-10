import { catalogSearchParams } from "@/modules/catalog/query";
import Link from "next/link";
import { requirePageUser } from "@/lib/server/page-auth";
import { getDb } from "@/lib/server/db";
import { publicQuerySchema } from "@/modules/listings/validation";
import { RemoveSearch } from "@/components/account/saved-search";
export const metadata = { title: "Mes recherches | BARKA SARL" };
export default async function SearchesPage() {
  const user = await requirePageUser();
  const items = await getDb().savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <>
      <div className="workspace-heading">
        <h1>Mes recherches enregistrées</h1>
        <p>
          Relancez vos filtres de localisation, de projet et de budget en un
          clic.
        </p>
      </div>
      {items.length ? (
        items.map((item) => {
          const q = publicQuerySchema.parse(item.filters);
          const href = `/biens?${catalogSearchParams(q)}`;
          return (
            <section className="property-panel" key={item.id}>
              <h2>{item.name}</h2>
              <p>
                {q.location || "Toutes les localisations"} ·{" "}
                {q.offer === "SALE"
                  ? "Achat"
                  : q.offer === "RENT"
                    ? "Location"
                    : "Achat ou location"}
              </p>
              <div className="workspace-quick-actions">
                <Link href={href} className="legacy-button">
                  Voir les biens
                </Link>
                <RemoveSearch id={item.id} />
              </div>
            </section>
          );
        })
      ) : (
        <div className="empty-state">
          <p>
            Enregistrez vos critères depuis le catalogue pour les retrouver ici.
          </p>
          <Link href="/biens" className="text-link">
            Explorer les biens
          </Link>
        </div>
      )}
    </>
  );
}
