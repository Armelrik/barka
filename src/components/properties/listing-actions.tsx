"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitions } from "@/modules/listings/policy";
import { statusLabels, listingActions } from "@/modules/listings/validation";
import type { ListingDto } from "@/modules/listings/service";
import { usePropertyMutation } from "./api";
const labels = {
  SUBMIT: "Soumettre à validation",
  REVIEW: "Commencer la vérification",
  APPROVE: "Approuver le dossier",
  PUBLISH: "Publier l’annonce",
  REJECT: "Renvoyer en brouillon",
  SUSPEND: "Suspendre la publication",
  ARCHIVE: "Archiver le dossier",
};
export function ListingActions({
  listing,
  canModerate,
}: {
  listing: ListingDto;
  canModerate: boolean;
}) {
  const router = useRouter(),
    mutation = usePropertyMutation(),
    [reason, setReason] = useState("");
  const actions = listingActions.filter(
    (a) =>
      transitions[a].includes(listing.status) &&
      (canModerate || a === "SUBMIT" || a === "ARCHIVE"),
  );
  async function run(action: string) {
    if (
      await mutation.run(`/api/v1/properties/${listing.id}/actions`, "POST", {
        action,
        expectedUpdatedAt: listing.updatedAt,
        reason,
      })
    )
      router.refresh();
  }
  return (
    <section className="property-panel">
      <h2>Validation et publication</h2>
      <span className={`listing-state listing-state-${listing.status}`}>
        {statusLabels[listing.status]}
      </span>
      <p>
        Profil du commercial :{" "}
        {listing.verification === "VERIFIED"
          ? "identité vérifiée"
          : "vérification requise"}
        . La publication exige une photographie et un document foncier. Un
        modérateur ne peut pas valider sa propre annonce.
      </p>
      {listing.expiresAt && (
        <p>
          Revalidation avant le{" "}
          {new Date(listing.expiresAt).toLocaleDateString("fr-FR", {
            timeZone: "Europe/Paris",
          })}
          .
        </p>
      )}
      {actions.length > 0 && (
        <>
          <label className="property-field">
            Motif ou commentaire
            <textarea
              value={reason}
              maxLength={1000}
              rows={3}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="listing-action-buttons">
            {actions.map((a) => (
              <button
                type="button"
                key={a}
                className={
                  a === "PUBLISH"
                    ? "team-primary-button"
                    : "team-secondary-button"
                }
                disabled={mutation.busy}
                onClick={() => run(a)}
              >
                {labels[a]}
              </button>
            ))}
          </div>
        </>
      )}
      {mutation.error && (
        <p role="alert" className="auth-message">
          {mutation.error}
        </p>
      )}
      {listing.validations.length > 0 && (
        <details>
          <summary>Historique de validation</summary>
          <ol className="audit-list">
            {listing.validations.map((v) => (
              <li key={v.id}>
                <strong>
                  {v.action} — {v.actorName}
                </strong>
                <p>{v.reason}</p>
                <small>
                  {new Date(v.createdAt).toLocaleString("fr-FR", {
                    timeZone: "Europe/Paris",
                  })}
                </small>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
