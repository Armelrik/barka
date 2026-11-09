import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { consentVersions } from "@/modules/identity/validation";
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="legal-page shell">
        <span className="eyebrow">BARKA SARL</span>
        <h1>Conditions d’utilisation</h1>
        <p className="legal-draft">
          Version {consentVersions.TERMS} · Conditions du service BARKA.
        </p>
        <h2>La plateforme BARKA</h2>
        <p>
          BARKA permet de consulter des biens, de créer un compte et de proposer
          une visite. Les exemples identifiés comme fictifs et leurs images
          d’illustration ne constituent pas des offres commerciales. Une demande
          de visite ne réserve pas un bien. Aucun paiement n’est actuellement
          encaissé sur la plateforme.
        </p>
        <h2>Votre compte</h2>
        <p>
          La création d’un compte client est gratuite. Un téléphone, un nom et
          un prénom sont demandés ; l’email est facultatif. Vous choisissez un
          mot de passe personnel et vous vous engagez à garder vos identifiants
          confidentiels. Les comptes créés depuis le formulaire public sont des
          comptes clients ; les rôles professionnels sont attribués par
          l’administration.
        </p>
        <h2>Accès et utilisation</h2>
        <p>
          L’accès à l’espace personnel et aux équipes dépend des droits
          attribués au compte. Les tentatives d’accès au compte d’autrui et de
          contournement des autorisations ne sont pas permises. Les publications
          de biens réels sont soumises à validation. Les transactions foncières
          et paiements ne sont pas exécutés automatiquement par ce site.
        </p>
        <h2>Avant le lancement public</h2>
        <p>
          L’identité légale complète de l’exploitant, ses coordonnées, les
          modalités de service, de réclamation et de règlement des différends
          doivent compléter ce document avant la mise en service publique. Cette
          version n’est pas présentée comme un texte juridique finalisé.
        </p>
        <Link href="/confidentialite" className="text-link">
          Lire la politique de confidentialité
        </Link>
      </main>
    </>
  );
}
