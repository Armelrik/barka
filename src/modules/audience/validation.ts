import { z } from "zod";
import { placements } from "@/modules/advertising/validation";
export function publicAudiencePath(path: string) {
  if (["/", "/biens", "/carte", "/contact", "/visites/demo"].includes(path))
    return path;
  if (/^\/biens\/[^/?#]+$/.test(path)) return "/biens/[slug]";
  if (/^\/visites\/[^/?#]+$/.test(path)) return "/visites/[slug]";
  return null;
}
export const audienceSchema = z
  .object({
    sessionId: z.uuid(),
    viewId: z.uuid(),
    kind: z.enum(["PAGE_VIEW", "AD_IMPRESSION", "AD_CLICK"]),
    path: z.string().max(300),
    device: z.enum(["MOBILE", "TABLET", "DESKTOP"]),
    campaignId: z.string().min(1).max(100).optional(),
    placement: z.enum(placements).optional(),
  })
  .strict();
export const isAutomatedAgent = (ua: string) =>
  /bot|crawler|spider|HeadlessChrome|playwright|curl|wget|python/i.test(ua);
export function reportRange(input: Record<string, unknown>) {
  const today = new Date().toISOString().slice(0, 10),
    defaultStart = new Date(Date.now() - 29 * 86400000)
      .toISOString()
      .slice(0, 10);
  const q = z
    .object({
      from: z.iso.date().default(defaultStart),
      to: z.iso.date().default(today),
    })
    .parse(input);
  if (
    q.from > q.to ||
    q.to > today ||
    Date.parse(q.to) - Date.parse(q.from) > 89 * 86400000
  )
    throw new Error(
      "Période invalide : choisissez au maximum 90 jours jusqu’à aujourd’hui.",
    );
  return {
    ...q,
    start: new Date(q.from + "T00:00:00Z"),
    end: new Date(Date.parse(q.to + "T00:00:00Z") + 86400000),
  };
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""') +
    '"'
  );
}
