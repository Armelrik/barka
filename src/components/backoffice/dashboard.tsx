import Link from "next/link";
import {
  House,
  UsersRound,
  CalendarDays,
  Plus,
  ClipboardCheck,
  Activity,
  Settings,
} from "lucide-react";
import { workspaceSummary } from "@/modules/backoffice/service";
import { principalFor, type AuthenticatedUser } from "@/lib/server/session";
import { statusLabels } from "@/modules/listings/validation";
export async function BackofficeDashboard({
  user,
}: {
  user: AuthenticatedUser;
}) {
  const data = await workspaceSummary(user),
    admin = principalFor(user).permissions.includes("settings.manage");
  const metrics = [
    {
      label: "Biens dans mon périmètre",
      value: data.total,
      icon: House,
      href: "/espace/biens",
    },
    {
      label: "Annonces publiées",
      value: data.published,
      icon: ClipboardCheck,
      href: "/espace/biens?status=PUBLISHED",
    },
    {
      label: "Demandes de visite à traiter",
      value: data.visits,
      icon: CalendarDays,
      href: "/espace/visites?view=team&status=REQUESTED",
    },
    {
      label: "Membres de mon équipe",
      value: data.team,
      icon: UsersRound,
      href: "/espace/equipe",
    },
  ];
  return (
    <>
      <div className="workspace-heading">
        <span className="eyebrow">BARKA · BACK-OFFICE</span>
        <h1>Bonjour {user.firstName}.</h1>
        <p>
          Gérez votre équipe, les biens et les demandes depuis votre espace de
          travail.
        </p>
      </div>
      <div className="backoffice-actions">
        <Link className="team-primary-button" href="/espace/biens/nouveau">
          <Plus size={18} />
          Ajouter un bien
        </Link>
        <Link className="team-secondary-button" href="/espace/equipe/nouveau">
          <UsersRound size={18} />
          Créer un utilisateur
        </Link>
        <Link className="team-secondary-button" href="/espace/compte">
          Mon compte et sécurité
        </Link>
      </div>
      <div className="metrics-grid backoffice-metrics">
        {metrics.map(({ icon: Icon, ...m }) => (
          <Link className="metric-card" href={m.href} key={m.label}>
            <span>
              <Icon size={21} />
            </span>
            <strong>{m.value}</strong>
            <h2>{m.label}</h2>
          </Link>
        ))}
      </div>
      <div className="backoffice-grid">
        <section className="property-panel">
          <div className="backoffice-panel-heading">
            <h2>Derniers dossiers</h2>
            <Link className="text-link" href="/espace/biens">
              Tout voir
            </Link>
          </div>
          {data.latest.length ? (
            <div className="backoffice-list">
              {data.latest.map((l) => (
                <Link href={`/espace/biens/${l.id}`} key={l.id}>
                  <div>
                    <strong>{l.property.title}</strong>
                    <small>
                      {l.property.reference}
                      {l.isDemo ? " · Bien de présentation" : ""} ·{" "}
                      {l.property.agent
                        ? `${l.property.agent.firstName} ${l.property.agent.lastName}`
                        : "À attribuer"}
                    </small>
                  </div>
                  <span className="visit-status">{statusLabels[l.status]}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p>Aucun dossier. Ajoutez un premier bien pour commencer.</p>
          )}
        </section>
        <section className="property-panel">
          <h2>État du catalogue</h2>
          <div className="backoffice-status-list">
            {data.groups.map((g) => (
              <Link href={`/espace/biens?status=${g.status}`} key={g.status}>
                <span>{statusLabels[g.status]}</span>
                <strong>{g._count._all}</strong>
                <div className="backoffice-bar">
                  <span
                    style={{
                      width: `${data.total ? (g._count._all / data.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
          {data.pending > 0 && (
            <p className="account-note">
              {data.pending} annonce(s) attendent une validation.
            </p>
          )}
        </section>
      </div>
      <section className="property-panel">
        <h2>Répartition des biens par commercial</h2>
        {data.agents.length ? (
          <div className="backoffice-agents">
            {data.agents.map((a) => (
              <Link href={`/espace/equipe/${a.id}`} key={a.id}>
                <span className="workspace-avatar">
                  {a.firstName[0]}
                  {a.lastName[0]}
                </span>
                <div>
                  <strong>
                    {a.firstName} {a.lastName}
                  </strong>
                  <small>
                    {a._count.assignedProperties} bien(s) ·{" "}
                    {a.status === "ACTIVE" ? "Actif" : "Suspendu"}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>
            Créez les membres de votre équipe pour leur attribuer des biens.
          </p>
        )}
      </section>
      {user.role.code === "SUPER_ADMIN" && (
        <div className="backoffice-actions">
          <Link className="team-secondary-button" href="/espace/publicites">
            Gérer les publicités
          </Link>
          <Link className="team-secondary-button" href="/espace/statistiques">
            Audience et exports
          </Link>
        </div>
      )}
      {admin && (
        <div className="backoffice-actions mt-6">
          <Link className="team-secondary-button" href="/espace/activite">
            <Activity size={18} />
            Historique d’activité
          </Link>
          <Link className="team-secondary-button" href="/espace/parametres">
            <Settings size={18} />
            Paramètres de la société
          </Link>
        </div>
      )}
    </>
  );
}
