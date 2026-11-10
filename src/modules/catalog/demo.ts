export type DemoProperty = {
  furnishing?: "FURNISHED" | "UNFURNISHED";
  rentalDuration?: "SHORT" | "LONG";
  rentPricePeriod?: "NIGHT" | "WEEK" | "MONTH";
  reference: string;
  slug: string;
  title: string;
  district: string;
  city: string;
  type: "VILLA" | "DEMARCATED_PARCEL" | "DUPLEX" | "OFFICE";
  category: "villa" | "parcelle" | "bureau";
  offer: "SALE" | "RENT";
  priceXof: number;
  surfaceM2: number;
  bedrooms: number;
  bathrooms: number;
  illustration: "villa" | "land" | "duplex" | "office";
  description: string;
  photos: string[];
  coordinates: [number, number];
};
export const demoProperties: DemoProperty[] = [
  {
    reference: "DEMO-001",
    slug: "villa-familiale-ouaga-2000",
    title: "Une villa pour toute la famille",
    district: "Ouaga 2000",
    city: "Ouagadougou",
    type: "VILLA",
    category: "villa",
    offer: "SALE",
    priceXof: 85000000,
    surfaceM2: 350,
    bedrooms: 4,
    bathrooms: 3,
    illustration: "villa",
    photos: [
      "/afriloc/house1.jpg",
      "/afriloc/house2.jpg",
      "/afriloc/house3.jpg",
    ],
    coordinates: [12.318, -1.515],
    description:
      "Une adresse familiale à Ouaga 2000, avec une cour arborée, une terrasse ombragée et un garage. Quatre chambres permettent à chacun de trouver son espace. Bien de présentation pour la présentation du catalogue.",
  },
  {
    reference: "DEMO-002",
    slug: "parcelle-bornee-saaba",
    title: "Le terrain de vos futurs projets",
    district: "Saaba",
    city: "Ouagadougou",
    type: "DEMARCATED_PARCEL",
    category: "parcelle",
    offer: "SALE",
    priceXof: 12500000,
    surfaceM2: 300,
    bedrooms: 0,
    bathrooms: 0,
    illustration: "land",
    photos: ["/afriloc/land1.jpg", "/afriloc/land2.jpg"],
    coordinates: [12.375, -1.44],
    description:
      "Imaginez votre future maison sur cette parcelle de 300 m² à Saaba. Une sélection pensée pour un projet résidentiel à taille humaine. Bien de présentation : aucun titre foncier ni statut juridique vérifié.",
  },
  {
    reference: "DEMO-003",
    slug: "duplex-location-zone-du-bois",
    title: "Un duplex ouvert sur la lumière",
    district: "Zone du Bois",
    city: "Ouagadougou",
    type: "DUPLEX",
    category: "villa",
    offer: "RENT",
    priceXof: 450000,
    surfaceM2: 240,
    bedrooms: 3,
    bathrooms: 3,
    illustration: "duplex",
    photos: [
      "/afriloc/apartment1.jpg",
      "/afriloc/apartment2.jpg",
      "/afriloc/house4.jpg",
    ],
    coordinates: [12.385, -1.499],
    description:
      "Des espaces lumineux répartis sur deux niveaux, trois chambres et une terrasse pour profiter des soirées. Ce duplex de la Zone du Bois illustre notre sélection locative. Bien de présentation, sans disponibilité réelle.",
  },
  {
    reference: "DEMO-004",
    slug: "bureau-location-gounghin",
    title: "Un nouvel espace pour votre activité",
    district: "Gounghin",
    city: "Ouagadougou",
    type: "OFFICE",
    category: "bureau",
    offer: "RENT",
    priceXof: 150000,
    surfaceM2: 85,
    bedrooms: 0,
    bathrooms: 1,
    illustration: "office",
    photos: [
      "/afriloc/apartment3.jpg",
      "/afriloc/apartment2.jpg",
      "/afriloc/apartment1.jpg",
    ],
    coordinates: [12.365, -1.553],
    description:
      "Un bureau de 85 m² à Gounghin pour installer une petite équipe : espace de travail, accueil et salle de réunion à aménager selon vos besoins. Bien de présentation, sans disponibilité réelle.",
  },
  {
    reference: "DEMO-005",
    slug: "villa-terrasse-pissy",
    title: "La villa des soirées en terrasse",
    district: "Pissy",
    city: "Ouagadougou",
    type: "VILLA",
    category: "villa",
    offer: "RENT",
    priceXof: 275000,
    surfaceM2: 190,
    bedrooms: 3,
    bathrooms: 2,
    illustration: "villa",
    photos: [
      "/afriloc/house2.jpg",
      "/afriloc/house4.jpg",
      "/afriloc/apartment2.jpg",
    ],
    coordinates: [12.342, -1.574],
    description:
      "Une maison conviviale à Pissy, avec trois chambres, une cour et une terrasse pour recevoir. Une proposition de location destinée aux familles. Bien de présentation, sans disponibilité réelle.",
  },
  {
    reference: "DEMO-006",
    slug: "duplex-patio-bobo",
    title: "Un duplex avec patio à Bobo",
    district: "Belleville",
    city: "Bobo-Dioulasso",
    type: "DUPLEX",
    category: "villa",
    offer: "SALE",
    priceXof: 62000000,
    surfaceM2: 280,
    bedrooms: 4,
    bathrooms: 3,
    illustration: "duplex",
    photos: [
      "/afriloc/house3.jpg",
      "/afriloc/apartment1.jpg",
      "/afriloc/house2.jpg",
    ],
    coordinates: [11.156, -4.306],
    description:
      "À Belleville, ce duplex imaginé autour d’un patio associe espaces de réception et chambres à l’étage. Une ambiance chaleureuse pour un projet familial à Bobo-Dioulasso. Bien de présentation, sans offre réelle.",
  },
  {
    reference: "DEMO-007",
    slug: "terrain-residentiel-kamboinse",
    title: "Votre prochain chapitre à Kamboinsin",
    district: "Kamboinsin",
    city: "Ouagadougou",
    type: "DEMARCATED_PARCEL",
    category: "parcelle",
    offer: "SALE",
    priceXof: 18000000,
    surfaceM2: 450,
    bedrooms: 0,
    bathrooms: 0,
    illustration: "land",
    photos: ["/afriloc/land2.jpg", "/afriloc/land1.jpg"],
    coordinates: [12.462, -1.559],
    description:
      "450 m² pour dessiner une résidence avec jardin à Kamboinsin. Ce scénario illustre la recherche de terrains par quartier et par budget. Bien de présentation : aucun titre foncier ni statut juridique vérifié.",
  },
  {
    reference: "DEMO-008",
    slug: "bureau-equipe-zogona",
    title: "L’adresse de votre prochaine équipe",
    district: "Zogona",
    city: "Ouagadougou",
    type: "OFFICE",
    category: "bureau",
    offer: "RENT",
    priceXof: 225000,
    surfaceM2: 120,
    bedrooms: 0,
    bathrooms: 2,
    illustration: "office",
    photos: [
      "/afriloc/apartment2.jpg",
      "/afriloc/apartment3.jpg",
      "/afriloc/apartment1.jpg",
    ],
    coordinates: [12.378, -1.483],
    description:
      "Un espace de 120 m² à Zogona, imaginé pour une agence, un cabinet ou une jeune entreprise. Des volumes ouverts à personnaliser et un accueil distinct. Bien de présentation, sans disponibilité réelle.",
  },
];
