import { DatabaseCatalog } from "@/components/database-catalog";
import { databaseCatalogEnabled } from "@/modules/listings/service";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Catalog } from "@/components/catalog";
export default function Home() {
  return (
    <div>
      <SiteHeader />
      <main id="contenu">
        <section className="relative min-h-screen sm:h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/afriloc/ouaga-hero.jpg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 sm:from-black/70 sm:via-black/50 sm:to-transparent"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 pb-72 sm:pb-48 md:pb-52">
            <div className="max-w-4xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 animate-fade-in leading-tight">
                Trouvez la Maison de Vos Rêves à Ouagadougou
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 animate-fade-in max-w-2xl">
                Découvrez les meilleures propriétés à louer et à vendre au
                Burkina Faso
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in mb-8 sm:mb-0">
                <Link
                  href="/biens"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all hover:scale-105 font-semibold text-sm sm:text-base shadow-lg"
                >
                  Parcourir les Propriétés
                  <svg
                    className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-lg hover:bg-white/20 transition-all font-semibold text-sm sm:text-base"
                >
                  Devenir Promoteur
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-stats absolute bottom-0 left-0 right-0 z-10 pb-4 sm:pb-6 md:pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-white/80 text-xs text-center mb-2">
                Chiffres illustratifs de la maquette · Version de démonstration
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-6xl mx-auto">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                    100+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 mt-1">
                    Maisons
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                    50+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 mt-1">
                    Appartements
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                    50+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 mt-1">
                    Promoteurs Vérifiés
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                    200+
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 mt-1">
                    Clients Satisfaits
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <svg
              className="w-6 h-6 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        <section id="approche" className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                Comment Ça Marche
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Trouvez votre propriété idéale en 3 étapes simples
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <div className="text-center group">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    1
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  Recherchez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  Parcourez notre large sélection de propriétés vérifiées
                </p>
              </div>

              <div className="text-center group">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    2
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  Visitez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  Planifiez une visite avec nos agents professionnels
                </p>
              </div>

              <div className="text-center group sm:col-span-2 lg:col-span-1">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    3
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  Emménagez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  Finalisez votre réservation et emménagez rapidement
                </p>
              </div>
            </div>
          </div>
        </section>

        {databaseCatalogEnabled() ? <DatabaseCatalog featured /> : <Catalog />}

        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                Pourquoi Choisir BARKA
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Votre partenaire de confiance pour l’immobilier au Burkina Faso
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Vérification des Propriétés
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Un parcours de vérification prévu avant la publication des
                  annonces
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Un Accompagnement Dédié
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Notre équipe est disponible pour vous accompagner
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Prix Transparents
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Pas de frais cachés, tout est clair dès le départ
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Paiement Sécurisé
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Les paiements seront activés après intégration du prestataire
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Processus Rapide
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Un parcours simple pour préparer votre prochain projet
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  Qualité Garantie
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Des propriétés de qualité supérieure seulement
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="immersive-teaser shell">
          <div>
            <span className="eyebrow">EXPLOREZ AUTREMENT</span>
            <h2>Entrez dans votre prochain projet.</h2>
            <p>
              Parcourez les pièces à 360°, explorez un modèle 3D et retrouvez
              les biens sur la carte.
            </p>
            <small>
              La visite proposée ici est une démonstration géométrique fictive.
            </small>
          </div>
          <div>
            <Link href="/visites/demo" className="legacy-button gradient">
              Découvrir la visite 360° et 3D
            </Link>
            <Link href="/carte" className="legacy-button">
              Explorer la carte des biens
            </Link>
          </div>
        </section>
        <section
          id="projet"
          className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary via-primary-600 to-accent text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute transform rotate-45 -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full"></div>
            <div className="absolute transform -rotate-45 -bottom-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Vous êtes Promoteur Immobilier ?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
                Rejoignez notre plateforme et développez votre activité
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Accès à des milliers de clients
                  </span>
                </div>
                <div className="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Gestion simplifiée de vos biens
                  </span>
                </div>
                <div className="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Support marketing gratuit
                  </span>
                </div>
                <div className="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    Commission attractive
                  </span>
                </div>
              </div>

              <Link
                href="/inscription"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-all hover:scale-105 text-base sm:text-lg font-semibold shadow-lg"
              >
                Devenir Promoteur
                <svg
                  className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-foreground">
              Prêt à trouver votre maison idéale ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-600 max-w-2xl mx-auto px-4">
              Contactez-nous dès aujourd’hui et laissez-nous vous aider à
              trouver la propriété parfaite à Ouagadougou
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-xl transition-all hover:scale-105 text-base sm:text-lg font-semibold"
            >
              Contact
              <svg
                className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
