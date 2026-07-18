/**
 * Tripwaley logo lockup, built to the brand spec:
 * "trip" in bold red script with a gold sun as the dot of the i,
 * "waley" in clean ink, inside a red circular ring, tagline underneath.
 */

function SunDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="var(--color-gold)" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={12 + Math.cos(a) * 7}
            y1={12 + Math.sin(a) * 7}
            x2={12 + Math.cos(a) * 10}
            y2={12 + Math.sin(a) * 10}
            stroke="var(--color-gold)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** Horizontal lockup for the navbar */
export function LogoLockup({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {/* Ring mark */}
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2.5px] border-brand"
        aria-hidden="true"
      >
        <span className="font-script text-[1.35rem] font-bold leading-none text-brand">t</span>
        <SunDot className="absolute -right-0.5 -top-0.5 h-4 w-4" />
      </span>
      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className="flex items-baseline">
          <span className="relative font-script text-[1.7rem] font-bold leading-none text-brand">
            trip
            <SunDot className="absolute -top-1 right-[0.45rem] h-[0.62rem] w-[0.62rem]" />
          </span>
          <span
            className={`font-display text-[1.45rem] font-bold tracking-tight ${
              inverted ? "text-cream" : "text-ink"
            }`}
          >
            waley
          </span>
        </span>
        <span className="mt-0.5 font-script text-[0.8rem] leading-none text-brand">
          your complete travel guru
        </span>
      </span>
    </span>
  );
}

/** Full circular badge version (footer / hero flourish) */
export function LogoBadge({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <span
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-brand bg-cream ${className}`}
    >
      <span className="flex items-baseline">
        <span className="relative font-script text-[1.6rem] font-bold leading-none text-brand">
          trip
          <SunDot className="absolute -top-1 right-[0.4rem] h-[0.6rem] w-[0.6rem]" />
        </span>
        <span className="font-display text-[1.3rem] font-bold tracking-tight text-ink">waley</span>
      </span>
      <span className="mt-1 max-w-[80%] text-center font-script text-[0.62rem] leading-tight text-brand">
        your complete travel guru
      </span>
    </span>
  );
}
