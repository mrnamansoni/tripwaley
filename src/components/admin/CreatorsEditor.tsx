"use client";

/* CREATORS — the Travel-with-a-Creator control panel.
 *
 * Three levels, one tab:
 *   list      → every creator, publish toggle, trip count
 *   creator   → profile, media, socials, perks, Q&A, gallery
 *   trip      → one package they run: their headline, price, dates, and
 *               optional itinerary / inclusions overrides
 *
 * Overrides are deliberately opt-in: an empty field inherits the package,
 * so the owner only fills in what genuinely differs for the creator's batch.
 */

import { useState } from "react";
import { useAdmin, Field, Area, Btn, Head, input, label, linesToArr, arrToLines } from "./ui";
import MediaPicker from "./MediaPicker";
import { CREATOR_POSE_DEFS } from "@/lib/types";
import type { Creator, CreatorFigures, CreatorPose, CreatorTrip, CreatorTripDate, ItineraryDay, Meal } from "@/lib/types";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

const blankCreator = (n: number): Creator => ({
  slug: `creator-${n}`,
  name: "New Creator",
  firstName: "New",
  handle: "@handle",
  epithet: "",
  tagline: "",
  bio: "",
  city: "",
  niche: "",
  accent: "gold",
  cutout: "",
  figures: {},
  portrait: "/images/tw-captain-1.jpg",
  focal: "50% 30%",
  cover: "/images/tw-snow-road.jpg",
  gallery: [],
  reel: "",
  socials: [],
  quote: "",
  qa: [],
  perks: [],
  trips: [],
  published: false,
});

export default function CreatorsEditor() {
  const { data, save } = useAdmin();
  const [creators, setCreators] = useState<Creator[]>(() =>
    (data.catalog.creators ?? []).map((c) => ({ ...c, trips: c.trips ?? [] }))
  );
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openTrip, setOpenTrip] = useState<string | null>(null);

  const creator = creators.find((c) => c.slug === openSlug) ?? null;
  const trip = creator?.trips.find((t) => t.packageSlug === openTrip) ?? null;

  const upd = (patch: Partial<Creator>) =>
    setCreators((all) => all.map((c) => (c.slug === openSlug ? { ...c, ...patch } : c)));
  const updTrip = (patch: Partial<CreatorTrip>) =>
    upd({ trips: (creator?.trips ?? []).map((t) => (t.packageSlug === openTrip ? { ...t, ...patch } : t)) });

  const livePackages = data.catalog.packages.filter((p) => p.status === "live");
  const pkgOf = (slug: string) => data.catalog.packages.find((p) => p.slug === slug);

  /* ---------------------------------------------- list ---------------- */
  if (!creator) {
    return (
      <>
        <Head title="Creators" sub="Every creator collab. Each creator gets a page, and each trip they run gets its own page under it.">
          <Btn tone="ghost" onClick={() => {
            const c = blankCreator(creators.length + 1);
            setCreators((all) => [c, ...all]);
            setOpenSlug(c.slug);
          }}>+ New creator</Btn>
          <Btn onClick={() => save("creators", creators)}>Save all</Btn>
        </Head>

        {creators.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
            No creators yet — add one to start a collab.
          </p>
        )}

        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {creators.map((c) => (
            <div key={c.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => setOpenSlug(c.slug)} className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold">
                {c.name}
                <span className="ml-2 font-mono text-[0.6rem] text-white/35">{c.handle}</span>
              </button>
              <span className="hidden text-xs text-white/40 sm:block">
                {c.trips.length} {c.trips.length === 1 ? "trip" : "trips"} ·{" "}
                {c.trips.reduce((n, t) => n + t.dates.length, 0)} dates
              </span>
              <button
                type="button"
                onClick={() => setCreators((all) => all.map((x) => (x.slug === c.slug ? { ...x, published: !x.published } : x)))}
                className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
                  c.published ? "bg-success/20 text-success" : "bg-white/10 text-white/45"
                }`}
              >
                {c.published ? "live" : "hidden"}
              </button>
              <a href={`/travel-with/${c.slug}`} target="_blank" rel="noreferrer" className="text-[0.6rem] font-bold uppercase tracking-wider text-white/40 hover:text-gold">↗ view</a>
              <Btn tone="ghost" onClick={() => setOpenSlug(c.slug)}>edit →</Btn>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ---------------------------------------------- one trip ------------ */
  if (trip) {
    const base = pkgOf(trip.packageSlug);
    const overriding = (trip.itinerary?.length ?? 0) > 0;
    return (
      <>
        <Head title={trip.headline || base?.name || trip.packageSlug} sub={`${creator.name} · /travel-with/${creator.slug}/${trip.packageSlug}`}>
          <Btn tone="ghost" onClick={() => setOpenTrip(null)}>← Back to {creator.firstName}</Btn>
          <Btn onClick={() => save("creators", creators)}>Save all</Btn>
        </Head>

        {!base && (
          <div className="mb-5 max-w-5xl rounded-2xl border-2 border-brand bg-brand/10 p-4">
            <p className="font-bold text-brand">⚠ This trip is invisible on the site</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              It points at package <code className="font-mono text-white">{trip.packageSlug}</code>, which no
              longer exists — most likely its slug was changed. The trip is published and its dates are fine;
              the site drops it because the package cannot be found.
              <br />
              <b className="text-white">Pick the correct package below and Save all.</b> You must actively
              change the dropdown — re-saving without touching it keeps the broken value.
            </p>
          </div>
        )}

        <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
          <label className={label}>package
            <select
              value={trip.packageSlug}
              onChange={(e) => { const v = e.target.value; updTrip({ packageSlug: v }); setOpenTrip(v); }}
              className={`${input} ${base ? "" : "border-brand"}`}
            >
              {/* A dead slug is NOT in livePackages, so without this option the
                  browser falls back to showing the FIRST package — which looks
                  like a valid choice while the broken value is what's saved. */}
              {!base && <option value={trip.packageSlug}>⚠ missing: {trip.packageSlug}</option>}
              {livePackages.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <label className={label}>status
            <select value={trip.published ? "live" : "hidden"} onChange={(e) => updTrip({ published: e.target.value === "live" })} className={input}>
              <option value="live">live — on the site</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          <Field l="headline (blank = package name)" v={trip.headline ?? ""} on={(v) => updTrip({ headline: v })} />
          <Field l="₹ price per seat (blank = package price)" v={trip.price ?? ""} type="number" on={(v) => updTrip({ price: v ? Number(v) : undefined })} />
          <div className="sm:col-span-2"><Area l="pitch — one line in their voice" v={trip.pitch ?? ""} on={(v) => updTrip({ pitch: v })} rows={2} /></div>
        </div>

        <div className="mt-6 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <MediaPicker label="hero photo / video for this trip (blank = package hero)" value={trip.heroMedia ?? ""} onChange={(v) => updTrip({ heroMedia: v })} aspect="aspect-video" />
        </div>

        {/* ---- dates ---- */}
        <div className="mt-8 max-w-5xl">
          <div className="mb-2 flex items-center justify-between">
            <p className={label}>departure dates &amp; seats</p>
            <Btn tone="ghost" onClick={() => updTrip({ dates: [...trip.dates, { date: "", seats: 15, seatsLeft: 15 }] })}>+ date</Btn>
          </div>
          <div className="space-y-2">
            {trip.dates.map((d, i) => {
              const patch = (p: Partial<CreatorTripDate>) =>
                updTrip({ dates: trip.dates.map((x, j) => (j === i ? { ...x, ...p } : x)) });
              return (
                <div key={i} className="grid grid-cols-[10rem_6rem_6rem_1fr_auto] items-end gap-2">
                  <Field l="date" v={d.date} type="date" on={(v) => patch({ date: v })} />
                  <Field l="seats" v={d.seats} type="number" on={(v) => patch({ seats: Number(v) || 0 })} />
                  <Field l="left" v={d.seatsLeft} type="number" on={(v) => patch({ seatsLeft: Number(v) || 0 })} />
                  <Field l="hook (optional)" v={d.hook ?? ""} on={(v) => patch({ hook: v })} />
                  <Btn tone="danger" onClick={() => updTrip({ dates: trip.dates.filter((_, j) => j !== i) })}>✕</Btn>
                </div>
              );
            })}
            {trip.dates.length === 0 && <p className="text-xs text-white/40">No dates yet — this trip won&apos;t show on the site.</p>}
          </div>
        </div>

        {/* ---- figures just for this trip ---- */}
        <div className="mt-8 max-w-5xl">
          <p className={label}>figures for this trip only</p>
          <p className="mt-1 text-xs text-white/40">
            Set a different pose for this trip. Empty = use {creator.firstName}&apos;s figure for that placement.
          </p>
          <div className="mt-4 flex flex-wrap gap-5">
            {CREATOR_POSE_DEFS.filter((p) => p.key !== "hero").map((pose) => (
              <div key={pose.key} className="w-52 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <MediaPicker
                  label={pose.label}
                  value={trip.figures?.[pose.key] ?? ""}
                  onChange={(v) => updTrip({ figures: setFigure(trip.figures, pose.key, v) })}
                />
                <p className="mt-2 text-[0.62rem] leading-snug text-white/40">{pose.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ---- overrides ---- */}
        <div className="mt-8 max-w-5xl rounded-2xl border border-gold/25 bg-gold/[0.06] p-4">
          <p className="text-sm text-white/70">
            <strong className="text-white">Overrides.</strong> Leave these empty and the trip uses{" "}
            <span className="text-gold">{base?.name ?? "the package"}</span>&apos;s own itinerary and lists. Fill them
            in only where the creator&apos;s batch genuinely differs.
          </p>
        </div>

        <div className="mt-4 grid max-w-5xl gap-4 sm:grid-cols-2">
          <Area l="inclusions override (one per line)" v={arrToLines(trip.inclusions ?? [])} on={(v) => updTrip({ inclusions: linesToArr(v) })} rows={6} />
          <Area l="exclusions override (one per line)" v={arrToLines(trip.exclusions ?? [])} on={(v) => updTrip({ exclusions: linesToArr(v) })} rows={6} />
        </div>

        <div className="mt-8 max-w-5xl">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className={label}>itinerary override — day by day</p>
            <div className="flex gap-2">
              {!overriding && base?.itinerary?.length ? (
                <Btn tone="ghost" onClick={() => updTrip({ itinerary: JSON.parse(JSON.stringify(base.itinerary)) })}>
                  Copy {base.itinerary.length} days from package to edit
                </Btn>
              ) : null}
              {overriding && (
                <>
                  <Btn tone="ghost" onClick={() => updTrip({ itinerary: [...(trip.itinerary ?? []), { day: (trip.itinerary?.length ?? 0) + 1, title: "", body: "" }] })}>+ day</Btn>
                  <Btn tone="danger" onClick={() => updTrip({ itinerary: [] })}>Reset to package</Btn>
                </>
              )}
            </div>
          </div>

          {!overriding ? (
            <p className="rounded-xl border border-dashed border-white/15 p-5 text-xs text-white/45">
              Using {base?.name ?? "the package"}&apos;s itinerary ({base?.itinerary?.length ?? 0} days).
            </p>
          ) : (
            <div className="space-y-3">
              {(trip.itinerary ?? []).map((d, i) => {
                const patchDay = (p: Partial<ItineraryDay>) =>
                  updTrip({ itinerary: (trip.itinerary ?? []).map((x, j) => (j === i ? { ...x, ...p } : x)) });
                return (
                  <div key={i} className="rounded-xl border border-white/10 p-3">
                    <div className="grid grid-cols-[4rem_1fr_auto] items-end gap-2">
                      <Field l="day #" v={d.day} type="number" on={(v) => patchDay({ day: Number(v) || 1 })} />
                      <Field l="title" v={d.title} on={(v) => patchDay({ title: v })} />
                      <Btn tone="danger" onClick={() => updTrip({ itinerary: (trip.itinerary ?? []).filter((_, j) => j !== i) })}>✕</Btn>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <Area l="details" v={d.body} on={(v) => patchDay({ body: v })} rows={3} />
                      <MediaPicker label="day photo" value={d.image ?? ""} onChange={(v) => patchDay({ image: v })} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/40">covered:</span>
                      <Toggle on={!!d.stay} onClick={() => patchDay({ stay: !d.stay })}>Stay</Toggle>
                      {MEALS.map((m) => (
                        <Toggle
                          key={m}
                          on={(d.meals ?? []).includes(m)}
                          onClick={() => {
                            const cur = d.meals ?? [];
                            patchDay({ meals: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
                          }}
                        >
                          {m}
                        </Toggle>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  /* ---------------------------------------------- one creator --------- */
  const usedPackages = new Set(creator.trips.map((t) => t.packageSlug));
  const addable = livePackages.filter((p) => !usedPackages.has(p.slug));

  return (
    <>
      <Head title={creator.name} sub={`${creator.handle} · /travel-with/${creator.slug}`}>
        <Btn tone="ghost" onClick={() => setOpenSlug(null)}>← All creators</Btn>
        <Btn onClick={() => save("creators", creators)}>Save all</Btn>
      </Head>

      <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
        <Field l="full name" v={creator.name} on={(v) => upd({ name: v })} />
        <Field l="first name (used in headlines)" v={creator.firstName} on={(v) => upd({ firstName: v })} />
        <Field l="slug (url)" v={creator.slug} on={(v) => {
          const s = v.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
          setCreators((all) => all.map((c) => (c.slug === openSlug ? { ...c, slug: s } : c)));
          setOpenSlug(s);
        }} />
        <Field l="handle" v={creator.handle} on={(v) => upd({ handle: v })} />
        <Field l="epithet (e.g. The Spiti Regular)" v={creator.epithet ?? ""} on={(v) => upd({ epithet: v })} />
        <Field l="niche" v={creator.niche} on={(v) => upd({ niche: v })} />
        <Field l="city" v={creator.city} on={(v) => upd({ city: v })} />
        <label className={label}>page accent
          <select value={creator.accent} onChange={(e) => upd({ accent: e.target.value as Creator["accent"] })} className={input}>
            <option value="gold">gold</option>
            <option value="brand">red</option>
          </select>
        </label>
        <div className="sm:col-span-2"><Area l="tagline (big line under the name)" v={creator.tagline} on={(v) => upd({ tagline: v })} rows={2} /></div>
        <div className="sm:col-span-2"><Area l="bio" v={creator.bio} on={(v) => upd({ bio: v })} rows={6} /></div>
        <div className="sm:col-span-2"><Area l="pull quote" v={creator.quote} on={(v) => upd({ quote: v })} rows={2} /></div>
        <div className="sm:col-span-2"><Area l="perks — what you get because they're there (one per line)" v={arrToLines(creator.perks)} on={(v) => upd({ perks: linesToArr(v) })} rows={5} /></div>
      </div>

      {/* ---- media ---- */}
      <div className="mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-4">
          <MediaPicker label="cutout PNG (transparent)" value={creator.cutout ?? ""} onChange={(v) => upd({ cutout: v })} />
          <p className="mt-2 text-xs text-white/45">
            A cut-out with no background switches the pages to the poster look. Without one they use the photo below.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <MediaPicker label="portrait photo" value={creator.portrait} onChange={(v) => upd({ portrait: v })} />
          <Field l="focal point (x% y%)" v={creator.focal ?? "50% 30%"} on={(v) => upd({ focal: v })} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <MediaPicker label="cover backdrop" value={creator.cover} onChange={(v) => upd({ cover: v })} aspect="aspect-video" />
        </div>
      </div>

      {/* ---- a figure per placement ---- */}
      <div className="mt-8 max-w-5xl">
        <p className={label}>figures — a different pose for each place they appear</p>
        <p className="mt-1 text-xs text-white/40">
          Each takes a transparent PNG, a photo, or a video. Leave one empty and it falls back to the
          default figure above, then to the portrait.
        </p>
        <div className="mt-4 flex flex-wrap gap-5">
          {CREATOR_POSE_DEFS.map((pose) => (
            <div key={pose.key} className="w-52 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <MediaPicker
                label={pose.label}
                value={creator.figures?.[pose.key] ?? ""}
                onChange={(v) => upd({ figures: setFigure(creator.figures, pose.key, v) })}
              />
              <p className="mt-2 text-[0.62rem] leading-snug text-white/40">{pose.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---- socials ---- */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>socials</p>
          <Btn tone="ghost" onClick={() => upd({ socials: [...creator.socials, { platform: "instagram", handle: creator.handle, followers: "", url: "" }] })}>+ social</Btn>
        </div>
        <div className="space-y-2">
          {creator.socials.map((s, i) => {
            const patch = (p: Partial<typeof s>) => upd({ socials: creator.socials.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <div key={i} className="grid grid-cols-[8rem_1fr_7rem_1fr_auto] items-end gap-2">
                <label className={label}>platform
                  <select value={s.platform} onChange={(e) => patch({ platform: e.target.value as typeof s.platform })} className={input}>
                    {["instagram", "youtube", "x", "tiktok"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <Field l="handle" v={s.handle} on={(v) => patch({ handle: v })} />
                <Field l="followers" v={s.followers} on={(v) => patch({ followers: v })} />
                <Field l="url" v={s.url} on={(v) => patch({ url: v })} />
                <Btn tone="danger" onClick={() => upd({ socials: creator.socials.filter((_, j) => j !== i) })}>✕</Btn>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Q&A ---- */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>Q&amp;A — the things people actually ask them</p>
          <Btn tone="ghost" onClick={() => upd({ qa: [...creator.qa, { q: "", a: "" }] })}>+ question</Btn>
        </div>
        <div className="space-y-2">
          {creator.qa.map((item, i) => {
            const patch = (p: Partial<typeof item>) => upd({ qa: creator.qa.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-white/10 p-3">
                <div className="space-y-2">
                  <Field l="question" v={item.q} on={(v) => patch({ q: v })} />
                  <Area l="answer" v={item.a} on={(v) => patch({ a: v })} rows={2} />
                </div>
                <Btn tone="danger" onClick={() => upd({ qa: creator.qa.filter((_, j) => j !== i) })}>✕</Btn>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- gallery ---- */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>gallery — photos &amp; video</p>
          <Btn tone="ghost" onClick={() => upd({ gallery: [...creator.gallery, ""] })}>+ Add</Btn>
        </div>
        <div className="flex flex-wrap gap-4">
          {creator.gallery.map((src, i) => (
            <div key={i} className="w-44">
              <MediaPicker
                value={src}
                label={`#${i + 1}`}
                onChange={(v) => {
                  const next = [...creator.gallery];
                  if (!v) next.splice(i, 1); else next[i] = v;
                  upd({ gallery: next });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---- their trips ---- */}
      <div className="mt-10 max-w-5xl">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className={label}>trips — each one gets its own page</p>
          {addable.length > 0 && (
            <label className={label}>
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  upd({ trips: [...creator.trips, { packageSlug: v, dates: [], published: true }] });
                  setOpenTrip(v);
                }}
                className={input}
              >
                <option value="">+ add a package…</option>
                {addable.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {creator.trips.map((t) => {
            const base = pkgOf(t.packageSlug);
            return (
              <div key={t.packageSlug} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setOpenTrip(t.packageSlug)} className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold">
                  {t.headline || base?.name || t.packageSlug}
                  <span className="ml-2 font-mono text-[0.6rem] text-white/35">{t.packageSlug}</span>
                </button>
                {/* a dead package reference hides the trip from the site
                    entirely, so it has to be obvious from the list */}
                {!base && (
                  <span className="rounded-full bg-brand px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-white">
                    ⚠ package missing
                  </span>
                )}
                <span className="hidden text-xs text-white/40 sm:block">
                  {t.dates.length} {t.dates.length === 1 ? "date" : "dates"}
                  {t.itinerary?.length ? " · custom itinerary" : ""}
                </span>
                <span className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${t.published ? "bg-success/20 text-success" : "bg-white/10 text-white/45"}`}>
                  {t.published ? "live" : "hidden"}
                </span>
                <Btn tone="ghost" onClick={() => setOpenTrip(t.packageSlug)}>edit →</Btn>
                <Btn tone="danger" onClick={() => upd({ trips: creator.trips.filter((x) => x.packageSlug !== t.packageSlug) })}>✕</Btn>
              </div>
            );
          })}
          {creator.trips.length === 0 && (
            <p className="px-4 py-6 text-sm text-white/45">No trips yet — add a package above.</p>
          )}
        </div>
      </div>
    </>
  );
}

/** set or clear one pose; clearing removes the key so it falls back cleanly */
function setFigure(figures: CreatorFigures | undefined, pose: CreatorPose, value: string): CreatorFigures {
  const next: CreatorFigures = { ...(figures ?? {}) };
  if (value.trim()) next[pose] = value.trim();
  else delete next[pose];
  return next;
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[0.62rem] font-bold capitalize transition-colors ${
        on ? "bg-gold text-ink" : "border border-white/20 text-white/55 hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}
