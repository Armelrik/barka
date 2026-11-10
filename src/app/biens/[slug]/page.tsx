import {
  databaseCatalogEnabled,
  publicListing,
} from "@/modules/listings/service";
import { PublicProperty } from "@/components/public-property";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { VisitRequestForm } from "@/components/visits/request-form";
import Link from "next/link";
import { PropertyCarousel } from "@/components/property-carousel";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, MapPin, Square } from "lucide-react";
import { demoProperties } from "@/modules/catalog/demo";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { demoPhotos } from "@/modules/catalog/visuals";
import { formatXof } from "@/lib/utils";
export function generateStaticParams() {
  return demoProperties.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (databaseCatalogEnabled()) {
    const listing = await publicListing(slug);
    return {
      title: listing
        ? `${listing.title} | BARKA SARL`
        : "Bien introuvable | BARKA SARL",
    };
  }
  const p = demoProperties.find((p) => p.slug === slug);
  return {
    title: p
      ? `${p.title} — Démonstration | BARKA SARL`
      : "Bien introuvable | BARKA SARL",
  };
}
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (databaseCatalogEnabled()) {
    const listing = await publicListing(slug);
    if (!listing) notFound();
    return <PublicProperty listing={listing} />;
  }
  const p = demoProperties.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="detail-page shell">
        <Link href="/biens" className="text-link detail-back">
          <ArrowLeft size={16} />
          Retour aux exemples
        </Link>
        <div className="detail-grid">
          <section>
            <PropertyCarousel photos={demoPhotos(p)} title={p.title} detail />
            <h1>{p.title}</h1>
            <p className="card-location">
              <MapPin size={18} />
              {p.city}, {p.district}
              <span className="type-badge">
                {p.offer === "SALE" ? "À vendre" : "À louer"}
              </span>
            </p>
            <h2>Description</h2>
            <p>{p.description}</p>
            <section className="detail-feature-box">
              <h2>Caractéristiques</h2>
              <div className="card-features">
                <span>
                  <BedDouble size={24} />
                  {p.bedrooms} Chambres
                </span>
                <span>
                  <Bath size={24} />
                  {p.bathrooms} Salles de Bain
                </span>
                <span>
                  <Square size={24} />
                  {p.surfaceM2} m²
                </span>
              </div>
            </section>
            <p className="detail-demo">
              BIEN DE PRÉSENTATION · {p.reference} · Illustration reprise du
              projet Afriloc.
            </p>
          </section>
          <aside className="detail-panel">
            <strong>{formatXof(p.priceXof)}</strong>
            <small>
              {p.offer === "RENT" ? "par mois" : "Prix de vente illustratif"}
            </small>
            <Link href="/contact" className="legacy-button gradient w-full">
              Nous Contacter
            </Link>
            <Link
              className="legacy-button gradient w-full mb-4"
              href="/visites/demo"
            >
              Découvrir la démonstration 360° et 3D
            </Link>
            <VisitRequestForm slug={p.slug} demo />
            <h2>À propos de cet exemple</h2>
            <p>
              Ce bien fictif sert à présenter BARKA. Il ne peut pas être
              réservé. Aucun contact, titre foncier, disponibilité ni visite
              360° n’est fourni.
            </p>
            <Link className="text-link mt-4" href="/#projet">
              Découvrir le projet
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
