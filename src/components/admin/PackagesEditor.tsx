"use client";

/* Package editor — every field the site renders, including the photo
   gallery (picked from the media library). */

import { useState } from "react";
import { useAdmin, Field, Area, Btn, Head, input, label, linesToArr, arrToLines } from "./ui";
import MediaPicker from "./MediaPicker";
import type { Package, ItineraryDay, TripCategory } from "@/lib/types";
import { CATEGORY_DEFS, packageCategories } from "@/lib/types";

export default function PackagesEditor() {
  const { data, save } = useAdmin();
  const [pkgs, setPkgs] = useState<Package[]>(data.catalog.packages);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const open = pkgs.find((p) => p.slug === openSlug) ?? null;
  const upd = (patch: Partial<Package>) =>
    setPkgs((all) => all.map((p) => (p.slug === openSlug ? { ...p, ...patch } : p)));

  const addNew = () => {
    const slug = `new-package-${pkgs.length + 1}`;
    setPkgs((all) => [
      {
        code: `TRWLY-N${all.length + 1}`, slug, name: "New Package", destination: "", summaryFromDelhi: "",
        type: "Group Departure", departureHubs: "", transport: "", route: "", inclusions: [], exclusions: [],
        addons: [], itinerary: [], nights: 0, bestTime: "", trekOptions: [], travelTips: [], thingsToCarry: [],
        socialProof: "", scarcityNote: "", cityDetails: {}, status: "draft", rich: false, hasDepartures: false, images: [],
        categories: ["group"], itineraryPdf: "", heroMedia: "",
      },
      ...all,
    ]);
    setOpenSlug(slug);
  };

  /* ---------------- list view ---------------- */
  if (!open) {
    return (
      <>
        <Head title="Packages" sub="Click a package to edit everything the site shows for it. Draft = hidden from the site.">
          <Btn tone="ghost" onClick={addNew}>+ New package</Btn>
          <Btn onClick={() => save("packages", pkgs)}>Save all</Btn>
        </Head>
        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {pkgs.map((p) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => setOpenSlug(p.slug)} className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold">
                {p.name}
                <span className="ml-2 font-mono text-[0.6rem] text-white/35">{p.code}</span>
              </button>
              <span className="hidden gap-1 sm:flex">
                {packageCategories(p).map((c) => (
                  <span key={c} className="rounded-full bg-white/10 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white/55">
                    {c}
                  </span>
                ))}
              </span>
              <span className="hidden text-xs text-white/40 sm:block">{p.itinerary.length ? `${p.itinerary.length} days` : "no itinerary"}</span>
              <button
                type="button"
                onClick={() => setPkgs((all) => all.map((x) => (x.slug === p.slug ? { ...x, status: x.status === "live" ? "draft" : "live" } : x)))}
                className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${p.status === "live" ? "bg-success/20 text-success" : "bg-white/10 text-white/45"}`}
              >
                {p.status}
              </button>
              <Btn tone="ghost" onClick={() => setOpenSlug(p.slug)}>edit →</Btn>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ---------------- editor view ---------------- */
  const cats = packageCategories(open);
  const toggleCat = (key: TripCategory) => {
    const next = cats.includes(key) ? cats.filter((c) => c !== key) : [...cats, key];
    upd({ categories: next.length ? next : ["group"] }); // never leave it homeless
  };
  const gallery = open.images ?? [];
  return (
    <>
      <Head title={open.name} sub={`${open.code} · /trips/${open.slug}`}>
        <Btn tone="ghost" onClick={() => setOpenSlug(null)}>← Back to list</Btn>
        <Btn onClick={async () => { if (await save("packages", pkgs)) setOpenSlug(null); }}>Save all packages</Btn>
      </Head>

      {/* ---- which landing pages this trip appears on ---- */}
      <div className="mb-6 max-w-5xl rounded-2xl border border-gold/25 bg-gold/[0.06] p-4">
        <p className={label}>shows on these pages</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CATEGORY_DEFS.map((c) => {
            const on = cats.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCat(c.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  on ? "bg-gold text-ink" : "border border-white/20 text-white/60 hover:border-gold hover:text-gold"
                }`}
              >
                {on ? "✓ " : ""}{c.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-white/40">
          A trip can sit on more than one page. Every live trip also appears on /trips.
        </p>
      </div>

      <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
        <Field l="name" v={open.name} on={(v) => upd({ name: v })} />
        <Field l="slug (url)" v={open.slug} on={(v) => { const s = v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"); setPkgs((all) => all.map((p) => (p.slug === openSlug ? { ...p, slug: s } : p))); setOpenSlug(s); }} />
        <Field l="destination line" v={open.destination} on={(v) => upd({ destination: v })} />
        <Field l="transport" v={open.transport} on={(v) => upd({ transport: v })} />
        <Field l="best time" v={open.bestTime} on={(v) => upd({ bestTime: v })} />
        <label className={label}>status
          <select value={open.status} onChange={(e) => upd({ status: e.target.value as Package["status"] })} className={input}>
            <option value="live">live — on the site</option>
            <option value="draft">draft — hidden</option>
          </select>
        </label>
        <Field l="code" v={open.code} on={(v) => upd({ code: v })} />
        <Field l="departure hubs" v={open.departureHubs} on={(v) => upd({ departureHubs: v })} />
        <div className="sm:col-span-2">
          {/* THE BRIEF — this is the long description the package page leads with.
              It had no field here before, so it could only be set by the importer. */}
          <Area
            l="the brief — full trip description (shown on the package page, any length)"
            v={open.summaryFromDelhi}
            on={(v) => upd({ summaryFromDelhi: v })}
            rows={10}
          />
          <p className="mt-1 text-xs text-white/40">
            {open.summaryFromDelhi.length.toLocaleString()} characters. Blank lines start a new paragraph;
            a line in ALL CAPS becomes a heading on the page.
          </p>
        </div>
        <div className="sm:col-span-2"><Area l="route / destinations covered" v={open.route} on={(v) => upd({ route: v })} rows={2} /></div>
        <div className="sm:col-span-2"><Area l="scarcity note (rack & batch chips)" v={open.scarcityNote} on={(v) => upd({ scarcityNote: v })} rows={2} /></div>
        <div className="sm:col-span-2"><Area l="social proof line" v={open.socialProof} on={(v) => upd({ socialProof: v })} rows={2} /></div>
        <Area l="inclusions (one per line)" v={arrToLines(open.inclusions)} on={(v) => upd({ inclusions: linesToArr(v) })} rows={6} />
        <Area l="exclusions (one per line)" v={arrToLines(open.exclusions)} on={(v) => upd({ exclusions: linesToArr(v) })} rows={6} />
        <Area l="travel tips (one per line)" v={arrToLines(open.travelTips)} on={(v) => upd({ travelTips: linesToArr(v) })} rows={4} />
        <Area l="things to carry (one per line)" v={arrToLines(open.thingsToCarry)} on={(v) => upd({ thingsToCarry: linesToArr(v) })} rows={4} />
        <div className="sm:col-span-2">
          <Area l="trek options (one per line)" v={arrToLines(open.trekOptions)} on={(v) => upd({ trekOptions: linesToArr(v) })} rows={3} />
        </div>
      </div>

      {/* add-ons */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>add-ons (priced extras)</p>
          <Btn tone="ghost" onClick={() => upd({ addons: [...open.addons, { name: "", price: null, priceMax: null }] })}>+ add-on</Btn>
        </div>
        <div className="space-y-2">
          {open.addons.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_7rem_auto] items-end gap-2">
              <Field l="name" v={a.name} on={(v) => upd({ addons: open.addons.map((x, j) => (j === i ? { ...x, name: v } : x)) })} />
              <Field l="₹ price" v={a.price ?? ""} type="number" on={(v) => upd({ addons: open.addons.map((x, j) => (j === i ? { ...x, price: v ? Number(v) : null } : x)) })} />
              <Field l="₹ max (opt)" v={a.priceMax ?? ""} type="number" on={(v) => upd({ addons: open.addons.map((x, j) => (j === i ? { ...x, priceMax: v ? Number(v) : null } : x)) })} />
              <Btn tone="danger" onClick={() => upd({ addons: open.addons.filter((_, j) => j !== i) })}>✕</Btn>
            </div>
          ))}
        </div>
      </div>

      {/* itinerary days */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>itinerary — day by day (drives ribbon + captain&apos;s feed)</p>
          <Btn tone="ghost" onClick={() => upd({ itinerary: [...open.itinerary, { day: open.itinerary.length + 1, title: "", body: "" }], nights: open.itinerary.length + 1 })}>+ day</Btn>
        </div>
        <div className="space-y-3">
          {open.itinerary.map((d, i) => {
            const patchDay = (patch: Partial<ItineraryDay>) => upd({ itinerary: open.itinerary.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            const move = (dir: -1 | 1) => {
              const j = i + dir;
              if (j < 0 || j >= open.itinerary.length) return;
              const copy = [...open.itinerary];
              [copy[i], copy[j]] = [copy[j], copy[i]];
              upd({ itinerary: copy.map((x, k) => ({ ...x, day: k + 1 })) });
            };
            return (
              <div key={i} className="rounded-xl border border-white/10 p-3">
                <div className="grid grid-cols-[4rem_1fr_auto] items-end gap-2">
                  <Field l="day #" v={d.day} type="number" on={(v) => patchDay({ day: Number(v) || 1 })} />
                  <Field l="title" v={d.title} on={(v) => patchDay({ title: v })} />
                  <div className="flex gap-1.5">
                    <Btn tone="ghost" onClick={() => move(-1)}>↑</Btn>
                    <Btn tone="ghost" onClick={() => move(1)}>↓</Btn>
                    <Btn tone="danger" onClick={() => upd({ itinerary: open.itinerary.filter((_, j) => j !== i) })}>✕</Btn>
                  </div>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Area l="details — shown in full on the page" v={d.body} on={(v) => patchDay({ body: v })} rows={4} />
                  <MediaPicker label="day photo / video" value={d.image ?? ""} onChange={(p) => patchDay({ image: p })} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* hero + printable itinerary */}
      <div className="mt-8 grid max-w-5xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <MediaPicker
            label="hero background — photo or video"
            value={open.heroMedia ?? ""}
            onChange={(p) => upd({ heroMedia: p })}
            aspect="aspect-video"
          />
          <p className="mt-2 text-xs text-white/40">
            The big banner at the top of this trip&apos;s page. Leave empty to use the first gallery photo.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Field l="itinerary PDF link (Google Drive)" v={open.itineraryPdf ?? ""} on={(v) => upd({ itineraryPdf: v })} />
          <p className="mt-2 text-xs text-white/40">
            Paste the normal Drive share link — we convert it to a direct download. Leave empty to hide
            the Download itinerary button on this trip.
          </p>
        </div>
      </div>

      {/* gallery */}
      <div className="mt-8 max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <p className={label}>gallery — photos &amp; video, in order (first one is the fallback hero)</p>
          <Btn tone="ghost" onClick={() => upd({ images: [...gallery, ""] })}>+ Add</Btn>
        </div>
        {gallery.length === 0 && (
          <p className="mb-3 text-xs text-white/40">
            Nothing picked yet — the site is auto-choosing photos by destination. Add one to take control.
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {gallery.map((src, i) => (
            <div key={`g-${i}`} className="w-44">
              <MediaPicker
                value={src}
                label={`#${i + 1}`}
                onChange={(ref) => {
                  const next = [...gallery];
                  if (!ref) next.splice(i, 1);
                  else next[i] = ref;
                  upd({ images: next });
                }}
              />
              {gallery.length > 1 && (
                <div className="mt-1.5 flex gap-1.5">
                  {([-1, 1] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => {
                        const j = i + dir;
                        if (j < 0 || j >= gallery.length) return;
                        const next = [...gallery];
                        [next[i], next[j]] = [next[j], next[i]];
                        upd({ images: next });
                      }}
                      className="rounded border border-white/20 px-2 py-0.5 text-[0.6rem] font-bold text-white/60 hover:border-gold hover:text-gold"
                    >
                      {dir === -1 ? "←" : "→"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
