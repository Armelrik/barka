"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
export function FavoriteButton({
  slug,
  title,
  saved: initial,
  authenticated,
}: {
  slug: string;
  title: string;
  saved: boolean;
  authenticated: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    mutation = usePropertyMutation(),
    router = useRouter();
  if (!authenticated)
    return (
      <Link
        className="account-favorite"
        href="/connexion"
        aria-label={`Se connecter pour enregistrer : ${title}`}
      >
        <Heart size={18} /> Enregistrer
      </Link>
    );
  return (
    <div>
      <button
        className="account-favorite"
        type="button"
        aria-pressed={saved}
        aria-label={`${saved ? "Retirer des" : "Ajouter aux"} favoris : ${title}`}
        disabled={mutation.busy}
        onClick={async () => {
          const next = !saved;
          if (
            await mutation.run("/api/v1/favorites", "PUT", {
              slug,
              saved: next,
            })
          ) {
            setSaved(next);
            router.refresh();
          }
        }}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
        {saved ? "Enregistré" : "Enregistrer"}
      </button>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error}
        </p>
      )}
    </div>
  );
}
