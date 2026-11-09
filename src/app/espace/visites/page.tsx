import Link from "next/link";
import { requirePageUser } from "@/lib/server/page-auth";
import { principalFor } from "@/lib/server/session";
import { listVisits } from "@/modules/visits/service";
import {
  visitQuerySchema,
  visitStatusLabels,
} from "@/modules/visits/validation";
import { VisitCard } from "@/components/visits/visit-card";
export const metadata = { title: "Mes visites | BARKA SARL" };
export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser(),
    canManage = principalFor(actor).permissions.includes("properties.manage");
  const parsed = visitQuerySchema.safeParse(await searchParams),
    q = parsed.success ? parsed.data : visitQuerySchema.parse({});
  if (!canManage) q.view = "mine";
  const result = await listVisits(actor, q),
    team = q.view === "team";
  const pageHref = (page: number) =>
    `/espace/visites?${new URLSearchParams({ view: q.view, status: q.status, page: String(page) })}`;
  return (
    <>
      <div className="workspace-heading">
        <h1>{team ? "Les visites de mon équipe." : "Mes visites."}</h1>
        <p>
          {team
            ? "Répondez aux demandes et organisez les visites des biens de votre périmètre."
            : "Retrouvez vos propositions de visite et les réponses de l’équipe."}
        </p>
      </div>
      {canManage && (
        <nav className="visit-view-tabs" aria-label="Liste des visites">
          <Link
            aria-current={!team ? "page" : undefined}
            href="/espace/visites"
          >
            Mes demandes
          </Link>
          <Link
            aria-current={team ? "page" : undefined}
            href="/espace/visites?view=team"
          >
            Demandes reçues par l’équipe
          </Link>
        </nav>
      )}
      <form className="team-filters visit-filter" method="get">
        <input type="hidden" name="view" value={q.view} />
        <label>
          État de la visite
          <select
            name="status"
            defaultValue={q.status}
            aria-label="État de la visite"
          >
            <option value="">Tous les états</option>
            {Object.entries(visitStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="team-secondary-button">Filtrer</button>
      </form>
      <p className="visit-result-count">
        {result.total} demande(s) · horaires du Burkina Faso (UTC)
      </p>
      {result.items.length ? (
        <div className="visit-list">
          {result.items.map((visit) => (
            <VisitCard key={visit.id} visit={visit} team={team} />
          ))}
        </div>
      ) : (
        <section className="property-panel">
          <h2>
            {team
              ? "Aucune demande dans cette sélection."
              : "Vous n’avez pas encore de visite dans cette sélection."}
          </h2>
          <p>
            Choisissez un bien et proposez un horaire depuis sa fiche. Une
            demande devient un rendez-vous lorsque l’équipe la confirme.
          </p>
          <Link className="text-link" href="/biens">
            Explorer les biens
          </Link>
        </section>
      )}
      <nav className="team-pagination" aria-label="Pagination des visites">
        {q.page > 1 && <Link href={pageHref(q.page - 1)}>Précédente</Link>}
        <span>
          Page {q.page} sur{" "}
          {Math.max(1, Math.ceil(result.total / result.pageSize))}
        </span>
        {q.page * result.pageSize < result.total && (
          <Link href={pageHref(q.page + 1)}>Suivante</Link>
        )}
      </nav>
      <p className="visit-time-note mt-6">
        Une visite ne réserve pas le bien et ne déclenche aucun paiement. Les
        changements sont visibles ici ; aucune confirmation SMS ou email n’est
        envoyée pour le moment.
      </p>
    </>
  );
}
