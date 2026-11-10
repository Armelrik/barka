import { PrivacyPreference } from "@/components/audience/privacy-preference";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { consentVersions } from "@/modules/identity/validation";
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="legal-page shell">
        <span className="eyebrow">BARKA SARL</span>
        <h1>Politique de confidentialité</h1>
        <p className="legal-draft">
          Version {consentVersions.PRIVACY} · Informations sur les données du
          service BARKA.
        </p>
        <h2>Données du compte</h2>
        <p>
          Le compte conserve le prénom, le nom, le téléphone, l’email facultatif
          et un mot de passe haché. La version des documents acceptés et la date
          du consentement sont enregistrées. Les messages des demandes de visite
          et les réponses de l’équipe sont conservés pour le suivi des demandes.
        </p>
        <h2>Connexion et sécurité</h2>
        <p>
          Un cookie de session nécessaire à la connexion est protégé contre la
          lecture par les scripts du navigateur. La session a une durée maximale
          de huit heures et peut être révoquée. Les actions de création de
          compte, de connexion réussie et de déconnexion sont journalisées sans
          mot de passe.
        </p>
        <h2>Favoris et limitation des tentatives</h2>
        <p>
          Les favoris de démonstration sont enregistrés localement dans votre
          navigateur. Les tentatives de connexion et d’inscription sont limitées
          avec des compteurs en base ; les clés de ces compteurs sont hachées.
          Le serveur utilise l’adresse transmise par Vercel pour ces limitations
          ; sur un autre hébergement, la confiance au proxy doit être
          configurée. Les compteurs n’enregistrent pas le mot de passe.
        </p>
        <h2>Audience et publicités</h2>
        <p>
          Vercel Web Analytics et les compteurs Barka mesurent les pages
          publiques, les sessions de navigation estimées et les interactions
          publicitaires. Les pages du compte, les paramètres d’URL et les jetons
          de récupération sont exclus de ces mesures. Barka utilise un
          identifiant aléatoire dans le stockage de session du navigateur,
          renouvelé après trente minutes d’inactivité et pseudonymisé
          quotidiennement côté serveur. Aucun email, téléphone, mot de passe ou
          adresse IP brute n’est inclus dans les rapports publicitaires. Les
          connexions réussies sont comptées séparément à partir du journal de
          sécurité. Les exports destinés aux annonceurs contiennent des totaux,
          pas la liste des utilisateurs.
        </p>
        <PrivacyPreference />
        <h2>Documents et conservation</h2>
        <p>
          La création d’un compte client ne demande pas de pièce d’identité. Les
          profils professionnels peuvent transmettre une pièce privée pour leur
          vérification. Base et médias sont hébergés chez Neon ; les documents
          sont accessibles uniquement aux personnes autorisées. La durée de
          conservation des comptes, journaux, sauvegardes et documents, les
          coordonnées de contact et les procédures de demande d’accès ou de
          suppression doivent être définies avant le lancement public.
        </p>
        <Link href="/conditions" className="text-link">
          Lire les conditions d’utilisation
        </Link>
      </main>
    </>
  );
}
