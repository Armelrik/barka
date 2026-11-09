import { requirePageUser } from "@/lib/server/page-auth";
import { readSettings } from "@/modules/backoffice/service";
import { SettingsForm } from "@/components/backoffice/settings-form";
export const metadata = { title: "Paramètres | BARKA SARL" };
export default async function SettingsPage() {
  const user = await requirePageUser("settings.manage"),
    settings = await readSettings(user);
  return (
    <>
      <div className="workspace-heading">
        <h1>Paramètres de la société.</h1>
        <p>{user.company.name} · Gestion des annonces et état des services.</p>
      </div>
      <section className="property-panel">
        <h2>Publication des biens</h2>
        <SettingsForm settings={settings} />
      </section>
      <section className="account-panel mt-6">
        <h2>État des services</h2>
        <dl>
          <div>
            <dt>Inscriptions clients</dt>
            <dd>
              {process.env.REGISTRATION_ENABLED === "true" &&
              process.env.LEGAL_DOCUMENTS_APPROVED === "true"
                ? "Ouvertes"
                : "Fermées"}
            </dd>
          </div>
          <div>
            <dt>Stockage des médias</dt>
            <dd>
              {process.env.MEDIA_DRIVER === "s3" && process.env.S3_BUCKET
                ? "Stockage objet configuré"
                : "Stockage local ou à configurer"}
            </dd>
          </div>
          <div>
            <dt>Catalogue</dt>
            <dd>
              {process.env.CATALOG_MODE === "database"
                ? "Connecté à la base"
                : "Démonstration"}
            </dd>
          </div>
          <div>
            <dt>Sessions</dt>
            <dd>8 heures maximum · révocables</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
