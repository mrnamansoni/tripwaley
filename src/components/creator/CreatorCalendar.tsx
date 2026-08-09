"use client";

/* THE TOUR CALENDAR — which creator is on which trip, on which date.
 *
 * Shape of the problem: a handful of dates spread over ~6 months. A plain
 * month grid on its own would be mostly empty squares, and a plain list
 * gives no sense of "when". So this is both, wired together: the grid
 * answers *when*, the list answers *what and with whom*, and clicking a
 * date narrows the list. Filters for package and creator sit above both.
 *
 * The one client island on the hub page — everything else is server-rendered.
 * Dates are handed in pre-joined and pre-sorted from the server, so nothing
 * here does date maths beyond laying out the month grid.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreatorAvatar } from "./CreatorFigure";
import { inr } from "@/lib/types";

export interface CalendarDate {
  creatorSlug: string;
  creatorName: string;
  creatorFirst: string;
  creatorHandle: string;
  avatar: string;
  focal?: string;
  accent: "gold" | "brand";
  packageSlug: string;
  packageName: string;
  destination: string;
  /** where this date's Book button goes — creator × package page */
  href: string;
  date: string; // yyyy-mm-dd
  seats: number;
  seatsLeft: number;
  hook?: string;
  price?: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABEL = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

/** Monday-first offset for the 1st of the month */
function leadingBlanks(ym: string): number {
  const first = new Date(`${ym}-01T00:00:00`).getDay(); // 0=Sun
  return (first + 6) % 7;
}
function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export default function CreatorCalendar({ dates }: { dates: CalendarDate[] }) {
  const months = useMemo(() => [...new Set(dates.map((d) => d.date.slice(0, 7)))].sort(), [dates]);
  const [monthIdx, setMonthIdx] = useState(0);
  const [pkg, setPkg] = useState("all");
  const [creator, setCreator] = useState("all");
  const [day, setDay] = useState<string | null>(null);

  const packages = useMemo(() => {
    const m = new Map<string, string>();
    dates.forEach((d) => m.set(d.packageSlug, d.packageName));
    return [...m].sort((a, b) => a[1].localeCompare(b[1]));
  }, [dates]);
  const creators = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string; focal?: string }>();
    dates.forEach((d) => m.set(d.creatorSlug, { name: d.creatorFirst, avatar: d.avatar, focal: d.focal }));
    return [...m];
  }, [dates]);

  const ym = months[monthIdx] ?? months[0];

  /* filters apply everywhere; the day pick only narrows the list */
  const filtered = useMemo(
    () => dates.filter((d) => (pkg === "all" || d.packageSlug === pkg) && (creator === "all" || d.creatorSlug === creator)),
    [dates, pkg, creator]
  );
  const monthDates = useMemo(() => filtered.filter((d) => d.date.startsWith(ym)), [filtered, ym]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarDate[]>();
    monthDates.forEach((d) => m.set(d.date, [...(m.get(d.date) ?? []), d]));
    return m;
  }, [monthDates]);
  const listed = day ? monthDates.filter((d) => d.date === day) : monthDates;

  const goMonth = (delta: number) => {
    setMonthIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    setDay(null);
  };

  if (!months.length) {
    return (
      <p className="mx-auto max-w-md px-5 py-16 text-center text-white/50">
        No creator departures are on sale right now — new dates go up every few weeks.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      {/* ---------- filters ---------- */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-1 font-mono text-[0.56rem] uppercase tracking-[0.3em] text-white/35">filter</span>
        <Pill active={creator === "all"} onClick={() => { setCreator("all"); setDay(null); }}>
          All creators
        </Pill>
        {creators.map(([slug, c]) => (
          <Pill key={slug} active={creator === slug} onClick={() => { setCreator(slug); setDay(null); }}>
            <CreatorAvatar src={c.avatar} focal={c.focal} alt="" size={20} ring="ring-transparent" className="-ml-1" />
            {c.name}
          </Pill>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
        <select
          value={pkg}
          onChange={(e) => { setPkg(e.target.value); setDay(null); }}
          aria-label="Filter by trip"
          className="min-h-9 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-white outline-none transition-colors hover:border-gold focus:border-gold [&>option]:text-ink"
        >
          <option value="all">All trips</option>
          {packages.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
      </div>

      {/* ---------- month nav ---------- */}
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.35em] text-gold">tour dates</p>
          <h3 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {MONTH_LABEL(ym)}
          </h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <NavBtn onClick={() => goMonth(-1)} disabled={monthIdx === 0} label="Previous month">←</NavBtn>
          <NavBtn onClick={() => goMonth(1)} disabled={monthIdx === months.length - 1} label="Next month">→</NavBtn>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* ---------- the grid ---------- */}
        <div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <span key={w} className="pb-1 text-center font-mono text-[0.5rem] uppercase tracking-widest text-white/30">
                {w[0]}
              </span>
            ))}
            {Array.from({ length: leadingBlanks(ym) }).map((_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: daysInMonth(ym) }).map((_, i) => {
              const dd = String(i + 1).padStart(2, "0");
              const iso = `${ym}-${dd}`;
              const hits = byDay.get(iso) ?? [];
              const has = hits.length > 0;
              const selected = day === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!has}
                  onClick={() => setDay(selected ? null : iso)}
                  aria-label={has ? `${hits.length} departure on ${iso}` : iso}
                  aria-pressed={selected}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    selected
                      ? "bg-gold text-ink"
                      : has
                        ? "border border-gold/45 bg-gold/10 text-white hover:border-gold hover:bg-gold/20"
                        : "text-white/20"
                  }`}
                >
                  {i + 1}
                  {has && !selected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                  )}
                </button>
              );
            })}
          </div>

          {day && (
            <button
              type="button"
              onClick={() => setDay(null)}
              className="mt-4 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-gold hover:text-white"
            >
              ← show the whole month
            </button>
          )}

          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/40">
            Gold days have a creator on board. Tap one to see who&apos;s going and what&apos;s left.
          </p>
        </div>

        {/* ---------- the list ---------- */}
        <div className="space-y-3">
          {listed.map((d) => <DateRow key={`${d.creatorSlug}-${d.date}-${d.packageSlug}`} d={d} />)}
          {listed.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
              <p className="text-sm text-white/55">Nothing on this filter in {MONTH_LABEL(ym)}.</p>
              <button
                type="button"
                onClick={() => { setPkg("all"); setCreator("all"); setDay(null); }}
                className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-gold hover:text-white"
              >
                clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------ pieces */

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-gold text-ink" : "border border-white/20 text-white/70 hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function NavBtn({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function DateRow({ d }: { d: CalendarDate }) {
  const dt = new Date(`${d.date}T00:00:00`);
  const soldOut = d.seatsLeft <= 0;
  const filled = d.seats > 0 ? Math.min(1, (d.seats - d.seatsLeft) / d.seats) : 0;
  const scarce = !soldOut && d.seatsLeft <= Math.max(2, Math.round(d.seats * 0.25));

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-gold/50">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
        {/* date block */}
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-ink px-2 py-2 text-center ring-1 ring-white/10">
          <span className="font-display text-2xl font-extrabold leading-none text-gold">{dt.getDate()}</span>
          <span className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-white/45">
            {dt.toLocaleDateString("en-IN", { month: "short" })}
          </span>
        </div>

        <CreatorAvatar
          src={d.avatar}
          focal={d.focal}
          alt={d.creatorName}
          size={44}
          ring={d.accent === "gold" ? "ring-gold/70" : "ring-brand/70"}
        />

        <div className="min-w-0 flex-1">
          <Link href={d.href} className="font-display text-base font-extrabold text-white hover:text-gold">
            {d.creatorName}
            <span className="ml-2 font-mono text-[0.6rem] font-normal tracking-wide text-white/35">{d.creatorHandle}</span>
          </Link>
          <p className="mt-0.5 truncate text-sm text-white/60">{d.packageName}</p>
          {d.hook && <p className="mt-1 hidden truncate font-script text-base text-gold/80 sm:block">&ldquo;{d.hook}&rdquo;</p>}
        </div>

        {/* seats + price */}
        <div className="flex w-full items-end justify-between gap-4 sm:w-auto sm:flex-col sm:items-end">
          {d.price != null && (
            <span className="font-display text-lg font-extrabold text-white">{inr(d.price)}</span>
          )}
          <div className="sm:w-32">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-mono text-[0.56rem] uppercase tracking-widest ${soldOut ? "text-white/35" : scarce ? "text-brand-bright" : "text-white/50"}`}>
                {soldOut ? "sold out" : `${d.seatsLeft} left`}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <span
                className={`block h-full rounded-full ${soldOut ? "bg-white/25" : scarce ? "bg-brand" : "bg-gold"}`}
                style={{ width: `${Math.round(filled * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          href={d.href}
          className={`w-full shrink-0 rounded-full px-5 py-2.5 text-center text-xs font-extrabold transition-colors sm:w-auto ${
            soldOut
              ? "border border-white/20 text-white/45 hover:border-white/40"
              : "bg-gold text-ink hover:brightness-110"
          }`}
        >
          {soldOut ? "Join waitlist" : "Request a seat →"}
        </Link>
      </div>
    </article>
  );
}
