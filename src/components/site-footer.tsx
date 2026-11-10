import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container mx-auto px-4">
        <div className="footer-columns">
          <div>
            <Link href="/" aria-label="BARKA SARL, accueil">
              <BrandLogo light />
            </Link>
            <p>
              Votre projet immobilier au Burkina Faso, de la découverte au suivi
              des visites.
            </p>
            <p>
              <MapPin /> Ouagadougou, Burkina Faso
            </p>
          </div>
          <div>
            <h3>Explorer les biens</h3>
            <Link href="/biens">Toutes les propriétés</Link>
            <Link href="/carte">Rechercher sur la carte</Link>
            <Link href="/visites/demo">Découvrir la visite 3D</Link>
          </div>
          <div>
            <h3>Votre espace</h3>
            <Link href="/inscription">Créer un compte client</Link>
            <Link href="/connexion">Se connecter</Link>
            <Link href="/espace">Mon compte et mes visites</Link>
            <Link href="/contact#professionnels">Espace professionnel</Link>
          </div>
          <div>
            <h3>Préparer votre projet</h3>
            <p>Besoin de comprendre le parcours ou l’accès professionnel ?</p>
            <Link className="footer-help-link" href="/contact">
              Consulter le guide <ArrowUpRight size={16} />
            </Link>
            <small>
              Les biens signalés « Bien de présentation » servent à la présentation.
              Leurs visites sont simulées.
            </small>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getUTCFullYear()} BARKA SARL. Tous droits réservés.
          </span>
          <div>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions d’utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
