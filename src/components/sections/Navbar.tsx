"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoLockup } from "@/components/ui/Logo";
import { navLinks } from "@/lib/data";
import { useBooking } from "@/components/booking/BookingContext";
import { useSearch } from "@/components/site/SearchProvider";

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar({ overDarkHero = false }: { overDarkHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open, waLink } = useBooking();
  const { open: openSearch } = useSearch();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* lock body scroll while the mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Keep the header solid whenever the mobile menu is open — otherwise, on a
  // dark-hero page (home, destinations, about…) opened before scrolling, the
  // nav row stays see-through right above the opaque cream menu panel: a
  // jarring seam, and the hamburger bars (see below) would be unreadable.
  const opaque = scrolled || menuOpen;
  // Only invert to white/gold when floating transparently over a dark hero —
  // once the header is opaque (scrolled, or the menu is open) it reads dark.
  const overDark = overDarkHero && !opaque;

  return (
    <header
      style={{ top: "var(--ann-h, 0px)" }}
      className={`fixed inset-x-0 z-50 transition-all duration-500 ${
        menuOpen
          ? // SOLID (no backdrop-blur) while the menu is open: backdrop-filter
            // creates a CSS containing block that would trap the fixed menu
            // panel inside this 4.5rem-tall header — the bug that made the
            // menu render transparent over the page content.
            "border-b border-line/80 bg-cream shadow-card"
          : opaque
            ? "border-b border-line/80 bg-cream/85 shadow-card backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <Link href="/" aria-label="Tripwaley — home" className="rounded-lg">
          <LogoLockup inverted={overDark} />
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              {/* invert over a dark hero — ink-on-dark was near-invisible */}
              <a
                href={l.href}
                className={`link-sweep text-[0.95rem] font-semibold transition-colors ${
                  overDark ? "text-white/85 hover:text-gold" : "text-ink/75 hover:text-ink"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={openSearch}
            aria-label="Search trips"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              overDark
                ? "border-white/30 text-white hover:border-gold hover:text-gold"
                : "border-line bg-card text-ink hover:border-brand hover:text-brand"
            }`}
          >
            <SearchIcon />
            Search
            <kbd className="ml-0.5 rounded border border-current/30 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase opacity-50">⌘K</kbd>
          </button>
          <a
            href={waLink("Hi Tripwaley! Tell me about upcoming departures ✈️")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-success hover:text-success"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-success">
              <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Zm5.47 14.3c-.23.65-1.35 1.24-1.86 1.28-.5.05-.97.24-3.27-.68-2.77-1.1-4.53-3.94-4.67-4.12-.13-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.48-.09.18-.13.29-.27.45-.13.16-.28.36-.4.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.11.6-.07.16-.18.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.59.75 1.86.89.27.13.45.2.52.32.06.11.06.65-.16 1.29Z" />
            </svg>
            WhatsApp
          </a>
          <button
            onClick={() => open("hold")}
            className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-red transition-all hover:bg-brand-bright active:scale-[0.97]"
          >
            Hold a seat
          </button>
        </div>

        {/* Mobile: search + hamburger */}
        <div className="flex items-center gap-1 lg:hidden">
        <button
          onClick={openSearch}
          aria-label="Search trips"
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${overDark ? "text-white" : "text-ink"}`}
        >
          <SearchIcon />
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full"
        >
          <span className={`h-0.5 w-6 rounded transition-transform duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 rounded transition-opacity duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 rounded transition-transform duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
        </div>
      </nav>

      {/* Mobile menu — a compact dropdown card, not a full-screen takeover.
          Dim backdrop closes it; the card is solid cream with its own shadow. */}
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-ink/40 lg:hidden"
        />
      )}
      <div
        className={`fixed inset-x-3 z-40 origin-top rounded-3xl border border-line bg-cream shadow-card-lg transition-all duration-300 lg:hidden ${
          menuOpen ? "visible scale-100 opacity-100" : "invisible scale-[0.97] opacity-0"
        }`}
        style={{ top: "calc(var(--ann-h, 0px) + 5rem)" }}
      >
        <nav aria-label="Mobile" className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-3">
          <ul className="divide-y divide-line/70">
            {navLinks.map((l, i) => (
              <li
                key={l.href}
                className={`transition-all duration-300 ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                style={{ transitionDelay: menuOpen ? `${40 + i * 35}ms` : "0ms" }}
              >
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3.5 font-display text-lg font-extrabold tracking-tight text-ink transition-colors hover:text-brand"
                >
                  {l.label}
                  <span aria-hidden="true" className="text-sm text-ink/25">→</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-line/70 pt-3">
            <button
              onClick={() => {
                setMenuOpen(false);
                open("hold");
              }}
              className="rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-red"
            >
              Hold a seat
            </button>
            <a
              href={waLink("Hi Tripwaley! Tell me about upcoming departures ✈️")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-card px-4 py-3 text-center text-sm font-bold text-ink"
            >
              WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
