"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { publicAudiencePath } from "@/modules/audience/validation";
import {
  trackingAllowed,
  subscribePreference,
  viewIdentity,
  sendAudience,
} from "./tracking";
export function SiteAnalytics() {
  const pathname = usePathname(),
    allowed = useSyncExternalStore(
      subscribePreference,
      trackingAllowed,
      () => false,
    );
  useEffect(() => {
    viewIdentity(pathname);
    if (allowed) sendAudience("PAGE_VIEW");
  }, [pathname, allowed]);
  return allowed &&
    publicAudiencePath(pathname) &&
    process.env.NODE_ENV === "production" ? (
    <Analytics
      beforeSend={(event) => {
        if (!trackingAllowed()) return null;
        const url = new URL(event.url),
          path = publicAudiencePath(url.pathname);
        if (!path) return null;
        url.pathname = path;
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  ) : null;
}
