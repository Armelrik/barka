import Link from "next/link";
import { requirePageUser } from "@/lib/server/page-auth";
import { auditPage } from "@/modules/backoffice/service";
export const metadata = { title: "Historique d’activité | BARKA SARL" };
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser("settings.manage"),
    result = await auditPage(actor, await searchParams);
  return (
    <>
      <div className="workspace-heading">
        <h1>Historique d’activité.</h1>
        <p>
          Créations, modifications, validations et événements de connexion dans
          votre périmètre.
        </p>
      </div>
      <section className="team-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Auteur</th>
                <th>Ressource</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((e) => (
                <tr key={e.id}>
                  <td>
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Africa/Ouagadougou",
                    }).format(e.createdAt)}
                  </td>
                  <td>{e.action.replaceAll("_", " ").toLowerCase()}</td>
                  <td>
                    {e.actor
                      ? `${e.actor.firstName} ${e.actor.lastName}`
                      : "Système"}
                  </td>
                  <td>{e.targetType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <nav className="team-pagination" aria-label="Pagination de l’activité">
        {result.page > 1 && (
          <Link href={`?page=${result.page - 1}`}>Précédente</Link>
        )}
        <span>
          Page {result.page} sur {Math.max(1, Math.ceil(result.total / 30))}
        </span>
        {result.page * 30 < result.total && (
          <Link href={`?page=${result.page + 1}`}>Suivante</Link>
        )}
      </nav>
      <p className="account-note">
        Horaires du Burkina Faso. Les mots de passe, pièces et contenus des
        messages ne sont pas affichés dans cet historique.
      </p>
    </>
  );
}
