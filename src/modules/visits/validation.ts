import { z } from "zod";
export const visitDurationMs = 60 * 60 * 1000;
export const visitRequestSchema = z
  .object({
    slug: z.string().min(1).max(200),
    desiredAt: z.iso.datetime({ offset: true }),
    message: z.string().trim().max(1000).default(""),
  })
  .strict();
export const visitActionSchema = z
  .object({
    action: z.enum(["CONFIRM", "REJECT", "CANCEL", "COMPLETE"]),
    expectedUpdatedAt: z.iso.datetime(),
    reply: z.string().trim().max(1000).default(""),
  })
  .strict();
export const visitQuerySchema = z.object({
  view: z.enum(["mine", "team"]).default("mine"),
  status: z
    .enum(["", "REQUESTED", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"])
    .default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const visitStatusLabels = {
  REQUESTED: "En attente",
  CONFIRMED: "Confirmée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
  COMPLETED: "Effectuée",
} as const;
export function validVisitDate(date: Date, now = new Date()) {
  return (
    Number.isFinite(date.getTime()) &&
    date.getTime() >= now.getTime() + 30 * 60000 &&
    date.getTime() <= now.getTime() + 90 * 86400000
  );
}
export function visitTransition(
  status: string,
  action: string,
  owner: boolean,
  start: Date,
  now = new Date(),
) {
  if (owner)
    return action === "CANCEL" && ["REQUESTED", "CONFIRMED"].includes(status);
  if (action === "CONFIRM") return status === "REQUESTED" && start > now;
  if (action === "REJECT") return status === "REQUESTED";
  if (action === "CANCEL") return status === "CONFIRMED";
  if (action === "COMPLETE")
    return (
      status === "CONFIRMED" &&
      start.getTime() + visitDurationMs <= now.getTime()
    );
  return false;
}
export function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Ouagadougou",
  }).format(new Date(value));
}
