import Link from "next/link";
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
      <Link href="/" aria-label="BARKA SARL, accueil">
        <BrandLogo />
      </Link>
      <section className="auth-content">
        <h1>{registration ? "Inscription" : "Connexion"}</h1>
        <p className="auth-intro">
          {registration
            ? "Créez votre compte client gratuitement. Le téléphone suffit, l’email reste facultatif."
            : "Connectez-vous à votre compte BARKA."}
        </p>
        {children}
      </section>
      <Link href="/" className="text-link">
        Retour à l’accueil
      </Link>
    </main>
  );
}
