import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  MapPin,
  ScanEye,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Catalog } from "@/components/catalog";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="contenu">
        <section className="hero shell" aria-labelledby="hero-title">
          <Image
            src="/design/barka-hero.png"
            alt="Vue d’ambiance d’une villa contemporaine, sa terrasse et sa piscine à la lumière du soir"
            fill
            preload
            sizes="(max-width: 700px) 100vw, 94vw"
            className="hero-image"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="small-dot" /> VOTRE PROJET, VOTRE ADRESSE.
            </span>
            <h1 id="hero-title">
              Trouvez le bien
              <br />
              qui vous ressemble.
            </h1>
            <p>
              Un nouveau chez-vous. Un terrain pour demain.
              <br className="desktop-break" /> Faites le premier pas avec BARKA.
            </p>
            <Button asChild>
              <Link href="#catalogue">
                Explorer les biens <ArrowUpRight size={18} />
              </Link>
            </Button>
            <div className="hero-location">
              <MapPin size={15} /> L’immobilier au Burkina Faso
            </div>
          </div>
          <a
            href="#catalogue"
            className="hero-scroll"
            aria-label="Descendre vers les biens"
          >
            <ArrowDown size={19} />
          </a>
          <span className="hero-image-note">
            Visuel d’ambiance · Création IA
          </span>
        </section>
        <Catalog />
        <section id="approche" className="approach shell">
          <div className="approach-intro">
            <span className="eyebrow">SIMPLEMENT, BARKA.</span>
            <h2>
              Votre recherche mérite
              <br />
              un peu de simplicité.
            </h2>
            <p>
              De la première idée à la bonne adresse, nous imaginons une
              expérience immobilière plus claire, plus proche de vous.
            </p>
            <a className="text-link" href="#catalogue">
              Trouver mon inspiration <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="approach-items">
            {[
              {
                icon: SlidersHorizontal,
                title: "À chaque projet, ses critères",
                body: "Acheter ou louer, une villa ou une parcelle : affinez votre recherche à votre rythme.",
              },
              {
                icon: ShieldCheck,
                title: "Des repères pour avancer",
                body: "Des informations lisibles et un parcours de vérification prévu avant la publication des annonces.",
              },
              {
                icon: ScanEye,
                title: "Une autre façon de se projeter",
                body: "Les visites 360° rejoindront la plateforme lorsque des panoramas autorisés seront disponibles.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="approach-item">
                <span className="approach-icon">
                  <Icon size={21} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="projet" className="project-section shell">
          <div>
            <span className="eyebrow">UN NOUVEAU CHAPITRE IMMOBILIER</span>
            <h2>
              De belles adresses.
              <br />
              Et bientôt, la vôtre.
            </h2>
          </div>
          <div>
            <p>
              BARKA SARL prépare une plateforme immobilière et foncière pensée
              pour le Burkina Faso et ouverte sur l’Afrique.
            </p>
            <p>
              Explorez cet aperçu à travers des biens fictifs. Les comptes, les
              réservations, les paiements et les visites virtuelles seront
              proposés lors des prochaines étapes.
            </p>
            <Button asChild variant="outline">
              <Link href="#catalogue">
                Découvrir la sélection <ArrowUpRight size={17} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="site-footer shell">
        <Link href="/" className="footer-brand">
          BARKA<span>SARL</span>
        </Link>
        <p>Un lieu pour chaque nouveau départ.</p>
        <span>© {new Date().getUTCFullYear()} BARKA SARL · Démonstration</span>
      </footer>
    </>
  );
}
