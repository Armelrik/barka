import { AppError } from "@/lib/server/errors";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/server/page-auth";
import { audienceReport } from "@/modules/audience/service";
import { placementLabels } from "@/modules/advertising/validation";
import { PrintReport } from "@/components/audience/print-report";
export const metadata = { title: "Audience et statistiques | BARKA SARL" };
export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requirePageUser();
  if (actor.role.code !== "SUPER_ADMIN") notFound();
  const q = await searchParams;
  let report;
  try {
    report = await audienceReport(actor, q);
  } catch (e) {
    if (!(e instanceof AppError) || e.code !== "DATE_RANGE") throw e;
    return (
      <div className="property-panel">
        <h1>Période invalide</h1>
        <p>Choisissez au maximum 90 jours, jusqu’à aujourd’hui.</p>
        <Link href="/espace/statistiques" className="text-link">
          Revenir aux 30 derniers jours
        </Link>
      </div>
    );
  }
  const params = new URLSearchParams({ from: report.from, to: report.to }),
    trend = report.days.slice(-14),
    maximum = Math.max(1, ...trend.flatMap((d) => [d.views, d.logins]));
  return (
    <article className="audience-report">
      <div className="workspace-heading">
        <span className="presentation-eyebrow">
          BARKA · Audience publicitaire
        </span>
        <h1>Audience et performances</h1>
        <p>
          Du {report.from} au {report.to} inclus · Heures UTC, Burkina Faso.
        </p>
      </div>
      <form
        className="audience-range report-controls"
        action="/espace/statistiques"
      >
        <label className="auth-field">
          Du
          <input name="from" type="date" defaultValue={report.from} required />
        </label>
        <label className="auth-field">
          Au
          <input name="to" type="date" defaultValue={report.to} required />
        </label>
        <button className="legacy-button">Afficher</button>
      </form>
      <div className="workspace-quick-actions report-controls">
        <a
          href={`/api/v1/admin/audience/export?${params}`}
          className="team-secondary-button"
        >
          Exporter l’audience (CSV)
        </a>
        <a
          href={`/api/v1/admin/audience/export?${params}&kind=campaigns`}
          className="team-secondary-button"
        >
          Exporter les campagnes (CSV)
        </a>
        <PrintReport />
        <Link className="text-link" href="/espace/publicites">
          Gérer les publicités
        </Link>
      </div>
      <div className="audience-metrics">
        {[
          ["Pages vues mesurées", report.totals.views],
          ["Sessions quotidiennes cumulées", report.totals.sessions],
          ["Connexions réussies", report.totals.logins],
          ["Connexions clients identifiées", report.totals.clientLogins],
          ["Affichages publicitaires", report.totals.impressions],
          ["Clics publicitaires", report.totals.clicks],
        ].map(([label, value]) => (
          <section className="property-panel" key={String(label)}>
            <span>{label}</span>
            <strong>{Number(value).toLocaleString("fr-FR")}</strong>
          </section>
        ))}
      </div>
      <section className="property-panel">
        <h2>Tendance des 14 derniers jours de la période</h2>
        <div
          className="audience-chart"
          role="img"
          aria-label="Pages vues en orange et connexions en turquoise, mêmes échelles. Le détail est disponible dans le tableau quotidien."
        >
          {trend.map((d) => (
            <div
              key={d.day}
              title={`${d.day} : ${d.views} pages vues, ${d.logins} connexions`}
            >
              <div>
                <span style={{ height: `${(d.views * 100) / maximum}%` }} />
                <span style={{ height: `${(d.logins * 100) / maximum}%` }} />
              </div>
              <small>{d.day.slice(8)}</small>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Orange : pages vues · Turquoise : connexions réussies. Les comptes de
          l’équipe sont distingués dans les exports.
        </p>
      </section>
      <section className="property-panel audience-definitions">
        <h2>Lire ces chiffres</h2>
        <p>
          Les pages vues sont des navigations publiques mesurées avec
          JavaScript. Les sessions sont des sessions de navigateur estimées,
          renouvelées après 30 minutes d’inactivité et comptées séparément
          chaque jour : elles ne représentent pas des personnes uniques sur la
          période. Les connexions sont des événements de sécurité réussis, pas
          des visites du site.
        </p>
        <p>
          Un affichage publicitaire est compté lorsque le visuel est visible à
          au moins 50 % pendant une seconde, ou lors d’un clic. Une même
          campagne n’est comptée qu’une fois par affichage de page et par
          session. Les bloqueurs, le refus de mesure et les robots peuvent
          influer sur les résultats ; ce rapport n’est pas une certification
          d’audience ou une preuve de facturation.
        </p>
        {report.totals.legacyLogins > 0 && (
          <p>
            {report.totals.legacyLogins} connexion(s) historique(s) ne
            contiennent pas de rôle enregistré ; elles ne sont pas présentées
            comme des connexions clients.
          </p>
        )}
        <a
          className="text-link report-controls"
          href="https://vercel.com/armelriks-projects/barka/analytics"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir Vercel Web Analytics
        </a>
        <p className="field-hint">
          Les compteurs Barka et Vercel sont deux mesures distinctes ; leurs
          définitions et périmètres peuvent donner des résultats différents.
          Aucune audience passée n’a été reconstituée artificiellement.
        </p>
      </section>
      <section className="property-panel">
        <h2>Performances par campagne</h2>
        <div className="audience-table">
          <table>
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Annonceur</th>
                <th>Emplacement</th>
                <th>Affichages</th>
                <th>Clics</th>
                <th>Taux de clic</th>
              </tr>
            </thead>
            <tbody>
              {report.campaigns.length ? (
                report.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.title}
                      <small>
                        {c.kind === "HOUSE" ? "Autopromotion" : "Sponsorisé"}
                      </small>
                    </td>
                    <td>{c.sponsor}</td>
                    <td>
                      {placementLabels[
                        c.placement as keyof typeof placementLabels
                      ] || c.placement}
                    </td>
                    <td>{c.impressions}</td>
                    <td>{c.clicks}</td>
                    <td>{c.ctr === null ? "—" : `${c.ctr} %`}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Aucune campagne pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="property-panel">
        <h2>Pages publiques consultées</h2>
        {report.pages.length ? (
          <ul>
            {report.pages.map((p) => (
              <li key={p.path}>
                {p.path} : {p.views} page(s) vue(s)
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune page vue mesurée sur cette période.</p>
        )}
      </section>
      <details className="property-panel">
        <summary>Détail quotidien</summary>
        <div className="audience-table">
          <table>
            <thead>
              <tr>
                <th>Jour UTC</th>
                <th>Pages vues</th>
                <th>Sessions</th>
                <th>Connexions</th>
                <th>Dont clients</th>
                <th>Dont équipe</th>
                <th>Démonstration</th>
                <th>Historiques non classées</th>
              </tr>
            </thead>
            <tbody>
              {report.days.map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td>{d.views}</td>
                  <td>{d.sessions}</td>
                  <td>{d.logins}</td>
                  <td>{d.clientLogins}</td>
                  <td>{d.teamLogins}</td>
                  <td>{d.demoLogins}</td>
                  <td>{d.legacyLogins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
