import { z } from "zod";
import { registrationSchema } from "./validation";
export const recoveryRequestSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.trim().toLowerCase()),
  })
  .strict();
export const recoveryResetSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    password: registrationSchema.shape.password,
  })
  .strict();
