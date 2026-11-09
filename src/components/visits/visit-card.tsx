"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { usePropertyMutation } from "@/components/properties/api";
import type { VisitDto } from "@/modules/visits/service";
import {
  formatVisitDate,
  visitStatusLabels,
  visitTransition,
} from "@/modules/visits/validation";
const labels = {
  CONFIRM: "Confirmer le créneau",
  REJECT: "Refuser la demande",
  CANCEL: "Annuler la visite",
  COMPLETE: "Marquer comme effectuée",
} as const;
export function VisitCard({ visit, team }: { visit: VisitDto; team: boolean }) {
  const mutation = usePropertyMutation(),
    router = useRouter();
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const actions = (Object.keys(labels) as (keyof typeof labels)[]).filter(
    (action) =>
      visitTransition(
        visit.status,
        action,
        visit.own || !team,
        new Date(visit.desiredAt),
      ),
  );
  async function act(action: keyof typeof labels) {
    const result = await mutation.run<{ visit: VisitDto }>(
      `/api/v1/visits/${visit.id}`,
      "PATCH",
      { action, expectedUpdatedAt: visit.updatedAt, reply },
    );
    if (result) {
      setNotice("La demande a été mise à jour.");
      setReply("");
      router.refresh();
    }
  }
  return (
    <article className="visit-card">
      <div className="visit-card-heading">
        <div>
          <span className="visit-reference">{visit.reference}</span>
          <h2>
            <Link href={`/biens/${visit.slug}`}>{visit.title}</Link>
          </h2>
        </div>
        <span
          className={`visit-status visit-status-${visit.status.toLowerCase()}`}
        >
          {visitStatusLabels[visit.status]}
        </span>
      </div>
      <p className="visit-date">
        <CalendarDays size={19} />
        {formatVisitDate(visit.desiredAt)}
      </p>
      <p className="visit-time-note">
        Heure du Burkina Faso · créneau d’une heure
      </p>
      {team && (
        <p>
          <strong>Demande de :</strong> {visit.requester}
          {visit.own ? " (vous)" : ""}
        </p>
      )}
      {visit.message && (
        <p className="visit-message">
          <strong>Message :</strong> {visit.message}
        </p>
      )}
      {visit.reply && (
        <p className="visit-reply">
          <strong>Réponse de l’équipe :</strong> {visit.reply}
        </p>
      )}
      {visit.status === "REQUESTED" && (
        <p className="visit-time-note">
          Horaire proposé, en attente de confirmation de l’équipe.
        </p>
      )}
      {actions.length > 0 && (
        <div className="visit-actions">
          {team && !visit.own && (
            <label className="property-field">
              Réponse au client
              <textarea
                maxLength={1000}
                rows={2}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Motif obligatoire en cas de refus ou d’annulation."
              />
            </label>
          )}
          <div className="visit-action-buttons">
            {actions.map((action) => (
              <button
                type="button"
                key={action}
                disabled={mutation.busy}
                className={
                  action === "CONFIRM"
                    ? "team-primary-button"
                    : "team-secondary-button"
                }
                onClick={() => act(action)}
              >
                {labels[action]}
              </button>
            ))}
          </div>
        </div>
      )}
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      {notice && (
        <p className="visit-success" role="status">
          {notice}
        </p>
      )}
    </article>
  );
}
