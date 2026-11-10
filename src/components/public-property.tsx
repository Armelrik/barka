import { currentUser } from "@/lib/server/session";
import { publicAvailability } from "@/modules/availability/service";
import { FavoriteControl } from "./account/favorite-control";
import Link from "next/link";
import { VisitRequestForm } from "./visits/request-form";
import Image from "next/image";
import { PropertyCarousel } from "./property-carousel";
import {
  MapPin,
  BedDouble,
  Bath,
  Square,
  ScanEye,
  ArrowLeft,
} from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PropertyMap } from "./map/property-map";
import type { PublicListing } from "@/modules/listings/service";
import { formatXof } from "@/lib/utils";
export async function PublicProperty({
  listing: p,
}: {
  listing: PublicListing;
}) {
  const availability = p.isDemo
    ? undefined
    : await publicAvailability(p.slug, (await currentUser())?.id).catch(() => ({
        mode: "unavailable" as const,
        slots: [],
      }));
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="detail-page shell">
        <Link href="/biens" className="text-link detail-back">
          <ArrowLeft size={16} />
          Retour aux biens
        </Link>
        <div className="detail-grid">
          <section>
            <PropertyCarousel
              photos={p.photos}
              title={p.title}
              detail
              unoptimized
            />
            {p.isDemo && (
              <p className="visit-demo-note">
                BIEN DE PRÉSENTATION · Photographies d’illustration, prix
                indicatif et localisation fictive. Ce bien ne peut pas être
                réservé.
              </p>
            )}
            <h1>{p.title}</h1>
            <FavoriteControl slug={p.slug} title={p.title} />
            <p className="card-location">
              <MapPin size={18} />
              {p.location}, {p.city}
            </p>
            <p className="property-kind">
              {p.furnishing
                ? p.furnishing === "FURNISHED"
                  ? "Meublé"
                  : "Non meublé"
                : ""}
              {p.rentalDuration
                ? ` · Location ${p.rentalDuration === "SHORT" ? "courte" : "longue"} durée`
                : ""}
            </p>
            <h2>Description</h2>
            <p className="whitespace-pre-line">{p.description}</p>
            <section className="detail-feature-box">
              <h2>Caractéristiques</h2>
              <div className="card-features">
                {p.bedrooms > 0 && (
                  <span>
                    <BedDouble size={24} />
                    {p.bedrooms} {p.bedrooms === 1 ? "chambre" : "chambres"}
                  </span>
                )}
                {p.bathrooms > 0 && (
                  <span>
                    <Bath size={24} />
                    {p.bathrooms}{" "}
                    {p.bathrooms === 1 ? "salle d’eau" : "salles d’eau"}
                  </span>
                )}
                <span>
                  <Square size={24} />
                  {p.surfaceM2} m²
                </span>
              </div>
            </section>
            {p.photos.length > 1 && (
              <section className="detail-gallery">
                {p.photos.slice(1).map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      width={480}
                      height={320}
                      unoptimized
                    />
                  </a>
                ))}
              </section>
            )}
            {p.latitude !== null && p.longitude !== null && (
              <section>
                <h2>Situation approximative</h2>
                <p>
                  Le point indique une zone arrondie, pas l’adresse précise du
                  bien.
                </p>
                <PropertyMap
                  points={[
                    {
                      id: p.reference,
                      title: p.title,
                      latitude: p.latitude,
                      longitude: p.longitude,
                    },
                  ]}
                />
              </section>
            )}
          </section>
          <aside className="detail-panel">
            <strong>{formatXof(p.priceXof)}</strong>
            <small>
              {p.offer === "RENT"
                ? `par ${p.rentPricePeriod === "NIGHT" ? "nuit" : p.rentPricePeriod === "WEEK" ? "semaine" : "mois"}`
                : "Prix de vente"}
            </small>
            {p.hasTour && (
              <Link
                className="legacy-button gradient w-full"
                href={`/visites/${p.slug}`}
              >
                <ScanEye size={20} />
                Explorer la visite immersive
              </Link>
            )}
            <VisitRequestForm
              slug={p.slug}
              demo={p.isDemo}
              availability={availability}
            />
            <p className="detail-demo">Référence : {p.reference}</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
