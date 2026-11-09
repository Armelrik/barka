"use client";
import {
  mediaLimitMb,
  hostedMediaRelay,
  uploadSizeError,
} from "@/modules/media/limits";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText, Box } from "lucide-react";
import type { ListingDto } from "@/modules/listings/service";
import { usePropertyMutation } from "./api";
export function MediaEditor({ listing }: { listing: ListingDto }) {
  const router = useRouter(),
    mutation = usePropertyMutation();
  const [kind, setKind] = useState("PHOTO");
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const selected = new FormData(form).get("file");
    const error =
      selected instanceof File ? uploadSizeError(selected, kind) : "";
    if (error) {
      mutation.setError(error);
      return;
    }
    const result = await mutation.run(
      `/api/v1/properties/${listing.id}/media`,
      "POST",
      new FormData(form),
    );
    if (result) {
      form.reset();
      router.refresh();
    }
  }
  async function remove(id: string) {
    if (
      await mutation.run(
        `/api/v1/properties/${listing.id}/media?assetId=${id}`,
        "DELETE",
      )
    )
      router.refresh();
  }
  return (
    <section className="property-panel">
      <h2>Photographies, plans et documents</h2>
      <p>
        Images JPEG, PNG ou WebP : {mediaLimitMb("PHOTO")} Mo maximum. Panoramas
        2:1 de 2048 à 8192 px. Modèles GLB autonomes :{" "}
        {mediaLimitMb("MODEL_3D")} Mo maximum. Les documents fonciers restent
        privés.{" "}
        {hostedMediaRelay() &&
          "Les fichiers volumineux nécessitent une version allégée pour cet hébergement."}
      </p>
      <form className="media-upload" onSubmit={upload}>
        <label className="property-field">
          Usage du fichier
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="PHOTO">Photographie</option>
            <option value="PANORAMA">Panorama 360°</option>
            <option value="MODEL_3D">Modèle 3D GLB</option>
            <option value="FLOOR_PLAN">Plan du bien</option>
            <option value="LEGAL_DOCUMENT">Document foncier (image)</option>
          </select>
        </label>
        <label className="property-field">
          Fichier
          <input
            type="file"
            name="file"
            accept={
              kind === "MODEL_3D" ? ".glb" : "image/jpeg,image/png,image/webp"
            }
            required
          />
        </label>
        <label className="property-field">
          Légende
          <input
            name="alt"
            maxLength={160}
            placeholder="Salon, façade, plan…"
          />
        </label>
        <button
          className="team-primary-button"
          disabled={mutation.busy || listing.status === "ARCHIVED"}
        >
          <Upload size={18} />
          {mutation.busy ? "Traitement…" : "Ajouter le fichier"}
        </button>
      </form>
      {mutation.error && (
        <p role="alert" className="auth-message">
          {mutation.error}
        </p>
      )}
      <div className="asset-grid">
        {[
          ...listing.media,
          ...listing.documents.map((d) => ({
            ...d,
            kind: "LEGAL_DOCUMENT",
            alt: "Document foncier privé",
            width: null,
            height: null,
          })),
        ].map((asset) => (
          <div className="asset-card" key={asset.id}>
            {asset.kind === "MODEL_3D" ? (
              <div className="asset-placeholder">
                <Box />
                Modèle GLB
              </div>
            ) : asset.kind === "LEGAL_DOCUMENT" ? (
              <div className="asset-placeholder">
                <FileText />
                Document privé
              </div>
            ) : (
              <Image
                src={asset.url}
                alt={asset.alt}
                width={240}
                height={140}
                unoptimized
              />
            )}
            <strong>{asset.alt || asset.kind}</strong>
            <small>{asset.kind}</small>
            <div>
              <a href={asset.url} target="_blank" rel="noreferrer">
                Consulter
              </a>
              <button
                type="button"
                aria-label={`Supprimer ${asset.alt || asset.kind}`}
                disabled={mutation.busy || listing.status === "ARCHIVED"}
                onClick={() => remove(asset.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
