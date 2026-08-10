/* THE CREATOR FIGURE — the single most important element on these pages.
 *
 * The design these pages are built for uses a transparent-background PNG of
 * the creator: no frame, no box, just the person standing in the layout with
 * copy arranged around them. That is what `cutout` is for.
 *
 * We rarely have one on day one. A creator sends a normal photo — shot on a
 * road with a bus and a sky in it. Dropping that into a cutout layout looks
 * broken, so this component switches treatment instead of degrading:
 *
 *   cutout present → rendered bare, with a warm contact shadow so the figure
 *                    reads as standing on the page.
 *   photo only     → an editorial poster panel: arched top, framed on the
 *                    face via `focal`, and masked so the bottom dissolves
 *                    into the section instead of ending on a hard rectangle.
 *                    That bottom fade is what stops it reading as "photo in
 *                    a box" and lets the same layout hold either input.
 *
 * So the page is correct now and gets better — with zero layout changes —
 * the moment a real cutout is uploaded.
 */

import SiteMedia from "@/components/site/SiteMedia";
import { isVideoMedia, normalizeMediaUrl } from "@/lib/types";

export type FigureVariant = "hero" | "panel" | "flank";

export default function CreatorFigure({
  cutout,
  portrait,
  focal = "50% 30%",
  alt,
  variant = "hero",
  className = "",
  priority,
}: {
  cutout?: string;
  portrait: string;
  focal?: string;
  alt: string;
  variant?: FigureVariant;
  className?: string;
  priority?: boolean;
}) {
  // A figure slot takes a cut-out PNG, an ordinary photo, or a video, and the
  // right treatment differs. JPEG cannot carry transparency, so a .jpg here is
  // definitely NOT a cut-out — rendering it bare would letterbox it inside the
  // tall figure box. Anything that CAN be transparent (png/webp/avif/svg) or
  // is a video gets the bare poster treatment; a jpg falls to the panel.
  const ref = (cutout ?? "").trim();
  const hasCutout = !!ref && (isVideoMedia(ref) || !/\.jpe?g(\?|#|$)/i.test(normalizeMediaUrl(ref)));

  if (hasCutout) {
    return (
      <div className={`relative ${className}`}>
        <SiteMedia
          src={ref}
          alt={alt}
          fill
          sizes={variant === "hero" ? "(max-width:640px) 78vw, 42vw" : "(max-width:640px) 60vw, 30vw"}
          priority={priority}
          className="object-contain object-bottom"
        />
        {/* contact shadow — without it a cutout floats and looks pasted on */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] bottom-0 h-6 rounded-[50%] blur-lg"
          style={{ background: "rgba(26,22,20,0.45)" }}
        />
      </div>
    );
  }

  /* ---- poster panel: a real photo, treated so it belongs ---- */
  const arch =
    variant === "flank"
      ? "1.25rem"
      : "50% 50% 1rem 1rem / 30% 30% 1rem 1rem";

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: arch,
          // dissolve the bottom edge into the section behind it
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 74%, rgba(0,0,0,0.35) 92%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 74%, rgba(0,0,0,0.35) 92%, transparent 100%)",
        }}
      >
        <SiteMedia
          src={portrait}
          alt={alt}
          fill
          sizes={variant === "hero" ? "(max-width:640px) 78vw, 42vw" : "(max-width:640px) 60vw, 30vw"}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: focal }}
        />
        {/* a touch of depth so the panel doesn't read flat */}
        <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 -70px 90px -40px rgba(26,22,20,0.55)" }} />
      </div>
    </div>
  );
}

/** Small round avatar — calendar rows, roster chips, date cells. */
export function CreatorAvatar({
  src,
  focal = "50% 30%",
  alt,
  size = 40,
  ring = "ring-gold/70",
  className = "",
}: {
  src: string;
  focal?: string;
  alt: string;
  size?: number;
  ring?: string;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ring-2 ${ring} ${className}`}
      style={{ width: size, height: size }}
    >
      <SiteMedia
        src={src}
        alt={alt}
        fill
        sizes={`${size * 2}px`}
        className="object-cover"
        style={{ objectPosition: focal }}
      />
    </span>
  );
}
