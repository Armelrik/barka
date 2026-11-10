import Link from "next/link";
import { requirePageUser } from "@/lib/server/page-auth";
import { PasswordForm } from "@/components/backoffice/password-form";
import { roleLabels } from "@/modules/identity/validation";
export const metadata = { title: "Mon compte et sécurité | BARKA SARL" };
export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <div className="workspace-heading">
        <h1>Mon compte et sécurité.</h1>
        <p>Retrouvez vos identifiants de connexion et protégez votre compte.</p>
      </div>
      <section className="account-panel">
        <h2>Mon profil</h2>
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
            <dt>Rôle</dt>
            <dd>{roleLabels[user.role.code]}</dd>
          </div>
          <div>
            <dt>Société</dt>
            <dd>{user.company.name}</dd>
          </div>
        </dl>
      </section>
      <section className="property-panel">
        <h2>Mes notifications</h2>
        <p>
          Consultez les réponses de l’équipe et choisissez si vous souhaitez
          aussi les recevoir par email.
        </p>
        <Link href="/espace/notifications" className="text-link">
          Gérer mes notifications
        </Link>
      </section>
      <section className="property-panel">
        <h2>Changer mon mot de passe</h2>
        <PasswordForm />
      </section>
    </>
  );
}
