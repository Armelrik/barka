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
          Document de travail · Version {consentVersions.PRIVACY} · À valider
          avant toute ouverture publique.
        </p>
        <h2>Données de ce prototype</h2>
        <p>
          Le compte conserve le prénom, le nom, le téléphone, l’email facultatif
          et un mot de passe haché. La version des documents acceptés et la date
          du consentement sont enregistrées. Utilisez exclusivement des données
          fictives dans cet environnement.
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
          L’adresse réseau n’est utilisée que lorsqu’une configuration de proxy
          fiable a été explicitement activée.
        </p>
        <h2>Documents et conservation</h2>
        <p>
          Aucune pièce d’identité n’est demandée dans cette étape. La durée de
          conservation des comptes, journaux, sauvegardes et documents futurs,
          les coordonnées de contact et les procédures de demande d’accès ou de
          suppression doivent être définies avant le lancement public.
        </p>
        <Link href="/conditions" className="text-link">
          Lire les conditions d’utilisation
        </Link>
      </main>
    </>
  );
}
