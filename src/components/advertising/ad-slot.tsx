"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowUpRight,
} from "lucide-react";
import type { PublicAd } from "@/modules/advertising/service";
import { sendAudience } from "@/components/audience/tracking";
function subscribeMotion(fn: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
}
function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function AdSlot({
  ads,
  placement,
}: {
  ads: PublicAd[];
  placement: "HERO" | "AFTER_HERO" | "BEFORE_FOOTER";
}) {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [manualPlay, setManualPlay] = useState(false),
    [hover, setHover] = useState(false),
    [now, setNow] = useState(0),
    reduced = useSyncExternalStore(subscribeMotion, reducedMotion, () => true),
    container = useRef<HTMLElement>(null);
  const eligible = ads.filter((a) => !now || Date.parse(a.endsAt) > now),
    ad = eligible[index % Math.max(1, eligible.length)];
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (
        !paused &&
        !hover &&
        (!reduced || manualPlay) &&
        document.visibilityState === "visible"
      )
        setIndex((v) => v + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, [paused, hover, reduced, manualPlay]);
  useEffect(() => {
    if (!ad || !container.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observed = false;
    const observe = new IntersectionObserver(
      (entries) => {
        const visible =
          entries[0]?.isIntersecting &&
          entries[0]?.intersectionRatio >= 0.5 &&
          document.visibilityState === "visible";
        if (timer) clearTimeout(timer);
        if (visible && !observed)
          timer = setTimeout(() => {
            if (document.visibilityState === "visible") {
              sendAudience("AD_IMPRESSION", ad.id, placement);
              observed = true;
            }
          }, 1000);
      },
      { threshold: [0, 0.5, 1] },
    );
    observe.observe(container.current);
    const visibility = () => {
      if (timer) clearTimeout(timer);
      if (document.visibilityState === "visible" && container.current) {
        observe.unobserve(container.current);
        observe.observe(container.current);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observe.disconnect();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ad, placement]);
  if (!ad)
    return (
      <section
        className={`ad-slot ad-slot-${placement.toLowerCase()} ad-empty`}
        aria-label="Espace publicitaire"
      >
        <span>Votre marque, au cœur des projets immobiliers</span>
        <a href="/contact#professionnels">
          Présenter votre offre <ArrowUpRight size={16} />
        </a>
      </section>
    );
  return (
    <section
      ref={container}
      className={`ad-slot ad-slot-${placement.toLowerCase()}`}
      aria-roledescription="carrousel"
      aria-label={placement === "HERO" ? "Annonces à la une" : "Publicités"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
    >
      <a
        className="ad-creative"
        href={ad.targetUrl}
        {...(/^https:\/\//i.test(ad.targetUrl)
          ? { target: "_blank", rel: "sponsored noopener noreferrer" }
          : {})}
        onClick={() => sendAudience("AD_CLICK", ad.id, placement)}
      >
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          unoptimized
          sizes={
            placement === "HERO"
              ? "(max-width: 900px) 90vw, 420px"
              : "(max-width: 900px) 95vw, 1280px"
          }
        />
        <div className="ad-shade" />
        <div className="ad-copy">
          <span className="ad-disclosure">
            {ad.campaignKind === "HOUSE"
              ? "Publicité BARKA · Autopromotion"
              : "Publicité sponsorisée"}
          </span>
          <span className="ad-sponsor">{ad.sponsorName}</span>
          <h2>{ad.title}</h2>
          {ad.description && <p>{ad.description}</p>}
          <span className="ad-cta">
            {ad.cta}
            <ArrowUpRight size={17} />
          </span>
        </div>
      </a>
      {eligible.length > 1 && (
        <div className="ad-controls">
          <div>
            <button
              type="button"
              aria-label="Publicité précédente"
              onClick={() =>
                setIndex((v) => (v - 1 + eligible.length) % eligible.length)
              }
            >
              <ChevronLeft size={18} />
            </button>
            <span aria-live="polite">
              {(index % eligible.length) + 1} / {eligible.length}
            </span>
            <button
              type="button"
              aria-label="Publicité suivante"
              onClick={() => setIndex((v) => v + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            aria-label={
              paused || (reduced && !manualPlay)
                ? "Lancer le défilement publicitaire"
                : "Mettre en pause le défilement publicitaire"
            }
            aria-pressed={paused}
            onClick={() => {
              if (paused || (reduced && !manualPlay)) {
                setPaused(false);
                setManualPlay(true);
              } else setPaused(true);
            }}
          >
            {paused || (reduced && !manualPlay) ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
