# SEO content strategy — design

**Date:** 2026-09-19 · **Status:** approved in conversation, awaiting spec review

## Goal

Rank tripwaley.com for the questions Indian travellers search before booking a
group trip, and turn those readers into bookings, with a content pipeline that
AI drafts and a person approves.

## Decisions (owner, 2026-09-19)

| Question | Decision |
|---|---|
| Content source | AI drafts from a keyword plus a brief; **a person approves every piece** |
| Stories on trip pages | Each story has **its own URL**; trip pages show an expandable, tabbed list of summaries linking out |
| Keyword data | **Free Google autocomplete** (suggestqueries endpoint, `gl=in`); no paid tools |
| Cadence | **5 drafts per week** |
| Architecture | Stories attach to **destinations**, not trips (trips churn; 13 trip URLs had to be redirected on 2026-09-19) |

## What the keyword research showed

Autocomplete for every destination returns the same question set:

- **Facts:** distance, height or altitude, temperature or weather
- **Planning:** best time, difficulty level, "is it safe", how to reach, by bus or by train
- **Money:** cost, cost from [city], package from Delhi
- **Time:** "weekend trip from delhi in [month]", "group trips from delhi in december"

Examples: *kedarkantha trek difficulty level*, *kedarkantha trek cost from
delhi*, *triund trek distance*, *jibhi weather*, *kedarnath trip cost for 4
person*, *weekend trip from delhi in monsoon*, *trips from lucknow*.

## 1. Page roles and keyword ownership

| Page | Job | Intent it targets | Example |
|---|---|---|---|
| Trip `/trips/x` | Sell | package / tour / from Delhi | kedarkantha trek package from delhi |
| Destination `/destinations/x` | Pillar page for its topic group | head term + trip / group tour | spiti group trip |
| City `/from/x` | Local | trips from [city], [place] trip from [city] | trips from lucknow |
| Category (/solo, /honeymoon, /college-trips, /group-departures) | Audience | [audience] trip | solo trip for girls in india |
| Story `guide` | Answer one question | informational | kedarkantha trek difficulty level |
| Story `cost` | Money question, then point to the trip | commercial | kedarnath trip cost from delhi |
| Story `seasonal` | Date-based list | informational | weekend trip from delhi in december |
| Story `report` | Real customer or captain experience | experience | kedarkantha trip experience |

**Rule: one keyword, one page.** A trip page never targets "difficulty"; a
guide never targets "package". The drafting prompt follows this, and admin warns when two stories claim the same keyword.

## 2. Story model

Extend `BlogPost` (src/lib/types.ts). Every new field is optional, so the 6
existing stories keep working unchanged.

| Field | Type | Purpose |
|---|---|---|
| `kind` | `"guide" \| "cost" \| "seasonal" \| "report"` | Tab and template; missing = `report` |
| `destinations` | `string[]` | Destination slugs from `DESTINATIONS` (src/lib/destinations.ts) |
| `keyword` | `string` | The single keyword this page owns; unique across stories |
| `faqs` | `{ q: string; a: string }[]` | 3–5 pairs, output as FAQPage schema |
| `status` | `"draft" \| "approved" \| "published"` | Missing = derived from `published` |
| `summary` | `string` | The short answer shown first on the page and as the card line |

Existing stories: set `kind: "report"` and assign destinations in admin. Their
`new-story-N` slugs are renamed to titles, with the old slug kept as an alias
that 308s (same mechanism as `slugAliases` for trips).

## 3. Trip page: "Before you go"

Placed below the itinerary, above More trips. A `<details>` element, collapsed
by default, with one tab per `kind` that has stories for any of the trip's
destinations (`destinationsFor(pkg)`). Each row: title, one-line summary, read
time, link. **The links are server-rendered HTML even while collapsed.** If
there are no stories, nothing renders.

## 4. Story page

H1 → `summary` (the answer in 2–3 lines) → body → FAQ (+ FAQPage JSON-LD) →
"Go on this trip" card listing live trips for the story's destinations →
related stories for the same destination → link to the destination page.
`Article` JSON-LD with `dateModified`.

**Live values:** the body may contain `{{price <trip-slug> <city-slug>}}` and
`{{next-departure <trip-slug>}}`, which are filled in when the page is
rendered. If the trip is gone, a `price` token renders "see current trips"
with a link and never a stale number.

## 5. /stories hub

- `/stories`: filter by destination and by topic; reports shown first.
- `/stories/topic/[kind]`: indexable topic pages.
- Destination pages gain a "Guides" list of that destination's stories. This is
  what makes them the pillar pages.
- Seasonal stories list trips with departures in the named month, from
  departures data.
- All story, topic and hub URLs go in the sitemap; drafts never do.

## 6. Automation (n8n; built after the site parts)

**Keyword finder, weekly.** Seeds = each destination that has a live trip ×
modifiers (best time, difficulty, cost, cost from [each priced city], distance,
height, how to reach, is it safe, weather, what to pack, by bus, by train,
in [month]). Expand each seed through autocomplete, drop keywords an existing
story already uses, and add the rest to a keyword queue. Order: destinations with
upcoming departures first; `cost` and `guide` topics before `seasonal`.

**Draft writer, daily; at most 5 per week.** Takes the top keyword, fetches
that destination's live facts (itinerary, altitude, pickup cities, departure
months, inclusions) from a token-protected endpoint, and drafts with Claude
against the template for its `kind`. It POSTs to a token-protected draft
endpoint and sends a WhatsApp notification. **It pauses when 10 or more drafts
are waiting for review.**

**Review in admin → Stories → Drafts:** edit, **Approve & publish**, or
**Reject**. A rejected keyword is marked `rejected` and is not redrafted.

The keyword queue lives in its own data file (`data/keywords.json`), not the
catalog, so the pipeline's writes never touch catalog saves.

## 7. Quality: the review is the filter

**The one hard rule: the draft endpoint can only create `status: "draft"`.**
Nothing reaches the site without someone clicking Publish in admin. The
endpoint accepts whatever the writer produces; it never rejects a draft.

Everything else is handled by the drafting prompt and by what admin *shows*
the reviewer, never by refusing a draft:

1. **Prices** use `{{price …}}` and `{{next-departure …}}` tokens, filled in
   when the page renders, so a story can never show a stale price. The prompt
   instructs the writer to use them.
2. **Voice:** the prompt writes guides as Tripwaley's advice and keeps the "I"
   voice for trip reports.
3. **Duplicate keywords:** if another story already has the same `keyword`,
   admin shows a warning on the draft naming that story, with a link. The
   reviewer decides whether to change it, merge, or publish anyway.
4. **Substance:** the prompt asks for at least 600 words on a guide or cost
   piece, the answer in the first 60 words, and 3–5 FAQs. Admin displays word
   count and whether a summary and FAQs are present, so a thin draft is
   obvious at a glance.

Trade-off, stated plainly: with no automatic checks, a weak or duplicate piece
reaches the site if it is approved without being read. The review is the only
thing standing between a draft and Google.

## 8. First 12 weeks (60 pieces)

- **Weeks 1–4:** `cost` + `best time` for the 8 destinations with the most live
  trips and departures.
- **Weeks 5–8:** `difficulty`, `how to reach`, `what to pack` for the same 8.
- **Weeks 9–12:** seasonal (winter treks; December and New Year from Delhi)
  and `trips from [city]` for the 12 departure cities.
- **Ongoing:** trip reports from customers via a WhatsApp form after each
  departure returns.

## 9. Measures

Search Console impressions and clicks per story URL; count of story URLs
indexed; GA event on clicks from a story to a trip page. Review at week 6 and
week 12; keep the topics that earn impressions and drop the ones that don't.

## Build order (each is its own plan)

1. Story model + story page + trip-page "Before you go" + hub + sitemap +
   duplicate-keyword warning. **Everything on the site, fed by hand at first.**
2. Admin: drafts queue, approve/reject, destination/kind/keyword editing, slug
   rename for the 6 existing stories.
3. Draft and facts endpoints (token-protected) with the guardrail checks.
4. n8n keyword finder and draft writer.

## Out of scope

Paid keyword tools; auto-publishing; translation; backlink outreach.
