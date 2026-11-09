// Illustrations récupérées dans le dépôt Afriloc, sans preuve de disponibilité réelle.
export const propertyVisuals = {
  villa: "/afriloc/house1.jpg",
  land: "/afriloc/land1.jpg",
  duplex: "/afriloc/apartment1.jpg",
  office: "/afriloc/apartment3.jpg",
} as const;

export function demoPhotos(property: { title: string; photos: string[] }) {
  return property.photos.map((url, index) => ({
    url,
    alt: `${property.title} — illustration ${index + 1} (démonstration)`,
  }));
}
