import Link from "next/link";
import { PropertyCarousel } from "@/components/property-carousel";
import { MapPin, BedDouble, Bath, ScanEye, Map } from "lucide-react";
import { publicCatalog } from "@/modules/listings/service";
import { publicQuerySchema } from "@/modules/listings/validation";
import { formatXof } from "@/lib/utils";
export async function DatabaseCatalog({
  query = {},
  featured = false,
}: {
  query?: Record<string, string | undefined>;
  featured?: boolean;
}) {
  const parsed = publicQuerySchema.safeParse(query),
    q = parsed.success ? parsed.data : publicQuerySchema.parse({});
  const result = await publicCatalog(q, featured).catch(() => null);
  const page = (n: number) =>
    `/biens?${new URLSearchParams({ page: String(n), offer: q.offer, category: q.category, location: q.location, maxPrice: String(q.maxPrice) })}`;
  const Heading = featured ? "h2" : "h1";
  const types: Record<string, string> = {
    VILLA: "Villa",
    HOUSE: "Maison",
    APARTMENT: "Appartement",
    LAND: "Terrain",
    OFFICE: "Bureau",
    COMMERCIAL: "Commerce",
  };
  const examplesOnly =
    !!result?.items.length && result.items.every((p) => p.isDemo);
  return (
    <section id="catalogue" className="catalog-section shell">
      <div className="section-heading">
        <Heading>
          {featured ? "Notre sélection de propriétés" : "Toutes les propriétés"}
        </Heading>
        <p>
          {examplesOnly
            ? "Découvrez les biens de présentation : photos, quartiers et prix illustratifs."
            : "Trouvez votre prochain bien selon votre projet, votre quartier et votre budget."}
        </p>
      </div>
      {!featured && (
        <>
          <form className="search-panel" method="get" action="/biens">
            <label>
              Votre projet
              <select name="offer" defaultValue={q.offer}>
                <option value="ALL">Acheter ou louer</option>
                <option value="SALE">Acheter</option>
                <option value="RENT">Louer</option>
              </select>
            </label>
            <label>
              Localisation
              <input
                name="location"
                maxLength={100}
                defaultValue={q.location}
                placeholder="Ville ou quartier"
              />
            </label>
            <label>
              Type de bien
              <select name="category" defaultValue={q.category}>
                <option value="all">Tous les types</option>
                <option value="villa">Villas et maisons</option>
                <option value="parcelle">Terrains et parcelles</option>
                <option value="bureau">Bureaux et commerces</option>
              </select>
            </label>
            <label>
              Budget maximum
              <input
                name="maxPrice"
                type="number"
                min={0}
                max={2147483647}
                defaultValue={q.maxPrice || ""}
                placeholder="FCFA"
              />
            </label>
            <button className="legacy-button" type="submit">
              Rechercher
            </button>
          </form>
          <div className="catalog-toolbar">
            <p>
              {result
                ? `${result.total} ${result.total === 1 ? "bien trouvé" : "biens trouvés"}`
                : "Catalogue indisponible"}
            </p>
            <Link href="/carte">
              <Map size={18} />
              Voir sur la carte
            </Link>
          </div>
        </>
      )}
      {!result ? (
        <p className="empty-state" role="status">
          Le catalogue est momentanément indisponible. Réessayez dans un
          instant.
        </p>
      ) : result.items.length ? (
        <div className="property-grid">
          {result.items.map((p) => (
            <article className="property-card" key={p.slug}>
              <PropertyCarousel
                photos={p.photos}
                title={p.title}
                href={`/biens/${p.slug}`}
                unoptimized
              />
              <div className="card-top">
                <span className="type-badge">
                  {p.offer === "SALE" ? "À vendre" : "À louer"}
                </span>
                {p.hasTour && (
                  <Link className="tour-badge" href={`/visites/${p.slug}`}>
                    <ScanEye size={16} />
                    Visite immersive
                  </Link>
                )}
              </div>
              <div className="card-body">
                {p.isDemo && (
                  <span className="offer-badge">EXEMPLE FICTIF</span>
                )}
                <h3>
                  <Link href={`/biens/${p.slug}`}>{p.title}</Link>
                </h3>
                <p className="card-location">
                  <MapPin size={16} />
                  {p.location}, {p.city}
                </p>
                <p className="property-kind">
                  {types[p.type] ?? "Bien immobilier"} ·{" "}
                  {p.offer === "SALE" ? "Vente" : "Location mensuelle"}
                </p>
                <p className="property-description">{p.description}</p>
                <div className="card-features">
                  {p.bedrooms > 0 && (
                    <span>
                      <BedDouble size={18} />
                      {p.bedrooms} ch.
                    </span>
                  )}
                  {p.bathrooms > 0 && (
                    <span>
                      <Bath size={18} />
                      {p.bathrooms} sdb.
                    </span>
                  )}
                  <span>{p.surfaceM2} m²</span>
                </div>
                <div className="card-price">
                  <strong>
                    {formatXof(p.priceXof)}
                    {p.offer === "RENT" && <small> / mois</small>}
                  </strong>
                </div>
                <Link
                  href={`/biens/${p.slug}`}
                  className="card-details-link"
                  aria-label={`Voir le bien : ${p.title}`}
                >
                  Voir le bien <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Aucune annonce publiée ne correspond à votre recherche.</h3>
          <Link href="/biens" className="text-link">
            Effacer les filtres
          </Link>
        </div>
      )}
      {featured ? (
        <div className="text-center mt-10">
          <Link href="/biens" className="legacy-button">
            Voir Toutes les Propriétés
          </Link>
        </div>
      ) : (
        result && (
          <nav className="team-pagination" aria-label="Pagination du catalogue">
            {result.page > 1 && (
              <Link href={page(result.page - 1)}>Précédente</Link>
            )}
            <span>
              Page {result.page} sur{" "}
              {Math.max(1, Math.ceil(result.total / result.pageSize))}
            </span>
            {result.page * result.pageSize < result.total && (
              <Link href={page(result.page + 1)}>Suivante</Link>
            )}
          </nav>
        )
      )}
    </section>
  );
}
