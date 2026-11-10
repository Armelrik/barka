"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePropertyMutation } from "@/components/properties/api";
import {
  adImagePresets,
  placementLabels,
} from "@/modules/advertising/validation";
import type { manageAds } from "@/modules/advertising/service";
type Data = Awaited<ReturnType<typeof manageAds>>;
function initial(now: string) {
  return {
    title: "",
    description: "",
    sponsorName: "BARKA",
    campaignKind: "HOUSE",
    placement: "HERO",
    targetUrl: "/biens",
    imagePath: "/afriloc/ad-banner.jpg",
    creativeId: "",
    cta: "Découvrir",
    priority: "0",
    startsAt: now.slice(0, 16),
    endsAt: new Date(Date.parse(now) + 30 * 86400000)
      .toISOString()
      .slice(0, 16),
    active: false,
  };
}
function fields(row: Data["items"][number]) {
  return {
    title: row.title,
    description: row.description,
    sponsorName: row.sponsorName,
    campaignKind: row.campaignKind,
    placement: row.placement,
    targetUrl: row.targetUrl || "/biens",
    imagePath: row.imagePath,
    creativeId: row.creativeId || "",
    cta: row.cta,
    priority: String(row.priority),
    startsAt: row.startsAt.slice(0, 16),
    endsAt: row.endsAt.slice(0, 16),
    active: row.active,
  };
}
export function CampaignManager({ data }: { data: Data }) {
  const router = useRouter(),
    mutation = usePropertyMutation(),
    [form, setForm] = useState(() => initial(data.now)),
    [editing, setEditing] = useState<{ id: string; version: string } | null>(
      null,
    ),
    [message, setMessage] = useState(""),
    [creatives, setCreatives] = useState(data.creatives);
  const set = (name: string, value: string | boolean) =>
    setForm((old) => ({ ...old, [name]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      creativeId: form.creativeId || null,
      priority: Number(form.priority),
      startsAt: `${form.startsAt}:00Z`,
      endsAt: `${form.endsAt}:00Z`,
      ...(editing ? { expectedUpdatedAt: editing.version } : {}),
    };
    if (
      await mutation.run(
        editing
          ? `/api/v1/admin/advertisements/${editing.id}`
          : "/api/v1/admin/advertisements",
        editing ? "PATCH" : "POST",
        payload,
      )
    ) {
      setMessage(editing ? "Campagne mise à jour." : "Campagne créée.");
      setEditing(null);
      setForm(initial(new Date().toISOString()));
      router.refresh();
    }
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || file.size > 4 * 1024 * 1024) {
      mutation.setError("Choisissez une image de 4 Mo maximum.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("kind", "PHOTO");
    body.set("alt", "Visuel publicitaire");
    const result = await mutation.run<{ id: string; url: string }>(
      "/api/v1/admin/advertisements/creatives",
      "POST",
      body,
    );
    if (result) {
      setCreatives((old) => [{ id: result.id, width: 0, height: 0 }, ...old]);
      set("creativeId", result.id);
      setMessage("Visuel ajouté à la bibliothèque.");
    }
  }
  return (
    <>
      <div className="ad-admin-grid">
        <section className="property-panel">
          <h2>{editing ? "Modifier la campagne" : "Nouvelle campagne"}</h2>
          <form className="auth-form" onSubmit={save}>
            <label className="auth-field">
              Titre de la publicité
              <input
                value={form.title}
                maxLength={120}
                minLength={3}
                required
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <label className="auth-field">
              Description
              <textarea
                value={form.description}
                maxLength={300}
                rows={3}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <div className="auth-fields-grid">
              <label className="auth-field">
                Annonceur
                <input
                  value={form.sponsorName}
                  minLength={2}
                  maxLength={100}
                  required
                  onChange={(e) => set("sponsorName", e.target.value)}
                />
              </label>
              <label className="auth-field">
                Nature de la campagne
                <select
                  value={form.campaignKind}
                  onChange={(e) => set("campaignKind", e.target.value)}
                >
                  <option value="HOUSE">Autopromotion BARKA</option>
                  <option value="SPONSORED">Publicité sponsorisée</option>
                </select>
              </label>
            </div>
            <label className="auth-field">
              Emplacement
              <select
                value={form.placement}
                onChange={(e) => set("placement", e.target.value)}
              >
                {Object.entries(placementLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field">
              Lien de destination
              <input
                value={form.targetUrl}
                maxLength={2000}
                required
                onChange={(e) => set("targetUrl", e.target.value)}
                placeholder="/biens ou https://..."
              />
            </label>
            <div className="auth-fields-grid">
              <label className="auth-field">
                Texte du bouton
                <input
                  value={form.cta}
                  minLength={2}
                  maxLength={35}
                  required
                  onChange={(e) => set("cta", e.target.value)}
                />
              </label>
              <label className="auth-field">
                Priorité (0 à 100)
                <input
                  value={form.priority}
                  type="number"
                  min={0}
                  max={100}
                  onChange={(e) => set("priority", e.target.value)}
                />
              </label>
            </div>
            <div className="auth-fields-grid">
              <label className="auth-field">
                Début de diffusion
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  required
                  onChange={(e) => set("startsAt", e.target.value)}
                />
              </label>
              <label className="auth-field">
                Fin de diffusion
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  required
                  onChange={(e) => set("endsAt", e.target.value)}
                />
              </label>
            </div>
            <p className="field-hint">
              Heure du Burkina Faso (UTC). La campagne s’arrête automatiquement
              à la date de fin.
            </p>
            <label className="auth-field">
              Image de la bibliothèque
              <select
                value={
                  form.creativeId
                    ? `creative:${form.creativeId}`
                    : form.imagePath
                }
                onChange={(e) => {
                  if (e.target.value.startsWith("creative:"))
                    set("creativeId", e.target.value.slice(9));
                  else {
                    set("creativeId", "");
                    set("imagePath", e.target.value);
                  }
                }}
              >
                {adImagePresets.map((path) => (
                  <option key={path} value={path}>
                    {path.split("/").at(-1)}
                  </option>
                ))}
                {creatives.map((c, i) => (
                  <option key={c.id} value={`creative:${c.id}`}>
                    Visuel importé {i + 1}
                    {c.width ? ` · ${c.width} × ${c.height}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="notification-preference">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />{" "}
              Activer la diffusion sur la période choisie
            </label>
            {mutation.error && (
              <p className="form-error" role="alert">
                {mutation.error}
              </p>
            )}
            <div className="workspace-quick-actions">
              <button className="legacy-button" disabled={mutation.busy}>
                {editing ? "Enregistrer la campagne" : "Créer la campagne"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setEditing(null);
                    setForm(initial(new Date().toISOString()));
                  }}
                >
                  Annuler la modification
                </button>
              )}
            </div>
          </form>
        </section>
        <div>
          <section className="property-panel">
            <h2>Aperçu du visuel</h2>
            <Image
              className="ad-admin-preview"
              src={
                form.creativeId
                  ? `/api/v1/advertisements/creatives/${form.creativeId}`
                  : form.imagePath
              }
              alt="Aperçu de la publicité"
              width={640}
              height={360}
              unoptimized
            />
            <p>{form.title || "Titre de votre campagne"}</p>
            <small>
              Le lien reste une navigation normale. Aucun code tiers ou pixel
              publicitaire n’est injecté dans les annonces.
            </small>
          </section>
          <section className="property-panel">
            <h2>Importer un visuel</h2>
            <p>
              JPEG, PNG ou WebP, au moins 320 × 180 pixels et 4 Mo maximum. Le
              visuel sera réencodé et ses métadonnées retirées.
            </p>
            <form className="auth-form" onSubmit={upload}>
              <label className="auth-field">
                Fichier publicitaire
                <input
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
              </label>
              <button
                className="team-secondary-button"
                disabled={mutation.busy}
              >
                Ajouter le visuel
              </button>
            </form>
          </section>
        </div>
      </div>
      {message && (
        <p className="visit-success" role="status">
          {message}
        </p>
      )}
      <section className="property-panel">
        <h2>Campagnes enregistrées ({data.total})</h2>
        {!data.items.length ? (
          <p>
            Aucune campagne. Créez une annonce et choisissez son emplacement.
          </p>
        ) : (
          <div className="ad-campaign-list">
            {data.items.map((row) => (
              <article key={row.id}>
                <div>
                  <h3>{row.title}</h3>
                  <p>
                    {row.sponsorName} ·{" "}
                    {placementLabels[
                      row.placement as keyof typeof placementLabels
                    ] || row.placement}
                  </p>
                  <small>
                    {!row.active
                      ? "En pause"
                      : Date.parse(row.endsAt) < Date.parse(data.now)
                        ? "Terminée"
                        : Date.parse(row.startsAt) > Date.parse(data.now)
                          ? "Programmée"
                          : "En diffusion"}{" "}
                    ·{" "}
                    {row.campaignKind === "HOUSE"
                      ? "Autopromotion"
                      : "Sponsorisé"}
                  </small>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setForm(fields(row));
                    setEditing({ id: row.id, version: row.updatedAt });
                    setMessage("");
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }}
                >
                  Modifier cette campagne
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
