"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
function subscribeHash(change: () => void) {
  window.addEventListener("hashchange", change);
  return () => window.removeEventListener("hashchange", change);
}
const readToken = () =>
  new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
export function RecoveryForm({
  reset = false,
  available = true,
}: {
  reset?: boolean;
  available?: boolean;
}) {
  const router = useRouter(),
    mutation = usePropertyMutation(),
    [sent, setSent] = useState(false);
  const token = useSyncExternalStore(subscribeHash, readToken, () => "");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (reset && data.get("password") !== data.get("confirm")) {
      mutation.setError("Les deux mots de passe doivent être identiques.");
      return;
    }
    const result = await mutation.run(
      `/api/v1/auth/${reset ? "reset-password" : "forgot-password"}`,
      "POST",
      reset
        ? { token, password: data.get("password") }
        : { email: data.get("email") },
    );
    if (result) {
      if (reset) {
        window.history.replaceState(null, "", "/reinitialiser-mot-de-passe");
        router.replace("/connexion?passwordChanged=1");
        router.refresh();
      } else setSent(true);
    }
  }
  if (!available)
    return (
      <div className="account-notice" role="status">
        <p>
          La récupération par email sera disponible après activation du service
          d’envoi. Pour retrouver votre accès dès maintenant, demandez une
          réinitialisation à votre responsable.
        </p>
        <Link href="/connexion" className="text-link">
          Retour à la connexion
        </Link>
      </div>
    );
  if (sent)
    return (
      <div className="visit-success" role="status">
        <h2>Consultez votre messagerie</h2>
        <p>
          Si un compte actif est associé à cette adresse, un lien valable 15
          minutes vous sera envoyé. Vérifiez aussi les courriers indésirables.
        </p>
        <Link href="/connexion" className="text-link">
          Retour à la connexion
        </Link>
      </div>
    );
  return (
    <form className="auth-form" onSubmit={submit}>
      {reset ? (
        <>
          {!token && (
            <p className="form-error">
              Ouvrez le lien complet reçu par email pour choisir un nouveau mot
              de passe.
            </p>
          )}
          <label className="auth-field">
            Nouveau mot de passe
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </label>
          <label className="auth-field">
            Confirmer le mot de passe
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </label>
          <p className="field-hint">
            Au moins 12 caractères. Vos sessions seront fermées après la
            modification.
          </p>
        </>
      ) : (
        <>
          <label className="auth-field">
            Adresse email du compte
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <p className="field-hint">
            Si votre compte ne possède pas d’email, contactez votre responsable
            pour récupérer votre accès.
          </p>
        </>
      )}
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
      <button
        className="legacy-button"
        disabled={mutation.busy || (reset && !token)}
      >
        {mutation.busy
          ? "Traitement…"
          : reset
            ? "Enregistrer mon mot de passe"
            : "Recevoir le lien de récupération"}
      </button>
    </form>
  );
}
