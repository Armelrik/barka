import Link from "next/link";
import { Plus, House, ScanEye } from "lucide-react";
import { requirePageUser } from "@/lib/server/page-auth";
import { listPrivateListings } from "@/modules/listings/service";
import {
  listingQuerySchema,
  statusLabels,
  propertyTypeLabels,
} from "@/modules/listings/validation";
import { formatXof } from "@/lib/utils";
export const metadata = { title: "Gestion des biens | BARKA SARL" };
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser("properties.manage"),
    parsed = listingQuerySchema.safeParse(await searchParams),
    q = parsed.success ? parsed.data : listingQuerySchema.parse({}),
    result = await listPrivateListings(actor, q);
  const page = (n: number) =>
    `/espace/biens?${new URLSearchParams({ q: q.q, status: q.status, page: String(n) })}`;
  return (
    <>
      <div className="workspace-heading">
        <h1>Mes biens immobiliers.</h1>
        <p>
          Préparez les dossiers, les médias et les visites, puis soumettez les
          annonces à validation.
        </p>
      </div>
      <div className="team-toolbar">
        <form className="team-filters" method="get">
          <label>
            Rechercher un bien
            <input
              name="q"
              maxLength={100}
              defaultValue={q.q}
              placeholder="Titre ou référence"
            />
          </label>
          <label>
            État du dossier
            <select name="status" defaultValue={q.status}>
              <option value="">Tous les états</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="team-secondary-button">Filtrer</button>
          <Link className="team-reset" href="/espace/biens">
            Effacer les filtres
          </Link>
        </form>
        <Link className="team-primary-button" href="/espace/biens/nouveau">
          <Plus size={18} />
          Ajouter un bien
        </Link>
      </div>
      <section className="team-panel">
        <div className="panel-title">
          <House size={21} />
          <h2>{result.total} dossier(s)</h2>
        </div>
        {result.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Commercial</th>
                  <th>Prix</th>
                  <th>État</th>
                  <th>Visite</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <small>
                        {p.reference} · {propertyTypeLabels[p.type]} ·{" "}
                        {p.locationName}
                      </small>
                    </td>
                    <td>{p.agentName}</td>
                    <td>
                      {formatXof(p.priceXof)}
                      {p.offer === "RENT" ? " / mois" : ""}
                    </td>
                    <td>
                      <span
                        className={`listing-state listing-state-${p.status}`}
                      >
                        {statusLabels[p.status]}
                      </span>
                    </td>
                    <td>
                      {p.tours.length ? (
                        <ScanEye size={20} aria-label="Visite configurée" />
                      ) : (
                        "À préparer"
                      )}
                    </td>
                    <td>
                      <Link
                        className="team-edit-link"
                        href={`/espace/biens/${p.id}`}
                      >
                        Gérer le bien
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="team-empty">
            <House />
            <h2>Aucun dossier dans votre périmètre.</h2>
            <p>
              Créez votre premier bien pour ajouter ses photographies et sa
              visite.
            </p>
          </div>
        )}
        <nav className="team-pagination" aria-label="Pagination des biens">
          {result.page > 1 && (
            <Link href={page(result.page - 1)}>Précédente</Link>
          )}
          <span>
            Page {result.page} sur{" "}
            {Math.max(1, Math.ceil(result.total / result.pageSize))}
          </span>
          {result.page * result.pageSize < result.total && (
            <Link href={page(result.page + 1)}>Suivante</Link>
          )}
        </nav>
      </section>
    </>
  );
}
