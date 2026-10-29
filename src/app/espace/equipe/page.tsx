import Link from "next/link";
import { z } from "zod";
import { ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import { requirePageUser } from "@/lib/server/page-auth";
import { listManagedUsers } from "@/modules/identity/access";
import { roleLabels } from "@/modules/identity/validation";
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requirePageUser("users.manage");
  const parsed = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .safeParse((await searchParams).page ?? 1);
  const result = await listManagedUsers(user, parsed.success ? parsed.data : 1);
  return (
    <>
      <div className="workspace-heading">
        <span className="eyebrow">UN RÉSEAU DE PROXIMITÉ</span>
        <h1>Mon équipe.</h1>
        <p>
          Les utilisateurs ci-dessous appartiennent à votre périmètre autorisé.
        </p>
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
            <Link href={`/espace/equipe?page=${result.page - 1}`}>
              <ChevronLeft size={17} />
              Précédente
            </Link>
          )}
          <span>
            Page {result.page} sur{" "}
            {Math.max(1, Math.ceil(result.total / result.pageSize))}
          </span>
          {result.page * result.pageSize < result.total && (
            <Link href={`/espace/equipe?page=${result.page + 1}`}>
              Suivante
              <ChevronRight size={17} />
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}
