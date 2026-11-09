import Link from "next/link";
import { History } from "lucide-react";
import { roleLabels, statusLabels } from "@/modules/identity/validation";
import type { managedUserHistory } from "@/modules/identity/management";
const fields: Record<string, string> = {
  firstName: "prénom",
  lastName: "nom",
  phone: "téléphone",
  email: "email",
};
export function MemberHistory({
  userId,
  history,
}: {
  userId: string;
  history: Awaited<ReturnType<typeof managedUserHistory>>;
}) {
  return (
    <section
      className="team-panel member-history"
      aria-labelledby="history-title"
    >
      <div className="panel-title">
        <History size={21} />
        <h2 id="history-title">Historique des changements</h2>
      </div>
      <p className="team-info">
        Les valeurs des coordonnées et les mots de passe ne sont pas conservés
        dans cet historique. Horaires affichés à l’heure de Paris.
      </p>
      {history.items.length ? (
        <ol className="audit-list">
          {history.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.actorName}</strong>
                <time dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Europe/Paris",
                  }).format(new Date(item.createdAt))}
                </time>
              </div>
              <ul>
                {item.action === "USER_CREATED" && (
                  <li>
                    Compte créé
                    {item.createdRole
                      ? ` — ${roleLabels[item.createdRole]}`
                      : ""}
                    .
                  </li>
                )}
                {item.profileFields.length > 0 && (
                  <li>
                    Informations modifiées :{" "}
                    {item.profileFields.map((f) => fields[f]).join(", ")}.
                  </li>
                )}
                {item.roleChange && (
                  <li>
                    Rôle : {roleLabels[item.roleChange.from]} →{" "}
                    {roleLabels[item.roleChange.to]}.
                  </li>
                )}
                {item.statusChange && (
                  <li>
                    Statut : {statusLabels[item.statusChange.from]} →{" "}
                    {statusLabels[item.statusChange.to]}.
                  </li>
                )}
                {item.parentChanged && (
                  <li>Responsable de rattachement modifié.</li>
                )}
                {item.revokedSessions > 0 && (
                  <li>{item.revokedSessions} session(s) révoquée(s).</li>
                )}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="team-empty">
          Aucune modification de gestion enregistrée pour ce compte.
        </p>
      )}
      <nav className="team-pagination" aria-label="Pagination de l’historique">
        {history.page > 1 && (
          <Link
            href={`/espace/equipe/${userId}?historyPage=${history.page - 1}`}
          >
            Précédente
          </Link>
        )}
        <span>
          Page {history.page} sur{" "}
          {Math.max(1, Math.ceil(history.total / history.pageSize))}
        </span>
        {history.page * history.pageSize < history.total && (
          <Link
            href={`/espace/equipe/${userId}?historyPage=${history.page + 1}`}
          >
            Suivante
          </Link>
        )}
      </nav>
    </section>
  );
}
