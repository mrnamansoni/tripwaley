"use client";

/* Fires Meta ViewContent + GA4 view_item for a trip detail page.
 *
 * The trip pages are server components, and these events must run in the
 * browser — so this is a render-nothing client island that the page drops in
 * with the trip's real name, slug and fare. Keyed on the slug so a
 * client-side navigation between two trip pages reports both, not just the
 * first one React happened to mount. */

import { useEffect } from "react";
import { trackViewContent } from "@/lib/analytics";

export default function TrackTripView({ slug, name, price }: { slug: string; name: string; price?: number }) {
  useEffect(() => {
    trackViewContent({ slug, name, price });
  }, [slug, name, price]);
  return null;
}
