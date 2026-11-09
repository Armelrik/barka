"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Plus } from "lucide-react";
import {
  propertySchema,
  propertyUpdateSchema,
  propertyTypeLabels,
} from "@/modules/listings/validation";
import type { ListingDto, propertyOptions } from "@/modules/listings/service";
import { usePropertyMutation } from "./api";
type Options = Awaited<ReturnType<typeof propertyOptions>>;
export function PropertyForm({
  listing,
  options,
  companyId,
  global,
}: {
  listing?: ListingDto;
  options: Options;
  companyId: string;
  global: boolean;
}) {
  const router = useRouter(),
    mutation = usePropertyMutation();
  const [data, setData] = useState({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    type: listing?.type ?? "VILLA",
    offer: listing?.offer ?? "SALE",
    priceXof: String(listing?.priceXof ?? ""),
    surfaceM2: String(listing?.surfaceM2 ?? ""),
    bedrooms: String(listing?.bedrooms ?? 0),
    bathrooms: String(listing?.bathrooms ?? 0),
    livingRooms: String(listing?.livingRooms ?? 0),
    garageSpaces: String(listing?.garageSpaces ?? 0),
    locationId: listing?.locationId ?? "",
    agentId: listing?.agentId ?? options.agents[0]?.id ?? "",
    companyId: listing?.companyId ?? companyId,
    legalStatus: listing?.legalStatus ?? "",
    latitude: listing?.latitude?.toString() ?? "",
    longitude: listing?.longitude?.toString() ?? "",
    showMap: listing?.showMap ?? false,
  });
  const [choices, setChoices] = useState(options),
    [locationSearch, setLocationSearch] = useState(""),
    [loading, setLoading] = useState(false);
  function field(key: string, value: string | boolean) {
    setData((old) => ({ ...old, [key]: value }));
  }
  async function loadOptions(selected = data.companyId, q = locationSearch) {
    setLoading(true);
    try {
      const response = await fetch(
          `/api/v1/properties/options?${new URLSearchParams({ companyId: selected, q })}`,
        ),
        body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message ?? "Le chargement a échoué.");
      setChoices(body);
    } catch (e) {
      mutation.setError(
        e instanceof Error ? e.message : "Le chargement a échoué.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { companyId: company, ...fields } = data;
    const payload = {
      ...fields,
      latitude: data.latitude === "" ? null : Number(data.latitude),
      longitude: data.longitude === "" ? null : Number(data.longitude),
    };
    if ((payload.latitude === null) !== (payload.longitude === null)) {
      mutation.setError("Renseignez la latitude et la longitude ensemble.");
      return;
    }
    if (payload.showMap && payload.latitude === null) {
      mutation.setError("Ajoutez les coordonnées avant d’activer la carte.");
      return;
    }
    const parsed = listing
      ? propertyUpdateSchema.safeParse({
          ...payload,
          expectedUpdatedAt: listing.updatedAt,
        })
      : propertySchema.safeParse({ ...payload, companyId: company });
    if (!parsed.success) {
      mutation.setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")} : ${i.message}`)
          .join(" · "),
      );
      return;
    }
    const result = await mutation.run<{ listing: ListingDto }>(
      listing ? `/api/v1/properties/${listing.id}` : "/api/v1/properties",
      listing ? "PATCH" : "POST",
      parsed.data,
    );
    if (result) {
      router.replace(`/espace/biens/${result.listing.id}?saved=1`);
      router.refresh();
    }
  }
  function input(key: keyof typeof data, label: string, type = "text") {
    return (
      <label className="property-field">
        {label}
        <input
          type={type}
          value={String(data[key])}
          min={
            key === "latitude"
              ? -90
              : key === "longitude"
                ? -180
                : type === "number"
                  ? 0
                  : undefined
          }
          step={
            key === "surfaceM2" || key === "latitude" || key === "longitude"
              ? "any"
              : "1"
          }
          onChange={(e) => field(key, e.target.value)}
        />
      </label>
    );
  }
  const locations =
    listing && !choices.locations.some((l) => l.id === listing.locationId)
      ? [
          {
            id: listing.locationId,
            name: listing.locationName,
            kind: "DISTRICT",
          },
          ...choices.locations,
        ]
      : choices.locations;
  const agents =
    listing &&
    listing.agentId &&
    !choices.agents.some((a) => a.id === listing.agentId)
      ? [
          { id: listing.agentId, firstName: listing.agentName, lastName: "" },
          ...choices.agents,
        ]
      : choices.agents;
  return (
    <form className="property-form" onSubmit={submit}>
      <fieldset disabled={mutation.busy || listing?.status === "ARCHIVED"}>
        <legend>Le bien et son offre</legend>
        <div className="property-fields">
          {input("title", "Titre du bien")}
          <label className="property-field">
            Type de bien
            <select
              value={data.type}
              onChange={(e) => field("type", e.target.value)}
            >
              {Object.entries(propertyTypeLabels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="property-field">
            Offre
            <select
              value={data.offer}
              onChange={(e) => field("offer", e.target.value)}
            >
              <option value="SALE">Vente</option>
              <option value="RENT">Location mensuelle</option>
            </select>
          </label>
          {input("priceXof", "Prix en FCFA", "number")}
          {input("surfaceM2", "Surface en m²", "number")}
          {input("bedrooms", "Chambres", "number")}
          {input("bathrooms", "Salles d’eau", "number")}
          {input("livingRooms", "Salons", "number")}
          {input("garageSpaces", "Places de garage", "number")}
        </div>
        <label className="property-field">
          Description
          <textarea
            rows={6}
            maxLength={8000}
            value={data.description}
            onChange={(e) => field("description", e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset disabled={mutation.busy || listing?.status === "ARCHIVED"}>
        <legend>Localisation et commercial</legend>
        <div className="property-fields">
          <label className="property-field">
            Société
            <select
              value={data.companyId}
              disabled={!!listing || !global}
              onChange={(e) => {
                field("companyId", e.target.value);
                field("agentId", "");
                field("locationId", "");
                void loadOptions(e.target.value, "");
              }}
            >
              {choices.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="property-field">
            Commercial responsable
            <select
              value={data.agentId}
              onChange={(e) => field("agentId", e.target.value)}
            >
              <option value="">Choisir un commercial</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="location-search">
          <label className="property-field">
            Rechercher une localité
            <input
              maxLength={100}
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Ville ou quartier"
            />
          </label>
          <button
            className="team-secondary-button"
            type="button"
            disabled={loading}
            onClick={() => loadOptions()}
          >
            {loading ? "Chargement…" : "Chercher les localités"}
          </button>
        </div>
        <label className="property-field">
          Localité
          <select
            aria-label="Localité"
            value={data.locationId}
            onChange={(e) => field("locationId", e.target.value)}
          >
            <option value="">Choisir une localité</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.kind})
              </option>
            ))}
          </select>
        </label>
        <small>
          Jusqu’à 30 localités sont proposées. Précisez le nom pour affiner la
          recherche.
        </small>
        <div className="property-fields">
          {input("latitude", "Latitude (facultative)", "number")}
          {input("longitude", "Longitude (facultative)", "number")}
        </div>
        <label className="consent-label">
          <input
            type="checkbox"
            checked={data.showMap}
            onChange={(e) => field("showMap", e.target.checked)}
          />
          Afficher une position approximative sur la carte publique. Les
          coordonnées seront arrondies.
        </label>
        <label className="property-field">
          Situation foncière — note interne
          <textarea
            rows={3}
            maxLength={500}
            value={data.legalStatus}
            onChange={(e) => field("legalStatus", e.target.value)}
          />
        </label>
      </fieldset>
      {mutation.error && (
        <p className="auth-message" role="alert">
          {mutation.error}
        </p>
      )}
      <div className="member-form-actions">
        <Link href="/espace/biens" className="team-secondary-button">
          Retour aux biens
        </Link>
        <button
          className="team-primary-button"
          disabled={mutation.busy || listing?.status === "ARCHIVED"}
        >
          {listing ? <Save size={18} /> : <Plus size={18} />}{" "}
          {mutation.busy
            ? "Enregistrement…"
            : listing
              ? "Enregistrer le bien"
              : "Créer le brouillon"}
        </button>
      </div>
    </form>
  );
}
