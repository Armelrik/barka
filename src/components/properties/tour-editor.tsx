"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save } from "lucide-react";
import { z } from "zod";
import { tourSchema } from "@/modules/tours/validation";
import type { ListingDto } from "@/modules/listings/service";
import { usePropertyMutation } from "./api";
type Scene = z.output<typeof tourSchema>["scenes"][number];
export function TourEditor({ listing }: { listing: ListingDto }) {
  const router = useRouter(),
    mutation = usePropertyMutation();
  const existing = listing.tours.find((t) => t.kind === "PANORAMA"),
    [title, setTitle] = useState(
      existing?.title ?? listing.title.slice(0, 120),
    ),
    [scenes, setScenes] = useState<Scene[]>(existing?.scenes ?? []),
    [model, setModel] = useState(
      listing.tours.find((t) => t.kind === "MODEL_3D")?.modelAssetId ?? "",
    );
  const panoramas = listing.media.filter((m) => m.kind === "PANORAMA"),
    models = listing.media.filter((m) => m.kind === "MODEL_3D"),
    hasPlan = listing.media.some((m) => m.kind === "FLOOR_PLAN");
  function change(index: number, patch: Partial<Scene>) {
    setScenes((old) =>
      old.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }
  function remove(key: string) {
    setScenes((old) =>
      old
        .filter((s) => s.key !== key)
        .map((s) => ({
          ...s,
          hotspots: s.hotspots.filter((h) => h.targetKey !== key),
        })),
    );
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = tourSchema.safeParse({
      expectedUpdatedAt: listing.updatedAt,
      title,
      scenes,
      modelAssetId: model || null,
    });
    if (!parsed.success) {
      mutation.setError(parsed.error.issues.map((i) => i.message).join(" · "));
      return;
    }
    if (
      await mutation.run(
        `/api/v1/properties/${listing.id}/tour`,
        "PUT",
        parsed.data,
      )
    )
      router.refresh();
  }
  return (
    <section className="property-panel">
      <h2>Visite 360° et modèle 3D</h2>
      <p>
        Ajoutez d’abord vos panoramas et votre modèle GLB dans les médias.
        Chaque pièce utilise un panorama distinct. Les destinations des points
        sont limitées aux pièces de cette visite.
      </p>
      <form className="property-form" onSubmit={save}>
        <fieldset disabled={mutation.busy || listing.status === "ARCHIVED"}>
          <label className="property-field">
            Titre de la visite
            <input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="property-field">
            Modèle 3D facultatif
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="">Aucun modèle</option>
              {models.map((m, i) => (
                <option key={m.id} value={m.id}>
                  {m.alt || `Modèle ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
          {scenes.map((scene, i) => (
            <section className="scene-editor" key={scene.key}>
              <div className="scene-editor-title">
                <h3>Pièce {i + 1}</h3>
                <button
                  type="button"
                  className="team-secondary-button"
                  onClick={() => remove(scene.key)}
                  aria-label={`Retirer la pièce ${i + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="property-fields">
                <label className="property-field">
                  Nom de la pièce {i + 1}
                  <input
                    value={scene.title}
                    maxLength={80}
                    onChange={(e) => change(i, { title: e.target.value })}
                  />
                </label>
                <label className="property-field">
                  Panorama de la pièce {i + 1}
                  <select
                    value={scene.assetId}
                    onChange={(e) => change(i, { assetId: e.target.value })}
                  >
                    <option value="">Choisir un panorama</option>
                    {panoramas.map((p, n) => (
                      <option key={p.id} value={p.id}>
                        {p.alt || `Panorama ${n + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="property-field">
                  Orientation horizontale
                  <input
                    type="number"
                    min={-180}
                    max={180}
                    value={scene.initialYaw}
                    onChange={(e) =>
                      change(i, { initialYaw: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="property-field">
                  Orientation verticale
                  <input
                    type="number"
                    min={-85}
                    max={85}
                    value={scene.initialPitch}
                    onChange={(e) =>
                      change(i, { initialPitch: Number(e.target.value) })
                    }
                  />
                </label>
                {hasPlan && (
                  <>
                    <label className="property-field">
                      Position X sur le plan (%)
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scene.planX === null ? "" : scene.planX * 100}
                        onChange={(e) =>
                          change(i, {
                            planX:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value) / 100,
                          })
                        }
                      />
                    </label>
                    <label className="property-field">
                      Position Y sur le plan (%)
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scene.planY === null ? "" : scene.planY * 100}
                        onChange={(e) =>
                          change(i, {
                            planY:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value) / 100,
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="hotspot-editor">
                <h4>Points interactifs</h4>
                {scene.hotspots.map((h, n) => (
                  <div className="hotspot-row" key={n}>
                    <label className="property-field">
                      Libellé du point {n + 1}
                      <input
                        maxLength={160}
                        value={h.label}
                        onChange={(e) =>
                          change(i, {
                            hotspots: scene.hotspots.map((v, j) =>
                              j === n ? { ...v, label: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="property-field">
                      Destination
                      <select
                        value={h.targetKey ?? ""}
                        onChange={(e) =>
                          change(i, {
                            hotspots: scene.hotspots.map((v, j) =>
                              j === n
                                ? { ...v, targetKey: e.target.value || null }
                                : v,
                            ),
                          })
                        }
                      >
                        <option value="">Information uniquement</option>
                        {scenes
                          .filter((s) => s.key !== scene.key)
                          .map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="property-field">
                      Angle horizontal
                      <input
                        type="number"
                        min={-180}
                        max={180}
                        value={h.yaw}
                        onChange={(e) =>
                          change(i, {
                            hotspots: scene.hotspots.map((v, j) =>
                              j === n
                                ? { ...v, yaw: Number(e.target.value) }
                                : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="property-field">
                      Angle vertical
                      <input
                        type="number"
                        min={-85}
                        max={85}
                        value={h.pitch}
                        onChange={(e) =>
                          change(i, {
                            hotspots: scene.hotspots.map((v, j) =>
                              j === n
                                ? { ...v, pitch: Number(e.target.value) }
                                : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Retirer le point ${n + 1} de la pièce ${i + 1}`}
                      onClick={() =>
                        change(i, {
                          hotspots: scene.hotspots.filter((_, j) => j !== n),
                        })
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="team-secondary-button"
                  disabled={scene.hotspots.length >= 30}
                  onClick={() =>
                    change(i, {
                      hotspots: [
                        ...scene.hotspots,
                        { label: "", targetKey: null, yaw: 0, pitch: 0 },
                      ],
                    })
                  }
                >
                  <Plus size={16} />
                  Ajouter un point
                </button>
              </div>
            </section>
          ))}
          <button
            type="button"
            className="team-secondary-button"
            disabled={
              !panoramas.length ||
              scenes.length >= 30 ||
              scenes.length >= panoramas.length
            }
            onClick={() =>
              setScenes((old) => [
                ...old,
                {
                  key: crypto.randomUUID(),
                  title: `Pièce ${old.length + 1}`,
                  assetId:
                    panoramas.find((p) => !old.some((s) => s.assetId === p.id))
                      ?.id ?? "",
                  initialYaw: 0,
                  initialPitch: 0,
                  planX: null,
                  planY: null,
                  hotspots: [],
                },
              ])
            }
          >
            <Plus size={18} />
            Ajouter une pièce
          </button>
        </fieldset>
        {!panoramas.length && (
          <p>Ajoutez un panorama 2:1 pour créer votre première pièce.</p>
        )}
        {mutation.error && (
          <p className="auth-message" role="alert">
            {mutation.error}
          </p>
        )}
        <div className="member-form-actions">
          <Link
            className="team-secondary-button"
            href={`/espace/biens/${listing.id}/visite`}
          >
            Prévisualiser la visite enregistrée
          </Link>
          <button
            className="team-primary-button"
            disabled={mutation.busy || listing.status === "ARCHIVED"}
          >
            <Save size={18} />
            {mutation.busy ? "Enregistrement…" : "Enregistrer la visite"}
          </button>
        </div>
      </form>
    </section>
  );
}
