import { z } from "zod";
export const availabilitySchema = z
  .object({
    agentId: z.string().min(1).max(100),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine(
    (v) => {
      const start = Date.parse(v.startsAt),
        end = Date.parse(v.endsAt);
      return (
        start >= Date.now() + 30 * 60000 &&
        start <= Date.now() + 90 * 86400000 &&
        end - start >= 3600000 &&
        end - start <= 12 * 3600000
      );
    },
    {
      message:
        "Prévoyez une plage de 1 à 12 heures, entre 30 minutes et 90 jours à l’avance.",
    },
  );
export function containsVisit(start: Date, end: Date, visit: Date) {
  return start <= visit && end.getTime() >= visit.getTime() + 3600000;
}
