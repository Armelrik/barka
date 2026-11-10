"use client";

import { ArrowUp } from "lucide-react";
import { useScrollPast } from "@/lib/client/use-scroll-past";

export function ScrollToTop() {
  const visible = useScrollPast(400);
  return (
    <button
      type="button"
      className="scroll-to-top"
      hidden={!visible}
      aria-label="Retour en haut de la page"
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }}
    >
      <ArrowUp size={22} aria-hidden="true" />
    </button>
  );
}
