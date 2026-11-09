import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  MapPin,
  Search,
  CalendarDays,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
export const metadata = { title: "Votre projet et nos services | BARKA SARL" };
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="public-page shell pb-20">
        <div className="section-heading pt-8">
          <span className="presentation-eyebrow">BARKA vous accompagne</span>
          <h1>Parlons de votre projet</h1>
          <p>
            Acheter, louer ou gérer des biens : choisissez le parcours qui vous
            correspond.
          </p>
        </div>
        <div className="project-paths">
          <section className="contact-panel">
            <Search className="project-icon" size={28} />
            <h2>Vous cherchez un bien</h2>
            <p>
              Comparez les photos, les prix et les caractéristiques. La carte
              vous aide à repérer les quartiers qui vous intéressent.
            </p>
            <Link href="/biens" className="legacy-button">
              Explorer les propriétés <ArrowRight size={16} />
            </Link>
          </section>
          <section className="contact-panel">
            <CalendarDays className="project-icon" size={28} />
            <h2>Vous préparez une visite</h2>
            <p>
              Depuis la fiche d’un bien réel, proposez un créneau. Retrouvez
              ensuite la réponse de l’équipe dans votre espace personnel.
            </p>
            <Link href="/espace/visites" className="legacy-button">
              Retrouver mes visites <ArrowRight size={16} />
            </Link>
          </section>
          <section id="professionnels" className="contact-panel">
            <BriefcaseBusiness className="project-icon" size={28} />
            <h2>Vous êtes un professionnel</h2>
            <p>
              Le back-office réunit vos dossiers, votre équipe et les demandes
              de visite. Votre responsable crée votre accès et définit vos
              permissions.
            </p>
            <Link href="/connexion" className="legacy-button">
              Accéder à mon espace <ArrowRight size={16} />
            </Link>
            <small>
              L’inscription publique crée un compte client. Les accès
              professionnels sont attribués par l’administration.
            </small>
          </section>
        </div>
        <section className="project-faq" aria-labelledby="project-questions">
          <div>
            <span className="presentation-eyebrow">Les réponses utiles</span>
            <h2 id="project-questions">Avant de commencer</h2>
            <p>
              <MapPin size={18} /> Ouagadougou, Burkina Faso
            </p>
          </div>
          <div>
            <details open>
              <summary>Comment créer mon compte ?</summary>
              <p>
                Un nom, un téléphone et un mot de passe suffisent. L’email est
                facultatif.{" "}
                <Link href="/inscription">Créer mon compte client.</Link>
              </p>
            </details>
            <details>
              <summary>Les biens présentés sont-ils disponibles ?</summary>
              <p>
                Les annonces portant la mention « Exemple fictif » illustrent le
                fonctionnement du site. Leurs photos, prix et localisations ne
                constituent pas des offres réelles.
              </p>
            </details>
            <details>
              <summary>Comment fonctionne une demande de visite ?</summary>
              <p>
                Une demande sur un bien réel est transmise à l’équipe, qui doit
                la confirmer. Sur les exemples fictifs, le formulaire simule
                uniquement cette étape.
              </p>
            </details>
            <details>
              <summary>Puis-je payer ou réserver en ligne ?</summary>
              <p>
                La réservation et le paiement en ligne ne sont pas encore
                proposés. Aucune somme n’est demandée dans le parcours de
                présentation.
              </p>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
