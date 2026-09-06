"use client";

import type { LeadSource } from "./webhookPayload";

/**
 * What the browser knows about where a lead came from.
 *
 * The server re-checks `page` against the Referer header (see resolveSource),
 * so this is a claim, not a verdict — but it is the only place that knows which
 * CONTROL was used, and on a creator page, which creator sent the visitor.
 *
 * UTM values are read from the URL and remembered for the session, because the
 * booking almost never happens on the landing hit: someone arrives from an
 * Instagram link with ?utm_source=instagram, browses three trips, and books.
 * Without stashing them the campaign that paid for the lead gets no credit.
 */

const UTM_KEY = "tw-utm";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type Utm = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

function readUtm(): Utm {
  if (typeof window === "undefined") return {};
  let stored: Utm = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}") as Utm;
  } catch {
    /* private mode, or a hand-edited value — behave as if there were none */
  }

  const params = new URLSearchParams(window.location.search);
  const fresh: Utm = {};
  for (const f of UTM_FIELDS) {
    const v = params.get(f);
    if (v) fresh[f] = v.slice(0, 120);
  }

  // a fresh campaign hit replaces the remembered one; otherwise keep it
  if (Object.keys(fresh).length) {
    try {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
    } catch {
      /* storage unavailable — the values still travel with this lead */
    }
    return fresh;
  }
  return stored;
}

/** the creator whose page we're on, or null — derived from the URL, not props,
 *  so any control anywhere on a creator page attributes correctly */
function creatorFromPath(path: string): string | null {
  const m = /^\/travel-with\/([a-z0-9-]+)/.exec(path);
  return m ? m[1] : null;
}

export function leadSource(surface: string, extra?: { packageSlug?: string; creator?: string }): LeadSource {
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  const utm = readUtm();
  return {
    page: path,
    surface,
    creator: extra?.creator ?? creatorFromPath(path),
    packageSlug: extra?.packageSlug ?? null,
    utmSource: utm.utm_source ?? null,
    utmMedium: utm.utm_medium ?? null,
    utmCampaign: utm.utm_campaign ?? null,
    utmContent: utm.utm_content ?? null,
    utmTerm: utm.utm_term ?? null,
  };
}
