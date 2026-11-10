"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
export function NavigationScrollReset() {
  const pathname = usePathname(),
    restore = useRef<string | null>(null);
  useEffect(() => {
    const onPop = () => {
      restore.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useLayoutEffect(() => {
    const restoring = restore.current === pathname;
    restore.current = null;
    if (restoring || window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
