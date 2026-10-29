// Vector adaptation of the supplied brand board; replace with the master artwork when available.
export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`brand-logo${light ? " brand-logo-light" : ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 168 126"
        className="brand-mark"
        fill="none"
        focusable="false"
      >
        <path
          d="M19 105V49L39 33"
          stroke="var(--brand-gold)"
          strokeWidth="13"
        />
        <path
          d="M19 108H48V22M65 91V12L86 29V72M46 108L115 48L154 83H141V108"
          stroke="currentColor"
          strokeWidth="13"
          strokeLinejoin="miter"
        />
        <rect
          x="86"
          y="87"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
        />
        <rect
          x="105"
          y="87"
          width="13"
          height="13"
          rx="1.5"
          fill="var(--brand-gold)"
        />
        <rect
          x="86"
          y="106"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
        />
        <rect
          x="105"
          y="106"
          width="13"
          height="13"
          rx="1.5"
          fill="var(--brand-gold)"
        />
      </svg>
      <span className="brand-wordmark">
        <span className="brand-name">BARKA</span>
        <span className="brand-sarl">SARL</span>
        <span className="brand-tagline">L’immobilier en toute confiance</span>
      </span>
    </span>
  );
}
