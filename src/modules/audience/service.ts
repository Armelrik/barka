import "server-only";
import { createHmac } from "node:crypto";
import { getDb } from "@/lib/server/db";
import { getAuthConfig } from "@/lib/server/auth-config";
import { AppError } from "@/lib/server/errors";
import { currentUser, type AuthenticatedUser } from "@/lib/server/session";
import { consumeRateLimit, clientRateKey } from "@/lib/server/rate-limit";
import {
  audienceSchema,
  publicAudiencePath,
  isAutomatedAgent,
  reportRange,
  csvCell,
} from "./validation";
import { activeAdsWhere, assertSuper } from "@/modules/advertising/service";
const digest = (v: string) =>
  createHmac("sha256", getAuthConfig().secret).update(v).digest("hex");
export async function collectAudience(request: Request, input: unknown) {
  if (
    process.env.CATALOG_MODE !== "database" ||
    (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production")
  )
    return;
  const data = audienceSchema.parse(input),
    path = publicAudiencePath(data.path);
  if (!path)
    throw new AppError(
      400,
      "PUBLIC_PATH_ONLY",
      "Cette page n’entre pas dans les mesures publiques.",
    );
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    isAutomatedAgent(request.headers.get("user-agent") || "")
  )
    return;
  const actor = await currentUser();
  if (
    actor &&
    (actor.company.code === "BARKA-DEMO" ||
      !["CLIENT", "VISITOR"].includes(actor.role.code))
  )
    return;
  const day = new Date().toISOString().slice(0, 10),
    sessionHash = digest(`audience:${day}:${data.sessionId}`);
  await consumeRateLimit(`audience:ip:${clientRateKey(request)}`, 1000, 900);
  await consumeRateLimit(`audience:session:${sessionHash}`, 180, 900);
  if (data.kind !== "PAGE_VIEW") {
    if (path !== "/" || !data.campaignId || !data.placement)
      throw new AppError(400, "CAMPAIGN_REQUIRED", "Emplacement invalide.");
    if (
      !(await getDb().advertisement.findFirst({
        where: {
          ...activeAdsWhere(),
          id: data.campaignId,
          placement: data.placement,
        },
        select: { id: true },
      }))
    )
      return;
  }
  const common = {
    sessionHash,
    viewId: digest(`view:${day}:${data.viewId}`),
    path,
    device: data.device,
    campaignId: data.kind === "PAGE_VIEW" ? null : data.campaignId,
    placement: data.kind === "PAGE_VIEW" ? null : data.placement,
  };
  const row = (kind: string) => ({
    ...common,
    kind,
    dedupeKey: digest(
      `${sessionHash}:${data.viewId}:${kind}:${common.campaignId ?? ""}:${common.placement ?? ""}`,
    ),
  });
  await getDb().audienceEvent.createMany({
    data:
      data.kind === "AD_CLICK"
        ? [row("AD_IMPRESSION"), row("AD_CLICK")]
        : [row(data.kind)],
    skipDuplicates: true,
  });
}
export async function audienceReport(
  actor: AuthenticatedUser,
  input: Record<string, unknown>,
) {
  assertSuper(actor);
  let range;
  try {
    range = reportRange(input);
  } catch {
    throw new AppError(
      400,
      "DATE_RANGE",
      "Choisissez une période valide de 90 jours maximum, jusqu’à aujourd’hui.",
    );
  }
  const { start, end } = range,
    db = getDb();
  const [daily, pages, campaigns, logins] = await Promise.all([
    db.$queryRaw<
      {
        day: string;
        views: bigint;
        sessions: bigint;
        impressions: bigint;
        clicks: bigint;
      }[]
    >`SELECT to_char("createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD') day, COUNT(*) FILTER(WHERE kind='PAGE_VIEW') views, COUNT(DISTINCT "sessionHash") FILTER(WHERE kind='PAGE_VIEW') sessions, COUNT(*) FILTER(WHERE kind='AD_IMPRESSION') impressions, COUNT(*) FILTER(WHERE kind='AD_CLICK') clicks FROM "AudienceEvent" WHERE "createdAt">=${start} AND "createdAt"<${end} GROUP BY day ORDER BY day`,
    db.$queryRaw<
      { path: string; views: bigint }[]
    >`SELECT path,COUNT(*) views FROM "AudienceEvent" WHERE kind='PAGE_VIEW' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY path ORDER BY views DESC`,
    db.$queryRaw<
      {
        id: string;
        title: string;
        sponsor: string;
        placement: string;
        kind: string;
        impressions: bigint;
        clicks: bigint;
      }[]
    >`SELECT a.id,a.title,a."sponsorName" sponsor,a.placement,a."campaignKind" kind,COUNT(e.id) FILTER(WHERE e.kind='AD_IMPRESSION') impressions,COUNT(e.id) FILTER(WHERE e.kind='AD_CLICK') clicks FROM "Advertisement" a LEFT JOIN "AudienceEvent" e ON e."campaignId"=a.id AND e."createdAt">=${start} AND e."createdAt"<${end} GROUP BY a.id ORDER BY impressions DESC,a.title`,
    db.$queryRaw<
      {
        day: string;
        total: bigint;
        clients: bigint;
        team: bigint;
        unknown: bigint;
        demo: bigint;
        accounts: bigint;
      }[]
    >`SELECT to_char("createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD') day,COUNT(*) total,COUNT(*) FILTER(WHERE metadata->>'role'='CLIENT') clients,COUNT(*) FILTER(WHERE metadata->>'role' IS NOT NULL AND metadata->>'role' NOT IN ('CLIENT','DEMO')) team,COUNT(*) FILTER(WHERE metadata->>'role'='DEMO') demo,COUNT(*) FILTER(WHERE metadata->>'role' IS NULL) unknown,COUNT(DISTINCT "actorId") accounts FROM "AuditLog" WHERE action='AUTH_LOGIN' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY day ORDER BY day`,
  ]);
  const days = [];
  for (let n = start.getTime(); n < end.getTime(); n += 86400000) {
    const day = new Date(n).toISOString().slice(0, 10),
      a = daily.find((r) => r.day === day),
      l = logins.find((r) => r.day === day);
    days.push({
      day,
      views: Number(a?.views ?? 0),
      sessions: Number(a?.sessions ?? 0),
      impressions: Number(a?.impressions ?? 0),
      clicks: Number(a?.clicks ?? 0),
      logins: Number(l?.total ?? 0),
      clientLogins: Number(l?.clients ?? 0),
      teamLogins: Number(l?.team ?? 0),
      demoLogins: Number(l?.demo ?? 0),
      legacyLogins: Number(l?.unknown ?? 0),
      connectedAccounts: Number(l?.accounts ?? 0),
    });
  }
  const totals = days.reduce(
    (a, r) => ({
      views: a.views + r.views,
      sessions: a.sessions + r.sessions,
      impressions: a.impressions + r.impressions,
      clicks: a.clicks + r.clicks,
      logins: a.logins + r.logins,
      clientLogins: a.clientLogins + r.clientLogins,
      teamLogins: a.teamLogins + r.teamLogins,
      demoLogins: a.demoLogins + r.demoLogins,
      legacyLogins: a.legacyLogins + r.legacyLogins,
    }),
    {
      views: 0,
      sessions: 0,
      impressions: 0,
      clicks: 0,
      logins: 0,
      clientLogins: 0,
      teamLogins: 0,
      demoLogins: 0,
      legacyLogins: 0,
    },
  );
  return {
    from: range.from,
    to: range.to,
    totals,
    days,
    pages: pages.map((r) => ({ path: r.path, views: Number(r.views) })),
    campaigns: campaigns.map((r) => ({
      ...r,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
      ctr: Number(r.impressions)
        ? Number(((Number(r.clicks) * 100) / Number(r.impressions)).toFixed(2))
        : null,
    })),
  };
}
export function audienceCsv(
  report: Awaited<ReturnType<typeof audienceReport>>,
  kind: "audience" | "campaigns",
) {
  const rows: unknown[][] =
    kind === "audience"
      ? [
          [
            "Jour UTC",
            "Pages vues mesurées",
            "Sessions quotidiennes estimées",
            "Connexions réussies",
            "Connexions clients",
            "Connexions équipe",
            "Connexions de démonstration",
            "Connexions historiques sans rôle",
            "Comptes connectés distincts du jour",
            "Affichages publicitaires mesurés",
            "Clics mesurés",
          ],
          ...report.days.map((r) => [
            r.day,
            r.views,
            r.sessions,
            r.logins,
            r.clientLogins,
            r.teamLogins,
            r.demoLogins,
            r.legacyLogins,
            r.connectedAccounts,
            r.impressions,
            r.clicks,
          ]),
        ]
      : [
          [
            "Début UTC",
            "Fin UTC",
            "Campagne",
            "Annonceur",
            "Nature",
            "Emplacement",
            "Affichages mesurés",
            "Clics mesurés",
            "Taux de clic (%)",
          ],
          ...report.campaigns.map((r) => [
            report.from,
            report.to,
            r.title,
            r.sponsor,
            r.kind,
            r.placement,
            r.impressions,
            r.clicks,
            r.ctr ?? "",
          ]),
        ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
