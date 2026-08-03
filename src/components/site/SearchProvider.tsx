"use client";

/* SITE SEARCH — one overlay, opened from the navbar or ⌘K / Ctrl-K.
 *
 * The index is built on the server (every live trip: name, destination, route,
 * region words, category) and handed down once — a few dozen rows, so matching
 * runs instantly in the browser with no search endpoint to build or host.
 */

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SiteMedia from "./SiteMedia";
import { inr } from "@/lib/types";

export interface SearchItem {
  slug: string;
  name: string;
  destination: string;
  nightsLabel: string;
  media: string;
  price?: number;
  /** extra words to match on that aren't shown (route, region, categories) */
  keywords: string;
}

interface Ctx {
  open: () => void;
}
const SearchCtx = createContext<Ctx | null>(null);

/** Safe to call anywhere — search simply does nothing if no provider is up. */
export const useSearch = (): Ctx => useContext(SearchCtx) ?? { open: () => {} };

export function SearchProvider({ items, children }: { items: SearchItem[]; children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  /* ⌘K / Ctrl-K from anywhere, Escape to leave */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchCtx.Provider value={value}>
      {children}
      {isOpen && <SearchOverlay items={items} onClose={() => setOpen(false)} />}
    </SearchCtx.Provider>
  );
}

/* ------------------------------------------------ the overlay */

function score(item: SearchItem, needle: string): number {
  const name = item.name.toLowerCase();
  if (name.startsWith(needle)) return 0;
  if (name.includes(needle)) return 1;
  if (item.destination.toLowerCase().includes(needle)) return 2;
  if (item.keywords.includes(needle)) return 3;
  return -1;
}

function SearchOverlay({ items, onClose }: { items: SearchItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 8);
    return items
      .map((it) => ({ it, s: score(it, needle) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s)
      .slice(0, 20)
      .map((r) => r.it);
  }, [items, q]);

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]" role="dialog" aria-modal="true" aria-label="Search trips">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/12 bg-[#181614] shadow-card-lg">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-gold">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Spiti, Kashmir, honeymoon, trek…"
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/35"
          />
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white/45 hover:border-gold hover:text-gold">
            esc
          </button>
        </div>

        <div data-lenis-prevent className="max-h-[52vh] overflow-y-auto p-2">
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/trips/${r.slug}`}
              onClick={onClose}
              className="flex items-center gap-3.5 rounded-2xl p-2.5 transition-colors hover:bg-white/[0.06]"
            >
              <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">
                <SiteMedia src={r.media} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-sm font-extrabold text-white">{r.name}</span>
                <span className="block truncate text-xs text-white/45">{r.destination || r.nightsLabel}</span>
              </span>
              {r.price ? <span className="shrink-0 font-display text-sm font-extrabold text-gold">{inr(r.price)}</span> : null}
            </Link>
          ))}

          {results.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-white/45">
              Nothing matches &ldquo;{q}&rdquo; — try a destination, or the word honeymoon, solo or trek.
            </p>
          )}
        </div>

        {!q && (
          <p className="border-t border-white/10 px-5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/30">
            showing the newest trips · start typing to search all {items.length}
          </p>
        )}
      </div>
    </div>
  );
}
