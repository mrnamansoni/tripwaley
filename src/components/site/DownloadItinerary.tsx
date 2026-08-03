/* DOWNLOAD ITINERARY — the printable PDF for a trip.
 *
 * The owner pastes an ordinary Google Drive (or Dropbox) *share* link in the
 * admin; fileDownloadUrl() rewrites it to the direct-download form, because a
 * raw share link opens Drive's preview page instead of downloading anything.
 *
 * Renders nothing when no link is set, so trips without a PDF simply don't
 * show the button.
 */

import { fileDownloadUrl } from "@/lib/types";

export default function DownloadItinerary({
  href,
  label = "Download itinerary",
  tone = "light",
  className = "",
}: {
  href?: string;
  label?: string;
  tone?: "light" | "dark" | "solid";
  className?: string;
}) {
  const url = fileDownloadUrl(href ?? "");
  if (!url) return null;

  const cls =
    tone === "solid"
      ? "bg-brand text-white shadow-red hover:bg-brand-bright"
      : tone === "dark"
        ? "border border-white/25 text-white hover:border-gold hover:text-gold"
        : "border border-line bg-card text-ink hover:border-brand hover:text-brand";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      // hints the browser to download rather than navigate; cross-origin hosts
      // may still choose to display it, which is why the link opens in a new tab
      download
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${cls} ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {label}
      <span className="text-[0.6rem] font-bold uppercase tracking-wider opacity-50">pdf</span>
    </a>
  );
}
