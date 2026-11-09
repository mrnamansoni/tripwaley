"use client";

/* The main navigation. Five items, two of them category menus:
     Trips ▾ · Destinations ▾ · Creators · Corporate · Paltan ▾
   Each menu opens a full-width panel under the bar (hover or click), laid out
   as list + "view all" + one promo card — the go4explore pattern. Every list
   comes from the live catalog (NavMenuProvider), so a menu never offers a
   destination or a month with nothing in it. Below lg the same structure
   folds into the dropdown card as accordions. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/ui/Logo";
import { navPaltan, navPlain, navTripKinds } from "@/lib/data";
import { useBooking } from "@/components/booking/BookingContext";
import { useSearch } from "@/components/site/SearchProvider";
import { useNavMenu, type NavMenu } from "@/components/site/NavMenuProvider";
import SiteMedia from "@/components/site/SiteMedia";
import { inr } from "@/lib/types";

type MenuKey = "trips" | "destinations" | "paltan";

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Zm5.47 14.3c-.23.65-1.35 1.24-1.86 1.28-.5.05-.97.24-3.27-.68-2.77-1.1-4.53-3.94-4.67-4.12-.13-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.48-.09.18-.13.29-.27.45-.13.16-.28.36-.4.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.11.6-.07.16-.18.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.59.75 1.86.89.27.13.45.2.52.32.06.11.06.65-.16 1.29Z" />
    </svg>
  );
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Navbar({ overDarkHero = false }: { overDarkHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const { open, waLink } = useBooking();
  const { open: openSearch } = useSearch();
  const menu = useNavMenu();
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // a navigation closes whatever was open
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setOpenMenu(null);
  }

  // Escape closes the mobile menu or the open panel, returning focus to its trigger
  useEffect(() => {
    if (!menuOpen && !openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openMenu) {
        headerRef.current?.querySelector<HTMLButtonElement>(`[data-menu-trigger="${openMenu}"]`)?.focus();
        setOpenMenu(null);
      } else {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, openMenu]);

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

  /* hover opens at once; leaving waits a beat so a diagonal mouse path from
     the trigger down into the panel doesn't snap it shut */
  const hoverOpen = (k: MenuKey | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setOpenMenu(k);
  };
  const hoverClose = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  // Keep the header solid whenever a menu is open — otherwise, on a dark-hero
  // page opened before scrolling, the nav row stays see-through right above
  // the opaque cream panel: a jarring seam, and the dark text would vanish.
  const opaque = scrolled || menuOpen || openMenu !== null;
  // Only invert to white/gold when floating transparently over a dark hero.
  const overDark = overDarkHero && !opaque;
  const linkTone = overDark ? "text-white/85 hover:text-gold" : "text-ink/75 hover:text-ink";

  const trigger = (k: MenuKey, label: string) => (
    <button
      type="button"
      data-menu-trigger={k}
      aria-expanded={openMenu === k}
      aria-controls={`menu-${k}`}
      onClick={() => setOpenMenu((m) => (m === k ? null : k))}
      onMouseEnter={() => hoverOpen(k)}
      className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[0.95rem] font-semibold transition-colors ${
        openMenu === k ? (overDark ? "text-gold" : "text-ink") : linkTone
      }`}
    >
      {label}
      <Chevron open={openMenu === k} />
    </button>
  );

  return (
    <header
      ref={headerRef}
      style={{ top: "var(--ann-h, 0px)" }}
      onMouseLeave={hoverClose}
      onMouseEnter={() => hoverTimer.current && clearTimeout(hoverTimer.current)}
      onBlur={(e) => {
        // tabbing out of the header closes the open panel
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null);
      }}
      /* Not `transition-all`: that animated `top` too, and `top` cannot be
         composited — so every announcement-bar change repainted a fixed header
         on the main thread. Only the colour/shadow properties actually need to
         move. */
      className={`fixed inset-x-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
        menuOpen || openMenu
          ? // SOLID (no backdrop-blur) while a menu is open: backdrop-filter
            // creates a CSS containing block that would trap the fixed mobile
            // panel inside this 4.5rem-tall header.
            "border-b border-line/80 bg-cream shadow-card"
          : opaque
            ? "border-b border-line/80 bg-cream/85 shadow-card backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8" aria-label="Main">
        {/* The lockup spells out "tripwaley" and its tagline as real text, so
            the link names itself. */}
        <Link href="/" className="rounded-lg" onMouseEnter={() => hoverOpen(null)}>
          <LogoLockup inverted={overDark} />
        </Link>

        <ul className="hidden items-center gap-6 lg:flex xl:gap-8">
          <li>{trigger("trips", "Trips")}</li>
          <li>{trigger("destinations", "Destinations")}</li>
          {navPlain.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onMouseEnter={() => hoverOpen(null)}
                className={`link-sweep inline-flex min-h-11 items-center whitespace-nowrap text-[0.95rem] font-semibold transition-colors ${linkTone}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>{trigger("paltan", "Paltan")}</li>
        </ul>

        <div className="hidden items-center gap-2 lg:flex" onMouseEnter={() => hoverOpen(null)}>
          <button
            onClick={openSearch}
            aria-label="Search trips"
            title="Search trips (⌘K)"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
              overDark
                ? "border-white/30 text-white hover:border-gold hover:text-gold"
                : "border-line bg-card text-ink hover:border-brand hover:text-brand"
            }`}
          >
            <SearchIcon />
          </button>
          <a
            href={waLink("Hi Tripwaley! Tell me about upcoming departures ✈️")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp us"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-card px-3 py-2 text-sm font-bold text-ink transition-colors hover:border-success hover:text-success xl:px-4"
          >
            <WhatsAppIcon className="text-success" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>
          <button
            onClick={() => open("hold")}
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-red transition-all hover:bg-brand-bright active:scale-[0.97]"
          >
            Reserve a seat
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
            ref={menuButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full"
          >
            <span className={`h-0.5 w-6 rounded transition-transform duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 rounded transition-opacity duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 rounded transition-transform duration-300 ${overDark ? "bg-white" : "bg-ink"} ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* ---------------- desktop panels ---------------- */}
      <div className="absolute inset-x-0 top-full hidden lg:block">
        <MegaPanel id="menu-trips" open={openMenu === "trips"} label="Trips">
          <TripsPanel menu={menu} />
        </MegaPanel>
        <MegaPanel id="menu-destinations" open={openMenu === "destinations"} label="Destinations">
          <DestinationsPanel menu={menu} />
        </MegaPanel>
        <MegaPanel id="menu-paltan" open={openMenu === "paltan"} label="Paltan">
          <PaltanPanel waHref={waLink("Hi Tripwaley! I have a question 👋")} />
        </MegaPanel>
      </div>

      {/* ---------------- mobile menu ---------------- */}
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-ink/40 lg:hidden"
        />
      )}
      <div
        id="mobile-menu"
        className={`fixed inset-x-3 z-40 origin-top rounded-3xl border border-line bg-cream shadow-card-lg transition-all duration-300 lg:hidden ${
          menuOpen ? "visible scale-100 opacity-100" : "invisible scale-[0.97] opacity-0"
        }`}
        style={{ top: "calc(var(--ann-h, 0px) + 5rem)" }}
      >
        <nav
          aria-label="Mobile"
          data-lenis-prevent
          className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-3"
          // any link inside closes the card (same-page hash links don't change the path)
          onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}
        >
          <div className="divide-y divide-line/70">
            <Fold title="Trips">
              {navTripKinds.map((k) => (
                <MobileLink key={k.href} href={k.href}>{k.label}</MobileLink>
              ))}
              {menu.months.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-gold-ink">leaving in</p>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
                    {menu.months.map((m) => (
                      <Link key={m.ym} href={`/trips?month=${m.ym}`} className="inline-flex min-h-10 items-center rounded-full border border-line bg-card px-3.5 text-sm font-bold text-ink">
                        {m.label.split(" ")[0]}
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <MobileLink href="/trips" strong>All trips</MobileLink>
            </Fold>
            <Fold title="Destinations">
              {menu.destinations.map((d) => (
                <MobileLink key={d.slug} href={`/destinations/${d.slug}`}>{d.name}</MobileLink>
              ))}
              <MobileLink href="/destinations" strong>All destinations</MobileLink>
            </Fold>
            {navPlain.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex min-h-12 items-center justify-between px-3 py-3 font-display text-lg font-extrabold tracking-tight text-ink transition-colors hover:text-brand"
              >
                {l.label}
                <span aria-hidden="true" className="text-sm text-ink/65">→</span>
              </Link>
            ))}
            <Fold title="Paltan">
              {navPaltan.map((l) => (
                <MobileLink key={l.href} href={l.href}>{l.label}</MobileLink>
              ))}
            </Fold>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-line/70 pt-3">
            <button
              onClick={() => {
                setMenuOpen(false);
                open("hold");
              }}
              className="min-h-11 rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-red"
            >
              Reserve a seat
            </button>
            <a
              href={waLink("Hi Tripwaley! Tell me about upcoming departures ✈️")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-center text-sm font-bold text-ink"
            >
              <WhatsAppIcon className="text-success" />
              WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------ desktop panels */

function MegaPanel({ id, open, label, children }: { id: string; open: boolean; label: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      role="region"
      aria-label={`${label} menu`}
      // `inert` while closed keeps hidden links out of the tab order and the
      // accessibility tree, without visibility toggling the whole panel
      inert={!open}
      className={`absolute inset-x-0 top-0 border-b border-line/80 bg-cream shadow-card-lg transition-[opacity,transform] duration-200 ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-8 py-7">{children}</div>
    </div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold-ink">{children}</p>
);

const ViewAll = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-brand hover:text-ink">
    {children} <span aria-hidden="true">→</span>
  </Link>
);

function TripsPanel({ menu }: { menu: NavMenu }) {
  return (
    <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-10">
      <div>
        <Eyebrow>by kind of trip</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {navTripKinds.map((k) => (
            <li key={k.href}>
              <Link href={k.href} className="group block rounded-xl px-3 py-2.5 -mx-3 transition-colors hover:bg-card">
                <span className="block font-display text-base font-extrabold text-ink group-hover:text-brand">{k.label}</span>
                <span className="block text-xs text-ink/60">{k.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ViewAll href="/trips">View all trips</ViewAll>
      </div>
      <div>
        <Eyebrow>leaving in</Eyebrow>
        {menu.months.length ? (
          <ul className="space-y-0.5">
            {menu.months.map((m) => (
              <li key={m.ym}>
                <Link href={`/trips?month=${m.ym}`} className="group -mx-3 flex min-h-10 items-center justify-between rounded-xl px-3 transition-colors hover:bg-card">
                  <span className="font-semibold text-ink group-hover:text-brand">{m.label}</span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/55 tabular-nums">
                    {m.departures} {m.departures === 1 ? "batch" : "batches"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">New dates go up every few weeks.</p>
        )}
      </div>
      {menu.next ? (
        <PromoCard
          href={`/trips/${menu.next.slug}`}
          media={menu.next.media}
          eyebrow="next to leave"
          title={menu.next.name}
          line={`${menu.next.dateLabel}${menu.next.priceFrom ? ` · from ${inr(menu.next.priceFrom)}` : ""}`}
          cta="See the trip"
        />
      ) : (
        <PromoCard href="/trips" eyebrow="all departures" title="Every trip, every date" line="Priced from your city" cta="Browse trips" />
      )}
    </div>
  );
}

function DestinationsPanel({ menu }: { menu: NavMenu }) {
  /* grouped by state, in taxonomy order */
  const byState = new Map<string, NavMenu["destinations"]>();
  menu.destinations.forEach((d) => byState.set(d.state, [...(byState.get(d.state) ?? []), d]));
  return (
    <div className="grid grid-cols-[2.25fr_1fr] gap-10">
      <div>
        <Eyebrow>where the batches go</Eyebrow>
        <div className="columns-3 gap-8">
          {[...byState].map(([state, list]) => (
            <div key={state} className="mb-4 break-inside-avoid">
              <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink/55">{state}</p>
              <ul>
                {list.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/destinations/${d.slug}`} className="group flex min-h-9 items-baseline gap-2 font-semibold text-ink hover:text-brand">
                      {d.name}
                      <span className="font-mono text-[0.6rem] text-ink/50 tabular-nums group-hover:text-brand">{d.trips}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <ViewAll href="/destinations">All destinations</ViewAll>
      </div>
      <PromoCard
        href="/destinations#wheel"
        eyebrow="can't pick?"
        title="Spin the wheel"
        line="Let it choose your next trip"
        cta="Give it a spin"
        wheel
      />
    </div>
  );
}

function PaltanPanel({ waHref }: { waHref: string }) {
  return (
    <div className="grid grid-cols-[2.25fr_1fr] gap-10">
      <div>
        <Eyebrow>the people behind the trips</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {navPaltan.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group -mx-3 block rounded-xl px-3 py-2.5 transition-colors hover:bg-card">
                <span className="block font-display text-base font-extrabold text-ink group-hover:text-brand">{l.label}</span>
                <span className="block text-xs text-ink/60">{l.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col justify-between rounded-2xl bg-ink p-5 text-cream transition-transform hover:-translate-y-0.5"
      >
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">a real human</p>
        <div>
          <p className="mt-6 font-display text-xl font-extrabold leading-tight">Ask the paltan anything</p>
          <p className="mt-1 text-sm text-cream/70">Replies on WhatsApp</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-gold">
            <WhatsAppIcon /> Chat now →
          </p>
        </div>
      </a>
    </div>
  );
}

function PromoCard({
  href, media, eyebrow, title, line, cta, wheel = false,
}: { href: string; media?: string; eyebrow: string; title: string; line: string; cta: string; wheel?: boolean }) {
  return (
    <Link href={href} className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl bg-ink p-5 text-cream">
      {media && (
        <>
          <SiteMedia src={media} alt={title} fill sizes="320px" className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        </>
      )}
      {wheel && (
        <span aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[10px] border-dashed border-brand/70 transition-transform duration-700 group-hover:rotate-180" />
      )}
      <span className="relative text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</span>
      <span className="relative mt-2 font-display text-xl font-extrabold leading-tight">{title}</span>
      <span className="relative mt-1 text-sm text-cream/75">{line}</span>
      <span className="relative mt-4 text-sm font-bold text-gold">{cta} →</span>
    </Link>
  );
}

/* ------------------------------------------------ mobile pieces */

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 py-3 font-display text-lg font-extrabold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-ink/65 transition-transform group-open:rotate-180">
          <Chevron open={false} />
        </span>
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}

function MobileLink({ href, children, strong = false }: { href: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-[0.95rem] transition-colors hover:bg-card ${
        strong ? "font-extrabold text-brand" : "font-semibold text-ink/80"
      }`}
    >
      {children}
      {strong && <span aria-hidden="true">→</span>}
    </Link>
  );
}
