"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      router.replace("/connexion");
      router.refresh();
    } catch {
      setError("La déconnexion a échoué. Réessayez.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="logout-button"
      >
        <LogOut size={17} />
        {busy ? "Déconnexion…" : "Me déconnecter"}
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
