import { z } from "zod";
export const adImagePresets = [
  "/afriloc/ad-banner.jpg",
  "/afriloc/house1.jpg",
  "/afriloc/house2.jpg",
  "/afriloc/house3.jpg",
  "/afriloc/house4.jpg",
  "/afriloc/apartment1.jpg",
  "/afriloc/apartment2.jpg",
  "/afriloc/apartment3.jpg",
  "/afriloc/land1.jpg",
  "/afriloc/land2.jpg",
  "/afriloc/ouaga-hero.jpg",
] as const;
export const placements = ["HERO", "AFTER_HERO", "BEFORE_FOOTER"] as const;
export const placementLabels = {
  HERO: "Carrousel du hero",
  AFTER_HERO: "Après le hero",
  BEFORE_FOOTER: "Avant le pied de page",
};
export function safeAdTarget(value: string) {
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/"))
    return !value.startsWith("//") && !/%(?:2f|5c)/i.test(value.slice(0, 12));
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export const adSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(300).default(""),
    sponsorName: z.string().trim().min(2).max(100),
    campaignKind: z.enum(["HOUSE", "SPONSORED"]),
    placement: z.enum(placements),
    targetUrl: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .refine(
        safeAdTarget,
        "Utilisez un lien interne ou une adresse HTTPS valide.",
      ),
    imagePath: z.enum(adImagePresets).default("/afriloc/ad-banner.jpg"),
    creativeId: z.string().max(100).nullable().default(null),
    cta: z.string().trim().min(2).max(35).default("Découvrir"),
    priority: z.coerce.number().int().min(0).max(100).default(0),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    active: z.boolean().default(false),
  })
  .strict()
  .refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    message: "La fin doit suivre le début.",
  });
