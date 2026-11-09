import Link from "next/link";
import { teamQuerySchema, statusLabels } from "@/modules/identity/validation";
import { roleLevels, type RoleCode } from "@/modules/identity/policy";
import {
  ChevronLeft,
  ChevronRight,
  UsersRound,
  UserPlus,
  Pencil,
} from "lucide-react";
import { requirePageUser } from "@/lib/server/page-auth";
import { listManagedUsers } from "@/modules/identity/access";
import { roleLabels } from "@/modules/identity/validation";
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePageUser("users.manage");
  const parsed = teamQuerySchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : teamQuerySchema.parse({});
  const result = await listManagedUsers(user, query.page, query);
  const roles = (Object.keys(roleLevels) as RoleCode[]).filter(
    (role) =>
      roleLevels[role] < roleLevels[user.role.code] && role !== "VISITOR",
  );
  const pageLink = (page: number) =>
    `/espace/equipe?${new URLSearchParams({ page: String(page), q: query.q, role: query.role, status: query.status })}`;
  return (
    <>
      <div className="workspace-heading">
        <span className="eyebrow">UN RÉSEAU DE PROXIMITÉ</span>
        <h1>Mon équipe.</h1>
        <p>
          Les utilisateurs ci-dessous appartiennent à votre périmètre autorisé.
        </p>
      </div>
      <div className="team-toolbar">
        <form method="get" className="team-filters">
          <label>
            Rechercher
            <input
              name="q"
              defaultValue={query.q}
              maxLength={100}
              placeholder="Nom, téléphone ou email"
            />
          </label>
          <label>
            Rôle
            <select name="role" defaultValue={query.role}>
              <option value="">Tous les rôles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select name="status" defaultValue={query.status}>
              <option value="">Tous les statuts</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="team-secondary-button" type="submit">
            Filtrer
          </button>
          <Link href="/espace/equipe" className="team-reset">
            Effacer les filtres
          </Link>
        </form>
        <Link className="team-primary-button" href="/espace/equipe/nouveau">
          <UserPlus size={18} />
          Créer un compte
        </Link>
      </div>
      <section className="team-panel">
        <div className="panel-title">
          <UsersRound size={21} />
          <h2>
            {result.total} membre{result.total > 1 ? "s" : ""}
          </h2>
        </div>
        {result.items.length ? (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                Utilisateurs de mon équipe, page {result.page}
              </caption>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Responsable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                      <small>{member.email ?? "Email non renseigné"}</small>
                    </td>
                    <td>{roleLabels[member.role.code]}</td>
                    <td>{member.phone}</td>
                    <td>
                      <span
                        className={`user-state ${member.status === "ACTIVE" ? "user-state-active" : ""}`}
                      >
                        {member.status === "ACTIVE"
                          ? "Actif"
                          : member.status === "SUSPENDED"
                            ? "Suspendu"
                            : "Fermé"}
                      </span>
                    </td>
                    <td>
                      {member.parentLink?.parent
                        ? `${member.parentLink.parent.firstName} ${member.parentLink.parent.lastName}`
                        : "Non rattaché"}
                    </td>
                    <td>
                      <Link
                        className="team-edit-link"
                        href={`/espace/equipe/${member.id}`}
                        aria-label={`Gérer le compte de ${member.firstName} ${member.lastName}`}
                      >
                        <Pencil size={16} />
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="team-empty">
            <UsersRound size={30} />
            <h2>Aucun membre sur cette page.</h2>
            <p>Vos utilisateurs rattachés apparaîtront ici.</p>
          </div>
        )}
        <nav className="team-pagination" aria-label="Pagination de l’équipe">
          {result.page > 1 && (
            <Link href={pageLink(result.page - 1)}>
              <ChevronLeft size={17} />
              Précédente
            </Link>
          )}
          <span>
            Page {result.page} sur{" "}
            {Math.max(1, Math.ceil(result.total / result.pageSize))}
          </span>
          {result.page * result.pageSize < result.total && (
            <Link href={pageLink(result.page + 1)}>
              Suivante
              <ChevronRight size={17} />
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}
