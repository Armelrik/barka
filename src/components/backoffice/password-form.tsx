"use client";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
export function PasswordForm() {
  const mutation = usePropertyMutation(),
    router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      newPassword = String(form.get("newPassword"));
    if (newPassword !== form.get("confirmation")) {
      mutation.setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    const result = await mutation.run("/api/v1/auth/password", "POST", {
      currentPassword: form.get("currentPassword"),
      newPassword,
    });
    if (result) {
      router.replace("/connexion?passwordChanged=1");
      router.refresh();
    }
  }
  return (
    <form className="property-form" onSubmit={submit}>
      <label className="property-field">
        Mot de passe actuel
        <input
          name="currentPassword"
          type="password"
          required
          maxLength={72}
          autoComplete="current-password"
        />
      </label>
      <label className="property-field">
        Nouveau mot de passe
        <input
          name="newPassword"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <label className="property-field">
        Confirmer le nouveau mot de passe
        <input
          name="confirmation"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <p className="account-note">
        Au moins 12 caractères. Après modification, toutes vos sessions seront
        fermées et vous devrez vous reconnecter.
      </p>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      <button className="team-primary-button" disabled={mutation.busy}>
        {mutation.busy ? "Modification…" : "Modifier mon mot de passe"}
      </button>
    </form>
  );
}

export function MemberPasswordReset({
  id,
  updatedAt,
}: {
  id: string;
  updatedAt: string;
}) {
  const mutation = usePropertyMutation(),
    router = useRouter();
  return (
    <form
      className="property-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget,
          data = new FormData(form);
        if (data.get("password") !== data.get("confirm")) {
          mutation.setError("Les mots de passe ne correspondent pas.");
          return;
        }
        if (
          await mutation.run(`/api/v1/users/${id}/password`, "POST", {
            password: data.get("password"),
            expectedUpdatedAt: updatedAt,
          })
        ) {
          form.reset();
          router.replace(`/espace/equipe/${id}?saved=1`);
          router.refresh();
        }
      }}
    >
      <label className="property-field">
        Nouveau mot de passe du membre
        <input
          type="password"
          name="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <label className="property-field">
        Confirmer le mot de passe du membre
        <input
          type="password"
          name="confirm"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <p className="account-note">
        Les sessions de ce membre seront révoquées. Communiquez-lui le nouveau
        mot de passe par un canal privé ; aucun email ni SMS n’est envoyé
        automatiquement.
      </p>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      <button className="team-secondary-button" disabled={mutation.busy}>
        Réinitialiser le mot de passe du membre
      </button>
    </form>
  );
}
