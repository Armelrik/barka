"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { usePropertyMutation } from "@/components/properties/api";
import { formatVisitDate, validVisitDate } from "@/modules/visits/validation";
export function VisitRequestForm({
  slug,
  demo = false,
}: {
  slug: string;
  demo?: boolean;
}) {
  const mutation = usePropertyMutation();
  const [sent, setSent] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      desired = String(form.get("desiredAt"));
    const date = new Date(`${desired}:00Z`);
    if (!validVisitDate(date)) {
      mutation.setError(
        "Choisissez un horaire entre 30 minutes et 90 jours à partir de maintenant.",
      );
      return;
    }
    mutation.setError("");
    if (demo) {
      setSent(date.toISOString());
      return;
    }
    const result = await mutation.run<{ visit: { desiredAt: string } }>(
      "/api/v1/visits",
      "POST",
      {
        slug,
        desiredAt: date.toISOString(),
        message: String(form.get("message") || ""),
      },
    );
    if (result) setSent(result.visit.desiredAt);
  }
  return (
    <section className="visit-request" aria-label="Demander une visite">
      <h2>
        <CalendarDays size={20} /> Organiser une visite
      </h2>
      {demo && (
        <p className="visit-demo-note">
          Démonstration : ce bien est fictif. Le formulaire simule une demande
          sans l’envoyer.
        </p>
      )}
      {sent ? (
        <div className="visit-success" role="status">
          <CheckCircle2 size={22} />
          <strong>
            {demo ? "Simulation terminée" : "Votre demande a été enregistrée"}
          </strong>
          <p>{formatVisitDate(sent)} (heure du Burkina Faso).</p>
          <p>
            {demo
              ? "Aucun rendez-vous n’a été créé."
              : "Ce créneau reste à confirmer par l’équipe. Consultez la réponse dans votre espace."}
          </p>
          {demo ? (
            <button
              type="button"
              className="text-link"
              onClick={() => setSent("")}
            >
              Essayer un autre horaire
            </button>
          ) : (
            <Link className="text-link" href="/espace/visites">
              Suivre ma demande
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="property-field">
            Jour et heure souhaités
            <input
              name="desiredAt"
              type="datetime-local"
              required
              aria-describedby={`visit-time-${slug}`}
            />
          </label>
          <p id={`visit-time-${slug}`} className="visit-time-note">
            Heure du Burkina Faso (UTC). Entre 30 minutes et 90 jours à
            l’avance. Durée indicative : une heure.
          </p>
          <label className="property-field">
            Votre message (facultatif)
            <textarea
              name="message"
              rows={3}
              maxLength={1000}
              placeholder="Précisez votre projet ou vos besoins pour la visite."
            />
          </label>
          {mutation.error && (
            <p className="form-error" role="alert">
              {mutation.error}{" "}
              {!demo && /connectez-vous/i.test(mutation.error) && (
                <Link href="/connexion">Se connecter</Link>
              )}
            </p>
          )}
          <button
            className="legacy-button gradient w-full"
            disabled={mutation.busy}
            type="submit"
          >
            {mutation.busy
              ? "Envoi en cours…"
              : demo
                ? "Simuler une demande"
                : "Demander ce créneau"}
          </button>
          {!demo && (
            <p className="visit-time-note">
              Votre demande sera envoyée depuis votre compte.{" "}
              <Link href="/espace/visites">Mes visites</Link>
            </p>
          )}
        </form>
      )}
    </section>
  );
}
