import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
export const metadata = { title: "Contactez-Nous | BARKA SARL" };
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="public-page shell pb-20">
        <div className="section-heading pt-8">
          <h1>Contactez-Nous</h1>
          <p>Contactez-nous pour toute demande d’information</p>
        </div>
        <div className="contact-grid">
          <section className="contact-panel">
            <h2>Informations de Contact</h2>
            <p className="flex gap-3">
              <MapPin className="text-primary" />
              Ouagadougou, Burkina Faso
            </p>
            <p className="flex gap-3">
              <Mail className="text-primary" />
              Adresse email à confirmer
            </p>
            <p className="flex gap-3">
              <Phone className="text-primary" />
              Téléphone à confirmer
            </p>
            <p className="flex gap-3">
              <Clock className="text-primary" />
              Horaires à confirmer
            </p>
          </section>
          <section className="contact-panel">
            <h2>Envoyez-nous un message</h2>
            <p>Le formulaire de contact sera activé prochainement.</p>
            <form className="auth-form">
              <div className="auth-fields-grid">
                <label className="auth-field">
                  Nom Complet
                  <input placeholder="Votre nom" autoComplete="name" />
                </label>
                <label className="auth-field">
                  Adresse Email
                  <input
                    type="email"
                    placeholder="Votre email"
                    autoComplete="email"
                  />
                </label>
              </div>
              <label className="auth-field">
                Sujet
                <input placeholder="Sujet de votre message" />
              </label>
              <label className="auth-field">
                Votre Message
                <textarea
                  rows={5}
                  placeholder="Comment pouvons-nous vous aider ?"
                  className="border border-gray-300 rounded-lg p-3"
                />
              </label>
              <button className="legacy-button gradient" type="button" disabled>
                Envoyer le Message
              </button>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
