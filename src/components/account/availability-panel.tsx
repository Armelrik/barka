"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
import { formatVisitDate } from "@/modules/visits/validation";
type Agent = {
  id: string;
  name: string;
  enabled: boolean;
  slots: { id: string; startsAt: string; endsAt: string }[];
};
export function AvailabilityPanel({ agents }: { agents: Agent[] }) {
  const [selected, setSelected] = useState(agents[0]?.id ?? ""),
    mutation = usePropertyMutation(),
    router = useRouter();
  const agent = agents.find((a) => a.id === selected);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      values = new FormData(form);
    const result = await mutation.run("/api/v1/availability", "POST", {
      agentId: selected,
      startsAt: `${values.get("startsAt")}:00Z`,
      endsAt: `${values.get("endsAt")}:00Z`,
    });
    if (result) {
      form.reset();
      router.refresh();
    }
  }
  if (!agents.length)
    return (
      <div className="empty-state">
        Aucun commercial actif dans votre périmètre. Créez ou rattachez un
        commercial depuis votre équipe pour gérer son agenda.
      </div>
    );
  return (
    <>
      <section className="property-panel">
        <label className="property-field">
          Commercial
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {agents.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        {agent && (
          <>
            <p>
              {agent.enabled
                ? "Agenda activé : seules les plages publiées permettent une demande de visite."
                : "Agenda non activé : les clients proposent un horaire, à confirmer par l’équipe."}
            </p>
            <button
              type="button"
              className="text-link"
              disabled={mutation.busy}
              onClick={async () => {
                if (
                  await mutation.run("/api/v1/availability", "PATCH", {
                    agentId: selected,
                    enabled: !agent.enabled,
                  })
                )
                  router.refresh();
              }}
            >
              {agent.enabled
                ? "Revenir aux horaires sur demande"
                : "Activer l’agenda"}
            </button>
          </>
        )}
      </section>
      <section className="property-panel">
        <h2>Ouvrir une plage de disponibilité</h2>
        <p>
          Heure du Burkina Faso (UTC). Plage de 1 à 12 heures, au maximum 90
          jours à l’avance. Chaque visite dure une heure.
        </p>
        <form onSubmit={submit} className="auth-form">
          <div className="auth-fields-grid">
            <label className="auth-field">
              Début
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label className="auth-field">
              Fin
              <input name="endsAt" type="datetime-local" required />
            </label>
          </div>
          <button className="legacy-button" disabled={mutation.busy}>
            Ajouter la disponibilité
          </button>
        </form>
      </section>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      <section className="property-panel">
        <h2>Disponibilités à venir</h2>
        {agent?.slots.length ? (
          <ul className="availability-list">
            {agent.slots.map((slot) => (
              <li key={slot.id}>
                <span>
                  {formatVisitDate(slot.startsAt)} →{" "}
                  {formatVisitDate(slot.endsAt)}
                </span>
                <button
                  type="button"
                  className="text-link"
                  disabled={mutation.busy}
                  onClick={async () => {
                    if (
                      await mutation.run(
                        `/api/v1/availability/${slot.id}`,
                        "DELETE",
                      )
                    )
                      router.refresh();
                  }}
                >
                  Retirer cette plage
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Aucune plage à venir.{" "}
            {agent?.enabled
              ? "Ajoutez une disponibilité pour permettre aux clients de proposer une visite."
              : "Vous pouvez continuer à recevoir des propositions libres."}
          </p>
        )}
      </section>
    </>
  );
}
