import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
export function AuthShell({
  children,
  registration = false,
  title,
  intro,
}: {
  children: React.ReactNode;
  registration?: boolean;
  title?: string;
  intro?: string;
}) {
  return (
    <main id="contenu" className="auth-page">
      <Link href="/" aria-label="BARKA SARL, accueil">
        <BrandLogo />
      </Link>
      <section className="auth-content">
        <h1>{title ?? (registration ? "Inscription" : "Connexion")}</h1>
        <p className="auth-intro">
          {intro ??
            (registration
              ? "Créez votre compte client gratuitement. Le téléphone suffit, l’email reste facultatif."
              : "Connectez-vous à votre compte BARKA.")}
        </p>
        {children}
      </section>
      <Link href="/" className="text-link">
        Retour à l’accueil
      </Link>
    </main>
  );
}
