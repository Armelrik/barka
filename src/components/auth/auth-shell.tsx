import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
export function AuthShell({
  children,
  registration = false,
}: {
  children: React.ReactNode;
  registration?: boolean;
}) {
  return (
    <main id="contenu" className="auth-page">
      <aside className="auth-story">
        <Image
          src="/design/barka-hero.png"
          alt=""
          fill
          sizes="(max-width: 850px) 1px, 45vw"
          className="auth-story-image"
        />
        <div className="auth-story-shade" />
        <Link href="/" className="auth-brand" aria-label="BARKA SARL, accueil">
          <BrandLogo light />
        </Link>
        <div className="auth-story-copy">
          <span className="eyebrow">CHAQUE PROJET COMMENCE PAR UN LIEN.</span>
          <h2>
            Votre prochain chapitre
            <br />
            se prépare ici.
          </h2>
          <p>
            Un lieu pour vivre, un terrain pour construire.
            <br />
            Gardez le cap sur votre projet immobilier.
          </p>
        </div>
        <span className="auth-story-note">
          <ShieldCheck size={17} />
          L’immobilier en toute confiance.
        </span>
      </aside>
      <section className="auth-content">
        <Link className="text-link auth-back" href="/">
          <ArrowLeft size={16} /> Retour à l’accueil
        </Link>
        <div className="auth-content-inner">
          <span className="eyebrow">VOTRE ESPACE BARKA</span>
          <h1>
            {registration
              ? "Faisons connaissance."
              : "Heureux de vous retrouver."}
          </h1>
          <p className="auth-intro">
            {registration
              ? "Créez votre compte client gratuitement. Le téléphone suffit, l’email reste facultatif."
              : "Connectez-vous pour retrouver votre espace personnel et le suivi de votre projet."}
          </p>
          {children}
          {(process.env.NODE_ENV !== "production" ||
            process.env.BARKA_COMPANY_CODE === "BARKA-DEMO") && (
            <p className="auth-environment-note">
              Environnement de développement · Données fictives uniquement.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
