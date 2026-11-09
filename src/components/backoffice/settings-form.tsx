"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePropertyMutation } from "@/components/properties/api";
export function SettingsForm({
  settings,
}: {
  settings: { revalidationDays: number; expectedUpdatedAt: string | null };
}) {
  const mutation = usePropertyMutation(),
    router = useRouter(),
    [saved, setSaved] = useState(false);
  return (
    <form
      className="property-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaved(false);
        const form = new FormData(event.currentTarget);
        if (
          await mutation.run("/api/v1/admin/settings", "PATCH", {
            revalidationDays: Number(form.get("days")),
            expectedUpdatedAt: settings.expectedUpdatedAt,
          })
        ) {
          setSaved(true);
          router.refresh();
        }
      }}
    >
      <label className="property-field">
        Durée de validation des annonces (jours)
        <input
          name="days"
          type="number"
          min={1}
          max={90}
          required
          defaultValue={settings.revalidationDays}
        />
      </label>
      <p className="account-note">
        Ce délai s’applique aux prochaines publications de votre société. Il ne
        prolonge pas les annonces déjà publiées.
      </p>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      {saved && (
        <p className="team-success" role="status">
          Paramètre enregistré.
        </p>
      )}
      <button className="team-primary-button" disabled={mutation.busy}>
        Enregistrer les paramètres
      </button>
    </form>
  );
}
