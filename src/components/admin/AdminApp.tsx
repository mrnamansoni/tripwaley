"use client";

/* MISSION CONTROL — the Tripwaley admin panel.
   Edits every piece of site content: settings, cities, packages, prices,
   departures, reviews, photos. Every save revalidates the live site. */

import { useState } from "react";
import { AdminProvider, useAdmin, Field, Area, Btn, Head, input, label } from "./ui";
import PackagesEditor from "./PackagesEditor";
import MediaManager from "./MediaManager";
import ContentEditor from "./ContentEditor";
import PagesEditor from "./PagesEditor";
import FaqEditor from "./FaqEditor";
import StoriesEditor from "./StoriesEditor";
import CreatorsEditor from "./CreatorsEditor";
import SettingsEditor from "./SettingsEditor";
import { inr, shortDate } from "@/lib/types";
import type { City, Departure, PriceRule, Review } from "@/lib/types";

const TABS = ["Dashboard", "Content", "Pages", "Packages", "Creators", "Prices", "Departures", "Cities", "Media", "Reviews", "FAQ", "Stories", "Settings", "Bookings"] as const;
type Tab = (typeof TABS)[number];

export default function AdminApp() {
  return (
    <AdminProvider>
      <Shell />
    </AdminProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-white/10 bg-black/30 p-4">
        <p className="px-2 font-script text-2xl text-gold">tripwaley</p>
        <p className="mb-6 px-2 text-[0.56rem] font-bold uppercase tracking-[0.3em] text-white/35">mission control</p>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-colors ${
              tab === t ? "bg-gold text-ink" : "text-white/65 hover:bg-white/8 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="mt-auto space-y-1.5 pt-6">
          <a href="/" target="_blank" className="block rounded-lg px-3 py-2 text-xs font-bold text-white/50 hover:text-gold">↗ View live site</a>
          <button
            type="button"
            onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); location.href = "/admin/login"; }}
            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-white/50 hover:text-brand-bright"
          >
            ⏻ Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 sm:p-9">
        {tab === "Dashboard" && <Dashboard go={setTab} />}
        {tab === "Content" && <ContentEditor />}
        {tab === "Pages" && <PagesEditor />}
        {tab === "Packages" && <PackagesEditor />}
        {tab === "Creators" && <CreatorsEditor />}
        {tab === "Prices" && <PricesEditor />}
        {tab === "Departures" && <DeparturesEditor />}
        {tab === "Cities" && <CitiesEditor />}
        {tab === "Media" && <MediaManager />}
        {tab === "Reviews" && <ReviewsEditor />}
        {tab === "FAQ" && <FaqEditor />}
        {tab === "Stories" && <StoriesEditor />}
        {tab === "Settings" && <SettingsEditor />}
        {tab === "Bookings" && <BookingsView />}
      </main>
    </div>
  );
}

/* ================================================================ dashboard */

function Dashboard({ go }: { go: (t: Tab) => void }) {
  const { data } = useAdmin();
  const { catalog, bookings } = data;
  const live = catalog.packages.filter((p) => p.status === "live").length;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = catalog.departures.filter((d) => d.date >= today).length;
  const stats: [string, string | number, Tab][] = [
    ["Live packages", `${live} / ${catalog.packages.length}`, "Packages"],
    ["Upcoming departures", upcoming, "Departures"],
    ["Boarding cities", catalog.cities.filter((c) => c.priced).length, "Cities"],
    ["Price rules", catalog.prices.length, "Prices"],
    ["Leads captured", bookings.length, "Bookings"],
    ["Photos in library", data.media.length, "Media"],
  ];
  return (
    <>
      <Head title="Dashboard" sub="Everything here edits the live site — saves apply in seconds." />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([l, v, t]) => (
          <button key={l} type="button" onClick={() => go(t)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors hover:border-gold/50">
            <p className="font-display text-3xl font-extrabold text-gold">{v}</p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-white/45">{l}</p>
          </button>
        ))}
      </div>
      {bookings.length > 0 && (
        <div className="mt-8">
          <p className={label}>latest leads</p>
          <div className="mt-2 divide-y divide-white/8 rounded-2xl border border-white/10">
            {bookings.slice(0, 5).map((b) => (
              <p key={b.id} className="px-4 py-3 text-sm text-white/70">
                <span className="font-bold text-white">{b.name || "Lead"}</span>
                {b.phone && <span className="ml-2 font-mono text-gold">+91 {b.phone}</span>}
                <span className="ml-2">· {b.package} · ex-{b.city}</span>
                <span className="float-right text-xs text-white/35">{b.ts.slice(0, 16).replace("T", " ")}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================ prices */

function PricesEditor() {
  const { data, save } = useAdmin();
  const [rules, setRules] = useState<PriceRule[]>(data.catalog.prices);
  const cities = data.catalog.cities.filter((c) => c.priced);
  const pkgs = data.catalog.packages;

  const get = (p: string, c: string) => rules.find((r) => r.packageSlug === p && r.citySlug === c);
  const set = (p: string, c: string, occ: "triple" | "double", v: string) => {
    const num = v === "" ? undefined : Number(v);
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.packageSlug === p && r.citySlug === c);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [occ]: num };
        return copy.filter((r) => r.triple != null || r.double != null || r.quad != null);
      }
      if (num == null) return prev;
      return [...prev, { packageSlug: p, citySlug: c, [occ]: num }];
    });
  };

  return (
    <>
      <Head title="Prices" sub="₹ per seat. Blank = not sold from that city. Two boxes per cell: triple | double.">
        <Btn onClick={() => save("prices", rules)}>Save prices</Btn>
      </Head>
      <div data-lenis-prevent className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="bg-black/40 text-[0.58rem] font-bold uppercase tracking-widest text-white/45">
            <tr>
              <th className="sticky left-0 bg-[#181512] px-4 py-3">Package</th>
              {cities.map((c) => <th key={c.slug} className="px-3 py-3 text-center">{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {pkgs.map((p) => (
              <tr key={p.slug} className="border-t border-white/8">
                <td className="sticky left-0 max-w-44 truncate bg-[#181512] px-4 py-2 font-bold text-white">{p.name}</td>
                {cities.map((c) => {
                  const r = get(p.slug, c.slug);
                  return (
                    <td key={c.slug} className="px-2 py-2">
                      <div className="flex gap-1">
                        {(["triple", "double"] as const).map((occ) => (
                          <input
                            key={occ}
                            type="number"
                            placeholder={occ[0].toUpperCase()}
                            value={r?.[occ] ?? ""}
                            onChange={(e) => set(p.slug, c.slug, occ, e.target.value)}
                            className="w-[4.5rem] rounded border border-white/12 bg-black/30 px-1.5 py-1 text-center text-xs text-white outline-none focus:border-gold"
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ================================================================ departures */

function DeparturesEditor() {
  const { data, save } = useAdmin();
  const [deps, setDeps] = useState<Departure[]>(data.catalog.departures);
  const [date, setDate] = useState("");
  const [pkg, setPkg] = useState(data.catalog.packages[0]?.slug ?? "");
  const [selCities, setSelCities] = useState<string[]>([]);
  const cities = data.catalog.cities;

  const add = () => {
    if (!date || !pkg || selCities.length === 0) return;
    setDeps((d) => [...d, { date, packageSlug: pkg, citySlugs: selCities }].sort((a, b) => a.date.localeCompare(b.date)));
    setSelCities([]);
  };

  return (
    <>
      <Head title="Departures" sub="Each row = one batch: date + package + boarding cities.">
        <Btn onClick={() => save("departures", deps)}>Save departures</Btn>
      </Head>

      {/* add row */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
        <label className={label}>date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
        <label className={label}>package
          <select value={pkg} onChange={(e) => setPkg(e.target.value)} className={input}>
            {data.catalog.packages.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <div className={label}>
          cities
          <div className="mt-1.5 flex max-w-xl flex-wrap gap-1.5">
            {cities.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSelCities((s) => (s.includes(c.slug) ? s.filter((x) => x !== c.slug) : [...s, c.slug]))}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selCities.includes(c.slug) ? "bg-gold text-ink" : "border border-white/20 text-white/60"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <Btn onClick={add}>+ Add batch</Btn>
      </div>

      <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
        {deps.map((d, i) => (
          <div key={`${d.date}-${d.packageSlug}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="w-24 font-mono text-sm font-bold text-gold">{shortDate(d.date)}</span>
            <span className="min-w-40 flex-1 truncate text-sm font-bold text-white">
              {data.catalog.packages.find((p) => p.slug === d.packageSlug)?.name ?? d.packageSlug}
            </span>
            <span className="flex-[2] text-xs text-white/50">{d.citySlugs.join(", ")}</span>
            <Btn tone="danger" onClick={() => setDeps((x) => x.filter((_, j) => j !== i))}>remove</Btn>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================================================================ cities */

function CitiesEditor() {
  const { data, save } = useAdmin();
  const [cities, setCities] = useState<City[]>(data.catalog.cities);
  const upd = (i: number, patch: Partial<City>) => setCities((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <>
      <Head title="Cities" sub="Boarding points. 'Priced' cities appear in switchers & fare boards.">
        <Btn tone="ghost" onClick={() => setCities((c) => [...c, { slug: "", name: "", state: "", lat: 0, lng: 0, priced: true }])}>+ Add city</Btn>
        <Btn onClick={() => save("cities", cities.filter((c) => c.slug && c.name))}>Save cities</Btn>
      </Head>
      <div className="space-y-2">
        {cities.map((c, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-[1fr_1fr_1fr_6rem_6rem_auto_auto]">
            <Field l="name" v={c.name} on={(v) => upd(i, { name: v, slug: c.slug || v.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} />
            <Field l="slug" v={c.slug} on={(v) => upd(i, { slug: v })} />
            <Field l="state" v={c.state} on={(v) => upd(i, { state: v })} />
            <Field l="lat" v={c.lat} type="number" on={(v) => upd(i, { lat: Number(v) })} />
            <Field l="lng" v={c.lng} type="number" on={(v) => upd(i, { lng: Number(v) })} />
            <label className="flex items-center gap-2 pb-2 text-xs font-bold text-white/60">
              <input type="checkbox" checked={c.priced} onChange={(e) => upd(i, { priced: e.target.checked })} className="h-4 w-4 accent-gold" />
              priced
            </label>
            <Btn tone="danger" onClick={() => setCities((x) => x.filter((_, j) => j !== i))}>✕</Btn>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================================================================ reviews */

function ReviewsEditor() {
  const { data, save } = useAdmin();
  const [reviews, setReviews] = useState<Review[]>(data.reviews);
  const upd = (i: number, patch: Partial<Review>) => setReviews((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <>
      <Head title="Reviews" sub="What the homepage drum spins. Source badge shows on the card.">
        <Btn tone="ghost" onClick={() => setReviews((r) => [{ source: "google", rating: 5, name: "", city: "", trip: "", text: "" }, ...r])}>+ Add review</Btn>
        <Btn onClick={() => save("reviews", reviews.filter((r) => r.name && r.text))}>Save reviews</Btn>
      </Head>
      <div className="grid gap-3 lg:grid-cols-2">
        {reviews.map((r, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-white/10 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field l="name" v={r.name} on={(v) => upd(i, { name: v })} />
              <Field l="city" v={r.city} on={(v) => upd(i, { city: v })} />
              <label className={label}>source
                <select value={r.source} onChange={(e) => upd(i, { source: e.target.value as Review["source"] })} className={input}>
                  <option value="google">google</option>
                  <option value="instagram">instagram</option>
                </select>
              </label>
              <Field l="rating (1–5)" v={r.rating} type="number" on={(v) => upd(i, { rating: Math.max(1, Math.min(5, Number(v) || 5)) })} />
            </div>
            <Field l="trip tag" v={r.trip} on={(v) => upd(i, { trip: v })} />
            <Area l="review text" v={r.text} on={(v) => upd(i, { text: v })} />
            <Btn tone="danger" onClick={() => setReviews((x) => x.filter((_, j) => j !== i))}>remove</Btn>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================================================================ bookings */

function BookingsView() {
  const { data } = useAdmin();
  return (
    <>
      <Head title="Bookings & leads" sub="Every 'hold my seat' lands here (and forwards to n8n → CRM when configured)." />
      <div data-lenis-prevent className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-black/40 text-[0.58rem] font-bold uppercase tracking-widest text-white/45">
            <tr>
              {["when", "name", "mobile", "package", "city", "date", "occupancy", "quote"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.bookings.map((b) => (
              <tr key={b.id} className="border-t border-white/8 text-white/75">
                <td className="px-4 py-2.5 font-mono text-xs">{b.ts.slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-2.5">{b.name || "—"}</td>
                <td className="px-4 py-2.5">
                  {b.phone ? (
                    <span className="flex items-center gap-2">
                      <a href={`tel:+91${b.phone}`} className="font-mono font-bold text-white hover:text-gold">+91 {b.phone}</a>
                      <a href={`https://wa.me/91${b.phone}`} target="_blank" rel="noreferrer" className="text-success hover:text-white" title="WhatsApp">✆</a>
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2.5 font-bold text-white">{b.package}</td>
                <td className="px-4 py-2.5">{b.city}</td>
                <td className="px-4 py-2.5">{b.date || "—"}</td>
                <td className="px-4 py-2.5">{b.occupancy}</td>
                <td className="px-4 py-2.5 text-gold">{b.price ? inr(b.price) : "—"}</td>
              </tr>
            ))}
            {data.bookings.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-white/35">No leads yet — they&apos;ll appear the moment someone holds a seat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
