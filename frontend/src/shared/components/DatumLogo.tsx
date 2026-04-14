"use client";

type DatumLogoProps = {
  className?: string;
  /** Font size in px. Controls overall scale. */
  size?: number;
  /** Override text color; defaults to currentColor (inherits from parent). */
  color?: string;
};

/**
 * Datum wordmark — thick rounded sans-serif with a cyan dot accent on the "t".
 * Renders as text so it always matches the site typography and scales cleanly.
 */
export function DatumLogo({ className = "", size = 22, color }: DatumLogoProps) {
  return (
    <span
      className={`relative inline-flex select-none items-baseline font-sans font-extrabold leading-none tracking-tight ${className}`}
      style={{
        fontSize: size,
        color: color ?? "currentColor",
        letterSpacing: "-0.03em",
      }}
      aria-label="Datum"
    >
      <span>Da</span>
      <span className="relative">
        t
        {/* Cyan dot — positioned above the 't' */}
        <span
          aria-hidden
          className="absolute rounded-full bg-primary"
          style={{
            width: size * 0.16,
            height: size * 0.16,
            top: -size * 0.1,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </span>
      <span>um</span>
    </span>
  );
}
