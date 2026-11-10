import { catalogQueryFields } from "@/modules/catalog/query";
import { z } from "zod";
export const propertyTypes = [
  "APARTMENT",
  "TOWNHOUSE",
  "SHOP",
  "WAREHOUSE",
  "RETAIL_SPACE",
  "GUEST_HOUSE",
  "BARE_PARCEL",
  "DEMARCATED_PARCEL",
  "WALLED_PARCEL",
  "LAND",
  "HOUSE",
  "VILLA",
  "RENTAL_VILLA",
  "DUPLEX",
  "BUILDING",
  "OFFICE",
  "COMMERCIAL_SPACE",
] as const;
export const propertyTypeLabels: Record<
  (typeof propertyTypes)[number],
  string
> = {
  APARTMENT: "Appartement",
  TOWNHOUSE: "Maison mitoyenne",
  SHOP: "Boutique",
  WAREHOUSE: "Entrepôt",
  RETAIL_SPACE: "Espace de vente",
  GUEST_HOUSE: "Maison d’hôtes",
  BARE_PARCEL: "Parcelle nue",
  DEMARCATED_PARCEL: "Parcelle bornée",
  WALLED_PARCEL: "Parcelle clôturée",
  LAND: "Terrain",
  HOUSE: "Maison",
  VILLA: "Villa",
  RENTAL_VILLA: "Villa locative",
  DUPLEX: "Duplex",
  BUILDING: "Immeuble",
  OFFICE: "Bureau",
  COMMERCIAL_SPACE: "Local commercial",
};
const count = z.coerce.number().int().min(0).max(1000);
export const propertySchema = z
  .object({
    title: z.string().trim().min(5).max(180),
    description: z.string().trim().min(20).max(8000),
    type: z.enum(propertyTypes),
    offer: z.enum(["SALE", "RENT"]),
    furnishing: z.enum(["FURNISHED", "UNFURNISHED"]).nullable().default(null),
    rentalDuration: z.enum(["SHORT", "LONG"]).nullable().default(null),
    rentPricePeriod: z.enum(["NIGHT", "WEEK", "MONTH"]).default("MONTH"),
    priceXof: z.coerce.number().int().min(1).max(2147483647),
    surfaceM2: z.coerce.number().positive().max(99999999),
    bedrooms: count.default(0),
    bathrooms: count.default(0),
    livingRooms: count.default(0),
    garageSpaces: count.default(0),
    locationId: z.string().min(1).max(80),
    agentId: z.string().min(1).max(80),
    companyId: z.string().min(1).max(80).optional(),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    showMap: z.boolean().default(false),
    legalStatus: z.string().trim().max(500).default(""),
  })
  .strict();
export const propertyUpdateSchema = propertySchema
  .omit({ companyId: true })
  .extend({ expectedUpdatedAt: z.iso.datetime({ offset: true }) })
  .strict();
export const listingActions = [
  "SUBMIT",
  "REVIEW",
  "APPROVE",
  "PUBLISH",
  "REJECT",
  "SUSPEND",
  "ARCHIVE",
] as const;
export const listingActionSchema = z
  .object({
    action: z.enum(listingActions),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    reason: z.string().trim().max(1000).default(""),
  })
  .strict();
export const statusLabels = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  VERIFYING: "En vérification",
  APPROVED: "Approuvée",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  EXPIRED: "Expirée",
  ARCHIVED: "Archivée",
} as const;
export const listingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  q: z.string().trim().max(100).default(""),
  status: z
    .union([
      z.enum(
        Object.keys(statusLabels) as [
          keyof typeof statusLabels,
          ...(keyof typeof statusLabels)[],
        ],
      ),
      z.literal(""),
    ])
    .default(""),
});
export const publicQuerySchema = catalogQueryFields.extend({
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
