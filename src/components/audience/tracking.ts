"use client";
import { publicAudiencePath } from "@/modules/audience/validation";
const sent = new Set<string>();
export const preferenceKey = "barka.audience.disabled";
let lastPath = "",
  lastView = "",
  memorySession = globalThis.crypto?.randomUUID?.() || "";
export function trackingAllowed() {
  if (
    typeof window === "undefined" ||
    navigator.webdriver ||
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return false;
  try {
    return localStorage.getItem(preferenceKey) !== "1";
  } catch {
    return true;
  }
}
export function viewIdentity(path: string) {
  if (path !== lastPath || !lastView) {
    lastPath = path;
    lastView = crypto.randomUUID();
  }
  return lastView;
}
function sessionIdentity() {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem("barka.audience.session") || "null",
    );
    const id =
      stored &&
      typeof stored.id === "string" &&
      /^[a-f0-9-]{36}$/i.test(stored.id) &&
      Date.now() - stored.at < 1800000
        ? stored.id
        : crypto.randomUUID();
    sessionStorage.setItem(
      "barka.audience.session",
      JSON.stringify({ id, at: Date.now() }),
    );
    return id;
  } catch {
    memorySession ||= crypto.randomUUID();
    return memorySession;
  }
}
export function sendAudience(
  kind: "PAGE_VIEW" | "AD_IMPRESSION" | "AD_CLICK",
  campaignId?: string,
  placement?: string,
) {
  if (!trackingAllowed()) return;
  const path = window.location.pathname,
    normalized = publicAudiencePath(path);
  if (!normalized) return;
  const viewId = viewIdentity(path);
  const key = `${viewId}:${kind}:${campaignId || ""}:${placement || ""}`;
  if (sent.has(key)) return;
  if (sent.size > 1000) sent.clear();
  sent.add(key);
  const body = JSON.stringify({
    sessionId: sessionIdentity(),
    viewId,
    kind,
    path: normalized,
    device: /iPad|Tablet/i.test(navigator.userAgent)
      ? "TABLET"
      : /Mobile|Android|iPhone/i.test(navigator.userAgent)
        ? "MOBILE"
        : "DESKTOP",
    ...(campaignId ? { campaignId, placement } : {}),
  });
  const blob = new Blob([body], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/v1/audience", blob))
    void fetch("/api/v1/audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
}
export function subscribePreference(change: () => void) {
  window.addEventListener("storage", change);
  window.addEventListener("barka-audience-preference", change);
  return () => {
    window.removeEventListener("storage", change);
    window.removeEventListener("barka-audience-preference", change);
  };
}
