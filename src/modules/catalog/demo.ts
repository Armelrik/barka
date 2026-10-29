export type DemoProperty = {
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
    description:
      "Exemple fictif de villa avec cour, terrasse et garage. Aucune offre commerciale réelle.",
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
    description:
      "Exemple fictif de parcelle bornée. Aucun titre ou statut juridique vérifié.",
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
    description:
      "Exemple fictif de duplex proposé en location mensuelle, sans disponibilité réelle.",
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
    description:
      "Exemple fictif de bureaux. Les conditions de location restent à définir.",
  },
];
