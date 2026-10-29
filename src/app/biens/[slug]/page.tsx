import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, MapPin, Square } from "lucide-react";
import { demoProperties } from "@/modules/catalog/demo";
import { SiteHeader } from "@/components/site-header";
import { propertyVisuals } from "@/modules/catalog/visuals";
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
  const p = demoProperties.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="shell detail-page">
        <Link href="/#catalogue" className="text-link">
          <ArrowLeft size={16} />
          Retour aux exemples
        </Link>
        <div className="detail-heading">
          <div>
            <span className="eyebrow">EXEMPLE FICTIF · {p.reference}</span>
            <h1>{p.title}</h1>
            <p className="card-location">
              <MapPin size={16} />
              {p.district}, {p.city}
            </p>
          </div>
          <strong>
            {formatXof(p.priceXof)}
            {p.offer === "RENT" && <small> / mois</small>}
          </strong>
        </div>
        <div className="detail-visual">
          <div className="detail-photo">
            <Image
              src={propertyVisuals[p.illustration]}
              fill
              preload
              sizes="94vw"
              alt={`Visuel d’ambiance généré : ${p.title}`}
            />
          </div>
          <span>
            Visuel d’ambiance généré par IA — bien fictif de démonstration
          </span>
        </div>
        <div className="detail-description">
          <section>
            <h2>Le bien en quelques mots</h2>
            <p>{p.description}</p>
            <div className="card-features">
              <span>
                <Square size={18} />
                {p.surfaceM2} m²
              </span>
              <span>
                <BedDouble size={18} />
                {p.bedrooms} chambres
              </span>
              <span>
                <Bath size={18} />
                {p.bathrooms} salles d’eau
              </span>
            </div>
          </section>
          <aside>
            <h2>À propos de cet exemple</h2>
            <p>
              Ce bien fictif sert à présenter BARKA. Il ne peut pas être
              réservé. Aucun contact, titre foncier, disponibilité ni visite
              360° n’est fourni.
            </p>
            <Link href="/#projet" className="text-link">
              Découvrir le projet
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
