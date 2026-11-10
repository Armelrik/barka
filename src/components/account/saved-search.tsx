"use client";
import type { CatalogFilters } from "@/modules/catalog/query";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
export function SaveSearch({ filters }: { filters: CatalogFilters }) {
  const mutation = usePropertyMutation(),
    [saved, setSaved] = useState(false);
  return (
    <details className="saved-search-form">
      <summary>Enregistrer cette recherche</summary>
      {saved ? (
        <p role="status">
          Recherche enregistrée.{" "}
          <Link href="/espace/recherches" className="text-link">
            Mes recherches
          </Link>
        </p>
      ) : (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await mutation.run("/api/v1/searches", "POST", {
                name: new FormData(e.currentTarget).get("name"),
                filters,
              })
            )
              setSaved(true);
          }}
        >
          <label className="auth-field">
            Nom de la recherche
            <input
              name="name"
              minLength={2}
              maxLength={80}
              required
              defaultValue={filters.location || "Mon projet immobilier"}
            />
          </label>
          <button className="legacy-button" disabled={mutation.busy}>
            Enregistrer
          </button>
          {mutation.error && (
            <p className="form-error" role="alert">
              {mutation.error}
            </p>
          )}
        </form>
      )}
    </details>
  );
}
export function RemoveSearch({ id }: { id: string }) {
  const mutation = usePropertyMutation(),
    router = useRouter();
  return (
    <>
      <button
        type="button"
        className="text-link"
        disabled={mutation.busy}
        onClick={async () => {
          if (await mutation.run(`/api/v1/searches/${id}`, "DELETE"))
            router.refresh();
        }}
      >
        Supprimer cette recherche
      </button>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
    </>
  );
}
