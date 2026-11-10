"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
type Item = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};
export function NotificationCenter({
  initialEmail,
  configured,
}: {
  initialEmail: boolean;
  configured: boolean;
}) {
  const router = useRouter();
  const mutation = usePropertyMutation(),
    [items, setItems] = useState<Item[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [unread, setUnread] = useState(0),
    [email, setEmail] = useState(initialEmail),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const r = await fetch(`/api/v1/notifications?page=${page}`, {
          signal: controller.signal,
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setItems(data.items);
        setTotal(data.total);
        setUnread(data.unread);
        setError("");
        setLoaded(true);
      } catch {
        if (!controller.signal.aborted)
          setError("Impossible de charger les notifications. Réessayez.");
      }
    }
    void load();
    const interval = setInterval(load, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [page, refresh]);
  return (
    <>
      <section className="property-panel">
        <h2>Vos préférences</h2>
        <label className="notification-preference">
          <input
            type="checkbox"
            checked={email}
            disabled={mutation.busy}
            onChange={async (e) => {
              const next = e.target.checked;
              if (
                await mutation.run("/api/v1/notifications", "PATCH", {
                  action: "preferences",
                  emailNotifications: next,
                })
              )
                setEmail(next);
            }}
          />
          Recevoir aussi les informations de visite par email
        </label>
        <p className="field-hint">
          Les notifications restent toujours disponibles dans votre compte.{" "}
          {configured
            ? "L’envoi par email nécessite une adresse renseignée sur le compte."
            : "L’envoi par email sera activé une fois le service d’expédition configuré."}
        </p>
      </section>
      <div className="catalog-toolbar">
        <p>
          {unread} notification{unread > 1 ? "s" : ""} non lue
          {unread > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          className="text-link"
          disabled={mutation.busy || !unread}
          onClick={async () => {
            if (
              await mutation.run("/api/v1/notifications", "PATCH", {
                action: "read",
              })
            ) {
              setRefresh((v) => v + 1);
              router.refresh();
            }
          }}
        >
          Tout marquer comme lu
        </button>
      </div>
      {(error || mutation.error) && (
        <p className="form-error" role="alert">
          {error || mutation.error}
        </p>
      )}
      {!loaded && !error && <p role="status">Chargement des notifications…</p>}
      {loaded && !items.length && (
        <div className="empty-state">
          Vous êtes à jour. Les nouvelles informations de visite apparaîtront
          ici.
        </div>
      )}
      <div className="notification-list">
        {items.map((item) => (
          <article
            className={`property-panel ${item.readAt ? "" : "notification-unread"}`}
            key={item.id}
          >
            <time dateTime={item.createdAt}>
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Africa/Ouagadougou",
              }).format(new Date(item.createdAt))}
            </time>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <Link className="text-link" href={item.href}>
              Voir mes visites
            </Link>
            {!item.readAt && (
              <button
                className="text-link"
                type="button"
                disabled={mutation.busy}
                onClick={async () => {
                  if (
                    await mutation.run("/api/v1/notifications", "PATCH", {
                      action: "read",
                      id: item.id,
                    })
                  ) {
                    setRefresh((v) => v + 1);
                    router.refresh();
                  }
                }}
              >
                Marquer comme lu
              </button>
            )}
          </article>
        ))}
      </div>
      <nav className="team-pagination" aria-label="Pages de notifications">
        <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
          Précédente
        </button>
        <span>
          Page {page} sur {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          disabled={page * 20 >= total}
          onClick={() => setPage((v) => v + 1)}
        >
          Suivante
        </button>
      </nav>
    </>
  );
}
