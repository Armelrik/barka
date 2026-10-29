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
          Document de travail · Version {consentVersions.TERMS} · À valider
          avant toute ouverture publique.
        </p>
        <h2>Un environnement de démonstration</h2>
        <p>
          Cette version de BARKA permet de découvrir des exemples immobiliers et
          de tester un compte client avec des données fictives. Les biens et
          visuels ne constituent pas des offres commerciales réelles. Aucune
          réservation ni aucun paiement ne peut être réalisé.
        </p>
        <h2>Votre compte</h2>
        <p>
          La création d’un compte client est gratuite. Un téléphone, un nom et
          un prénom sont demandés ; l’email est facultatif. Vous choisissez un
          mot de passe personnel et vous vous engagez à garder vos identifiants
          confidentiels. Pour les tests de cette version, utilisez uniquement
          des identités fictives.
        </p>
        <h2>Accès et utilisation</h2>
        <p>
          L’accès à l’espace personnel et aux équipes dépend des droits
          attribués au compte. Les tentatives d’accès au compte d’autrui et de
          contournement des autorisations ne sont pas permises. Les
          fonctionnalités de publication, de transaction foncière et de paiement
          ne sont pas encore ouvertes.
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
