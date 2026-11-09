"use client";
import {
  mediaLimitMb,
  hostedMediaRelay,
  uploadSizeError,
} from "@/modules/media/limits";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { usePropertyMutation } from "./api";
type Review = {
  userId: string;
  identifier: string;
  updatedAt: string;
  identityAssetId: string | null;
  user: { firstName: string; lastName: string };
};
export function IdentityPanel({
  own,
  queue,
}: {
  own: {
    identifier: string;
    verification: string;
    identityAssetId: string | null;
  } | null;
  queue: Review[];
}) {
  const router = useRouter(),
    mutation = usePropertyMutation(),
    [reasons, setReasons] = useState<Record<string, string>>({});
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const selected = new FormData(form).get("file");
    const error =
      selected instanceof File ? uploadSizeError(selected, "IDENTITY") : "";
    if (error) {
      mutation.setError(error);
      return;
    }
    if (await mutation.run("/api/v1/identity", "POST", new FormData(form))) {
      form.reset();
      router.refresh();
    }
  }
  async function review(row: Review, approve: boolean) {
    if (
      await mutation.run(`/api/v1/identity/${row.userId}`, "PATCH", {
        approve,
        reason: reasons[row.userId] ?? "",
        expectedUpdatedAt: row.updatedAt,
      })
    )
      router.refresh();
  }
  return (
    <>
      {own && (
        <section className="property-panel">
          <h2>Mon profil démarcheur</h2>
          <p>
            {own.identifier} · État : {own.verification}
          </p>
          <p>
            Transmettez une photographie lisible de votre CNIB ou passeport. Ce
            document reste privé. Un remplacement impose une nouvelle
            vérification et suspend les annonces déjà approuvées ou publiées.
            Taille maximale : {mediaLimitMb("IDENTITY")} Mo.{" "}
            {hostedMediaRelay() &&
              "Réduisez la taille de la photo avant l’envoi si nécessaire."}
          </p>
          <form onSubmit={upload} className="media-upload">
            <input type="hidden" name="kind" value="IDENTITY" />
            <label className="property-field">
              Pièce d’identité
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>
            <button className="team-primary-button" disabled={mutation.busy}>
              {mutation.busy ? "Traitement…" : "Soumettre mon identité"}
            </button>
          </form>
          {own.identityAssetId && (
            <a
              className="text-link"
              href={`/api/v1/media/${own.identityAssetId}`}
              target="_blank"
              rel="noreferrer"
            >
              Consulter mon document privé
            </a>
          )}
        </section>
      )}
      {queue.length > 0 && (
        <section className="property-panel">
          <h2>Profils en attente de vérification</h2>
          <p>
            Chaque consultation est journalisée. Vérifiez réellement les pièces
            avant d’approuver.
          </p>
          <div className="identity-queue">
            {queue.map((row) => (
              <article key={row.userId}>
                <h3>
                  {row.user.firstName} {row.user.lastName}
                </h3>
                <small>{row.identifier}</small>
                {row.identityAssetId && (
                  <a
                    href={`/api/v1/media/${row.identityAssetId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src={`/api/v1/media/${row.identityAssetId}`}
                      alt="Document d’identité privé à examiner"
                      width={360}
                      height={220}
                      unoptimized
                    />
                  </a>
                )}
                <label className="property-field">
                  Compte rendu de vérification
                  <textarea
                    value={reasons[row.userId] ?? ""}
                    maxLength={500}
                    minLength={5}
                    onChange={(e) =>
                      setReasons((old) => ({
                        ...old,
                        [row.userId]: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="listing-action-buttons">
                  <button
                    className="team-primary-button"
                    disabled={mutation.busy}
                    onClick={() => review(row, true)}
                  >
                    Approuver l’identité
                  </button>
                  <button
                    className="team-secondary-button"
                    disabled={mutation.busy}
                    onClick={() => review(row, false)}
                  >
                    Refuser la pièce
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {!own && !queue.length && (
        <p className="team-empty">
          Aucune vérification en attente dans votre périmètre.
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="auth-message">
          {mutation.error}
        </p>
      )}
    </>
  );
}
