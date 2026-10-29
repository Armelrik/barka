import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Layers3,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { requirePageUser } from "@/lib/server/page-auth";
import { principalFor } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { managedUserWhere, descendantIds } from "@/modules/identity/access";
import { roleLabels } from "@/modules/identity/validation";
import { Button } from "@/components/ui/button";
export default async function WorkspacePage() {
  const user = await requirePageUser();
  const db = getDb();
  const staff = principalFor(user).permissions.includes("users.manage");
  const [bookings, subscriptions, payments] = await Promise.all([
    db.booking.count({ where: { userId: user.id } }),
    db.subscription.count({
      where: {
        userId: user.id,
        status: "ACTIVE",
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
    }),
    db.payment.count({
      where: { userId: user.id, status: "SUCCESS", verifiedAt: { not: null } },
    }),
  ]);
  let team = 0,
    pending = 0;
  if (staff) {
    const where = await managedUserWhere(user);
    const authorIds =
      user.role.code === "SUPER_ADMIN"
        ? undefined
        : [user.id, ...(await descendantIds(user))];
    [team, pending] = await Promise.all([
      db.user.count({ where }),
      db.listing.count({
        where: {
          status: { in: ["SUBMITTED", "VERIFYING"] },
          ...(authorIds
            ? {
                authorId: { in: authorIds },
                property: { companyId: user.companyId },
              }
            : {}),
        },
      }),
    ]);
  }
  const metrics = staff
    ? [
        { icon: UsersRound, label: "Membres dans mon périmètre", value: team },
        { icon: Layers3, label: "Annonces en attente", value: pending },
        {
          icon: CalendarDays,
          label: "Mes demandes enregistrées",
          value: bookings,
        },
      ]
    : [
        { icon: CalendarDays, label: "Demandes enregistrées", value: bookings },
        { icon: Layers3, label: "Abonnements actifs", value: subscriptions },
        { icon: CreditCard, label: "Paiements confirmés", value: payments },
      ];
  return (
    <>
      <div className="workspace-heading">
        <span className="eyebrow">VOTRE ESPACE, VOS PROJETS.</span>
        <h1>Bonjour {user.firstName}.</h1>
        <p>
          {staff
            ? "Retrouvez une vue de votre activité et de votre équipe autorisée."
            : "Bienvenue dans votre espace personnel BARKA."}
        </p>
      </div>
      <div className="metrics-grid">
        {metrics.map(({ icon: Icon, label, value }) => (
          <section className="metric-card" key={label}>
            <span>
              <Icon size={21} />
            </span>
            <strong>{value}</strong>
            <h2>{label}</h2>
          </section>
        ))}
      </div>
      <div className="workspace-panels">
        <section className="account-panel">
          <div className="panel-title">
            <ShieldCheck size={21} />
            <h2>Mon compte</h2>
          </div>
          <dl>
            <div>
              <dt>Nom complet</dt>
              <dd>
                {user.firstName} {user.lastName}
              </dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>{user.phone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Profil</dt>
              <dd>{roleLabels[user.role.code]}</dd>
            </div>
            <div>
              <dt>Téléphone vérifié</dt>
              <dd>{user.phoneVerifiedAt ? "Oui" : "Non"}</dd>
            </div>
          </dl>
          <p className="account-note">
            Votre téléphone sert d’identifiant de connexion. L’email est
            facultatif.
          </p>
        </section>
        <section className="workspace-invitation">
          <span className="eyebrow">LE BON ENDROIT POUR COMMENCER</span>
          <h2>
            Votre prochaine adresse
            <br />
            vous attend peut-être.
          </h2>
          <p>
            Explorez la sélection de démonstration et retrouvez les biens qui
            vous inspirent.
          </p>
          <Button asChild>
            <Link href="/#catalogue">
              Découvrir les biens <ArrowUpRight size={17} />
            </Link>
          </Button>
          {staff && (
            <Link className="workspace-team-link" href="/espace/equipe">
              Consulter mon équipe <ArrowUpRight size={16} />
            </Link>
          )}
        </section>
      </div>
    </>
  );
}
