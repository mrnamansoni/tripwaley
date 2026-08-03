/* SITE MEDIA — the single renderer for every photo/video on the site.
 *
 * A "media ref" is just a string, so every existing slot and gallery value
 * keeps working. It can be:
 *   • an uploaded file   /images/x.jpg · /uploads/y.mp4   → optimized <Image>
 *   • a pasted link      https://…/x.jpg · https://…/y.mp4
 *   • a video, either way                                 → looping <video>
 *
 * No hooks, so this renders inside server AND client components alike.
 * Pasted links deliberately use a plain <img> rather than next/image: it needs
 * no remotePatterns allow-list, so ANY host the owner pastes just works, and
 * the site never becomes an open image-proxy for strangers.
 */

import Image from "next/image";
import { isLocalMedia, isVideoMedia, normalizeMediaUrl } from "@/lib/types";

export interface SiteMediaProps {
  src: string;
  alt?: string;
  /** absolutely fill the nearest positioned ancestor (same idea as next/image fill) */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  /** above the fold — eager-loads and, for video, preloads properly */
  priority?: boolean;
  /** video only: still frame shown before the first frame decodes */
  poster?: string;
}

const FILL_CLS = "absolute inset-0 h-full w-full";

export default function SiteMedia({
  src,
  alt = "",
  fill,
  width,
  height,
  sizes,
  className = "",
  priority,
  poster,
}: SiteMediaProps) {
  const url = normalizeMediaUrl(src ?? "");
  if (!url) return null;

  /* ---- video ---- */
  if (isVideoMedia(src)) {
    return (
      <video
        // picked up by <VideoAutoPause> so offscreen loops stop burning battery
        data-tw-video=""
        src={url}
        poster={poster ? normalizeMediaUrl(poster) : undefined}
        className={`${fill ? FILL_CLS : ""} ${className}`.trim()}
        autoPlay
        muted
        loop
        playsInline
        // metadata only unless it's the hero: never let a below-fold loop
        // compete with the page for an Indian mobile connection
        preload={priority ? "auto" : "metadata"}
        {...(alt ? { "aria-label": alt } : { "aria-hidden": true })}
        tabIndex={-1}
      />
    );
  }

  /* ---- uploaded photo: full AVIF/WebP + resize pipeline ---- */
  if (isLocalMedia(url)) {
    return fill ? (
      <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    ) : (
      <Image
        src={url}
        alt={alt}
        width={width ?? 1600}
        height={height ?? 1067}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  /* ---- pasted photo link ---- */
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`${fill ? `${FILL_CLS} object-cover` : ""} ${className}`.trim()}
    />
  );
}
