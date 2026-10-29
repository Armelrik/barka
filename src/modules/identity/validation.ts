import { z } from "zod";

export function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (/^\d{8}$/.test(compact)) return `+226${compact}`;
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
}
export const phoneSchema = z
  .string()
  .max(40)
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Indiquez un numéro valide, par exemple +226 70 12 34 56.",
      ),
  );
const nameSchema = z
  .string()
  .trim()
  .min(2, "Indiquez au moins 2 caractères.")
  .max(80)
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*$/u,
    "Utilisez votre nom, sans chiffres ni caractères spéciaux.",
  );
export const registrationSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .max(254)
      .transform((value) => value.toLowerCase())
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "Vérifiez votre adresse email.",
      )
      .nullish()
      .transform((value) => value || null),
    password: z
      .string()
      .min(12, "Choisissez au moins 12 caractères.")
      .max(72, "Le mot de passe est trop long.")
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Le mot de passe doit contenir au plus 72 octets.",
      ),
    consent: z
      .boolean()
      .refine(
        (value) => value,
        "Vous devez accepter les conditions et la politique de confidentialité.",
      ),
  })
  .strict();
export const loginSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(1, "Indiquez votre téléphone ou votre email.")
      .max(254)
      .transform((value) =>
        value.includes("@") ? value.toLowerCase() : normalizePhone(value),
      )
      .refine(
        (value) =>
          value.includes("@")
            ? z.email().safeParse(value).success
            : phoneSchema.safeParse(value).success,
        "Vérifiez votre téléphone ou votre email.",
      ),
    password: z
      .string()
      .min(1, "Indiquez votre mot de passe.")
      .max(72, "Le mot de passe est trop long.")
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Le mot de passe est trop long.",
      ),
  })
  .strict();
export const consentVersions = {
  TERMS: "2026-10-29-draft-1",
  PRIVACY: "2026-10-29-draft-1",
} as const;
export const roleLabels = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  DEFAULT_COMMERCIAL: "Commercial par défaut",
  CLIENT: "Client",
  VISITOR: "Visiteur",
} as const;
