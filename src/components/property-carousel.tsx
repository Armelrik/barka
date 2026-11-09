"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

type Photo = { url: string; alt: string };
export function PropertyCarousel({
  photos,
  title,
  href,
  detail = false,
  unoptimized = false,
}: {
  photos: Photo[];
  title: string;
  href?: string;
  detail?: boolean;
  unoptimized?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const swiped = useRef(false);
  const current = photos[index % Math.max(photos.length, 1)];
  const move = (delta: number) =>
    setIndex((value) => (value + delta + photos.length) % photos.length);
  const picture = current ? (
    <Image
      src={current.url}
      alt={current.alt}
      fill
      unoptimized={unoptimized}
      sizes={
        detail
          ? "(max-width: 1024px) 95vw, 65vw"
          : "(max-width: 640px) 95vw, (max-width: 1024px) 46vw, 31vw"
      }
    />
  ) : (
    <span className="asset-placeholder">Photographie à venir</span>
  );
  return (
    <div
      className={`property-carousel ${detail ? "detail-photo" : "card-visual"}`}
      role="region"
      aria-roledescription="carrousel"
      aria-label={`Photos : ${title}`}
      onKeyDown={(event) => {
        if (
          photos.length > 1 &&
          ["ArrowLeft", "ArrowRight"].includes(event.key)
        ) {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
      onTouchStart={(event) => {
        start.current = event.touches[0].clientX;
        swiped.current = false;
      }}
      onTouchEnd={(event) => {
        if (start.current !== null && photos.length > 1) {
          const delta = event.changedTouches[0].clientX - start.current;
          if (Math.abs(delta) > 45) {
            swiped.current = true;
            move(delta < 0 ? 1 : -1);
          }
        }
        start.current = null;
      }}
    >
      {href ? (
        <Link
          className="carousel-picture"
          href={href}
          aria-label={`Découvrir : ${title}`}
          onClick={(event) => {
            if (swiped.current) {
              event.preventDefault();
              swiped.current = false;
            }
          }}
        >
          {picture}
        </Link>
      ) : (
        <div className="carousel-picture">{picture}</div>
      )}
      {photos.length > 1 && (
        <>
          <button
            className="carousel-arrow carousel-prev"
            type="button"
            aria-label="Photo précédente"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="carousel-arrow carousel-next"
            type="button"
            aria-label="Photo suivante"
            onClick={() => move(1)}
          >
            <ChevronRight size={20} />
          </button>
          <span
            className="carousel-counter"
            aria-live="polite"
            aria-atomic="true"
          >
            <Images size={14} />
            {(index % photos.length) + 1} / {photos.length}
          </span>
          <div
            className="carousel-dots"
            role="group"
            aria-label="Choisir une photo"
          >
            {photos.map((photo, i) => (
              <button
                key={`${photo.url}-${i}`}
                type="button"
                aria-label={`Photo ${i + 1} sur ${photos.length}`}
                aria-pressed={index % photos.length === i}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
