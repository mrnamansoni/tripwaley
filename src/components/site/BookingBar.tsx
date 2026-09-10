"use client";

/* THE BOOKING BAR — sticky on every package page.
   City-aware live quote → batch picker → one tap.

   Two ways out of the capture modal:
     • Pay the hold online (PhonePe) — the seat is actually held
     • Continue on WhatsApp — the lead is captured via /api/lead and a human
       takes it from there

   The pay route is offered only when the gateway is configured; otherwise the
   WhatsApp path is the whole flow, exactly as before. Amounts shown here are
   display only — /api/pay/create re-prices everything server-side and charges
   from its own figure. A coupon is likewise priced by the server; see
   CouponField and /api/coupon. */

import { useEffect, useMemo, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useCity } from "./CityProvider";
import CouponField, { type AppliedCoupon } from "./CouponField";
import { useModal } from "@/hooks/useModal";
import { inr, shortDate, weekday } from "@/lib/types";
import { holdQuote, formatPaise } from "@/lib/money";
import { trackInitiateCheckout, trackLead } from "@/lib/analytics";
import { leadSource } from "@/lib/leadSource";

export interface BarDeparture { date: string; citySlugs: string[] }
export interface BarPrices { [citySlug: string]: { triple?: number; double?: number } }
export interface BarRates { holdPercent: number; gstPercent: number; advancePercent: number }

/** dispatch this to open the booking modal from anywhere on the page */
export const BOOK_EVENT = "tw:book";

export default function BookingBar({
  packageSlug,
  packageName,
  departures,
  prices,
  cityNames = {},
  whatsapp,
  rates,
  payEnabled = false,
}: {
  packageSlug: string;
  packageName: string;
  departures: BarDeparture[];
  prices: BarPrices;
  /** slug → display name for the departure-city dropdown */
  cityNames?: Record<string, string>;
  whatsapp: string; // digits only, e.g. 919625330270
  rates: BarRates;
  /** false when PhonePe isn't configured — then no Pay button is rendered at all */
  payEnabled?: boolean;
}) {
  const { city } = useCity();
  const [occ, setOcc] = useState<"triple" | "double">("triple");
  const [date, setDate] = useState<string>("");
  const [pax, setPax] = useState(1);

  /* The cities this package is actually priced from. The bar used to take the
     boarding city from the site-wide CityProvider, which is a browsing
     preference, not a bookable choice — so a visitor whose city had no rule for
     this trip saw "on request" with no way forward. Booking now picks from
     THIS package's priced cities, defaulting to the global one when it is among
     them. An unpriced city can no longer be selected at all. */
  const bookableCities = useMemo(() => Object.keys(prices), [prices]);
  const [pickedCity, setPickedCity] = useState<string>("");
  const bookCity =
    pickedCity && prices[pickedCity]
      ? pickedCity
      : prices[city.slug]
        ? city.slug
        : bookableCities[0] ?? city.slug;
  const bookCityName = cityNames[bookCity] ?? (bookCity === city.slug ? city.name : bookCity);
  const [busy, setBusy] = useState(false);
  const [stub, setStub] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponNote, setCouponNote] = useState("");
  const dialogRef = useModal<HTMLDivElement>(modal, () => setModal(false));

  const cityDeps = useMemo(() => {
    const mine = departures.filter((d) => d.citySlugs.includes(bookCity));
    return (mine.length ? mine : departures).slice(0, 6);
  }, [departures, bookCity]);

  /* NO cross-city fallback.
     This used to read `prices[city.slug] ?? Object.values(prices)[0]`, so a city
     with no price rule silently displayed some OTHER city's rate — the bar said
     "ex-Guwahati · ₹5,000/seat" using Delhi's price. The server prices from the
     catalog and correctly refuses ("this trip is priced on request"), so the
     visitor filled in the whole form and was rejected at the payment step.
     An unpriced city must read as unpriced here too. */
  const rule = prices[bookCity];
  const seat = rule?.[occ] ?? rule?.triple ?? rule?.double;
  const chosen = date || cityDeps[0]?.date || "";
  /* No date anywhere — not in the shared departures list, not on the creator's
     own dates, and none preselected by a date card. The bar used to call this
     "next batch", which reads as "we'll put you on the next one" when in fact
     there is nothing to put anyone on, and it let the booking through with an
     empty date that reached the CRM as null. */
  const noDates = !chosen;

  /* every date the picker offers, `chosen` always among them */
  const barDates = useMemo(() => {
    const all = cityDeps.map((d) => d.date);
    if (chosen && !all.includes(chosen)) all.unshift(chosen);
    return all.sort();
  }, [cityDeps, chosen]);

  /* Anything that changes WHAT is being priced invalidates an applied coupon.
     Its `total` was computed server-side for the old pax/city/occupancy, and
     this bar shows the hold derived from that figure — so leaving it applied
     quoted one amount and charged another (₹423.94 shown, ₹1,271.81 taken at
     three travellers). Dropping it is the honest move: the visitor sees the
     code has gone and re-applies it against the new basket. */
  const reprice = () => {
    if (coupon) {
      setCoupon(null);
      setCouponNote("Your code was removed — the trip changed. Re-apply it below.");
    }
  };
  const changePax = (next: number) => { setPax(next); reprice(); };
  const changeOcc = (next: "triple" | "double") => { setOcc(next); reprice(); };
  const changeCity = (next: string) => { setPickedCity(next); reprice(); };

  const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/[^\d]/g, "").slice(-10));
  /* Deliberately permissive: one @, a dot in the domain, no spaces. Anything
     stricter starts rejecting real addresses, and the confirmation email is
     what proves it rather than a regex. */
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

  /* Name, email and phone are all required now, on BOTH routes out of this
     modal. The pay route already demanded a name server-side; the WhatsApp
     route asked for a phone alone, so leads arrived with no way to send a
     confirmation or an invoice. One rule, checked in one place. */
  const missing = (): string | null => {
    if (name.trim().length < 2) return "Please tell us your name.";
    if (!validEmail(email)) return "Enter a valid email — that is where your booking confirmation goes.";
    if (!validPhone(phone)) return "Enter a valid 10-digit mobile number.";
    return null;
  };

  /* the hold, shown so the traveller knows the number before they commit.
     One seat at a time in this bar, so the trip total is the seat price —
     or the coupon's total when one is applied. */
  /* pax multiplies the trip, and therefore the hold. The server re-derives this
     from its own catalog rate — this figure is display only. */
  const tripTotal = coupon?.total ?? (seat != null ? seat * pax : 0);
  const quote = holdQuote({ total: tripTotal, ...rates });
  /* No payable date means no Pay button at all, rather than one that takes the
     money and books an unnamed departure. The WhatsApp path stays open — an
     enquiry about a trip with no published dates is a perfectly good lead, and
     it is the only thing left for this visitor to do. */
  const canPay = payEnabled && quote.chargeable && !noDates;

  /* pay → server prices it again, creates the order, hands back PhonePe's URL */
  const payNow = async () => {
    if (busy) return;
    /* Never take money for a departure we cannot name. /api/pay/create would
       accept an empty date and freeze it onto the order, which is how a paid
       booking reached the CRM with departureDate: null. */
    if (noDates) {
      setErr("No dates are open for this trip yet — message us and we'll book you onto the next batch.");
      return;
    }
    /* Checked here so the visitor is told before the button says "Opening
       secure payment…", not after a 422 comes back. */
    const bad = missing();
    if (bad) { setErr(bad); return; }
    setBusy(true);
    setErr("");
    trackInitiateCheckout({ slug: packageSlug, name: packageName, price: seat });

    const res = await fetch("/api/pay/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        packageSlug,
        citySlug: bookCity,
        date: chosen,
        occupancy: occ,
        pax,
        couponCode: coupon?.code ?? "",
        source: leadSource("booking-bar", { packageSlug }),
      }),
    }).catch(() => null);

    const json = await res?.json().catch(() => null);
    if (!res?.ok || !json?.ok || !json.redirectUrl) {
      setErr(json?.error ?? "Couldn't start the payment. Please try again, or use WhatsApp.");
      setBusy(false);
      return;
    }
    // leaving the site — keep the button in its busy state through the handover
    window.location.href = json.redirectUrl;
  };

  /* Other parts of the page can open this bar's modal — the creator trip page's
     per-date cards do, so "Request this seat" books instead of opening WhatsApp.
     A window event rather than context: the callers are server-rendered markup
     far from this tree, and a one-line dispatch beats threading a provider
     through pages that otherwise need no client state. */
  useEffect(() => {
    const onBook = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (detail?.date) setDate(detail.date);
      setErr("");
      setModal(true);
      trackInitiateCheckout({ slug: packageSlug, name: packageName, price: seat });
    };
    window.addEventListener(BOOK_EVENT, onBook);
    return () => window.removeEventListener(BOOK_EVENT, onBook);
  }, [packageSlug, packageName, seat]);

  /* step 1: the CTA opens the capture modal (phone is the lead) */
  const openModal = () => {
    setErr("");
    setModal(true);
    // the hold flow has genuinely started — this is the moment Meta's install
    // doc means by "on the Hold a seat button click"
    trackInitiateCheckout({ slug: packageSlug, name: packageName, price: seat });
  };

  /* step 2: confirm → capture lead WITH phone, then printer + WhatsApp */
  const confirm = async () => {
    if (busy) return;
    const bad = missing();
    if (bad) { setErr(bad); return; }
    setBusy(true);
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name, email, phone, package: packageSlug, city: bookCity, date: chosen, occupancy: occ,
        price: tripTotal || null, pax,
        // the server re-prices this code itself; the lead event carries the
        // coupon only because this line sends it
        couponCode: coupon?.code ?? "",
        source: leadSource("booking-bar", { packageSlug }),
      }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setErr("Couldn't hold the seat — check the number and retry.");
      setBusy(false);
      return;
    }
    setModal(false);
    // the lead actually persisted (/api/lead returned ok) — the real
    // conversion until payments exist
    trackLead({ slug: packageSlug, name: packageName, price: seat });
    // the printer moment: a stub prints out of the bar, then WhatsApp opens
    gsap.fromTo("[data-bb-cta]", { scale: 0.94 }, { scale: 1, duration: 0.45, ease: "elastic.out(1.2,0.5)" });
    setStub(true);
    requestAnimationFrame(() => {
      gsap.fromTo("[data-bb-stub]", { yPercent: 96 }, { yPercent: 0, duration: 0.9, ease: "power3.out" });
      gsap.fromTo("[data-bb-stamp]", { autoAlpha: 0, scale: 2.4, rotate: 12 }, { autoAlpha: 1, scale: 1, rotate: -7, duration: 0.35, ease: "power4.in", delay: 0.75 });
    });
    const msg = encodeURIComponent(
      `Hi Tripwaley! Hold a seat for me:\n• ${packageName}\n• From ${bookCityName}\n• ${chosen ? `${weekday(chosen)}, ${shortDate(chosen)}` : "dates not published yet"}\n• ${pax} traveller${pax > 1 ? "s" : ""}, ${occ} sharing${seat != null ? ` — ${inr(seat)}/seat` : ""}${coupon ? `\n• Coupon: ${coupon.code} (${coupon.label}) — ${inr(coupon.total)}` : ""}${name ? `\n• Name: ${name}` : ""}\n• Mobile: ${phone.replace(/[^\d]/g, "").slice(-10)}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank", "noopener");
      setBusy(false);
      setTimeout(() => setStub(false), 6000);
    }, 1400);
  };

  return (
    <>
      {/* phone-capture modal — rendered OUTSIDE the backdrop-blur bar: backdrop-filter
          creates a containing block, which would otherwise trap this fixed overlay
          inside the ~60px bar and clip it off the bottom of the screen. */}
      {modal && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Hold your seat">
          <div ref={dialogRef} className="w-full max-w-md rounded-3xl border border-white/12 bg-[#181614] p-6 shadow-card-lg sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">
                  {canPay ? `seat hold · ${quote.holdPercent}% now` : "seat hold · 24h free"}
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-extrabold text-white">Where do we reach you?</h3>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Close" className="text-2xl leading-none text-white/40 hover:text-white">×</button>
            </div>
            {/* The trip name was set in the same small grey run as the date,
                city and occupancy — the one thing the visitor most needs to
                confirm before paying was the hardest thing to read. It leads
                now, at full contrast; the details stay secondary beneath it. */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="font-display text-lg font-extrabold leading-tight text-white sm:text-xl">
                {packageName}
              </p>
              <p className="mt-1 text-[0.82rem] text-white/60">
                ex-{bookCityName} · {chosen ? `${weekday(chosen)}, ${shortDate(chosen)}` : "dates on request"} ·{" "}
                {pax} × {occ}{seat != null ? ` · ${inr(seat)}/seat` : ""}
              </p>
            </div>

            {/* Enter follows the PRIMARY button, whichever that currently is */}
            <form onSubmit={(e) => { e.preventDefault(); if (canPay) payNow(); else confirm(); }} noValidate>
            <label className="mt-6 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              Your name <span className="text-brand-bright">*</span>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setErr(""); }}
                placeholder="e.g. Naman"
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-4 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              Email <span className="text-brand-bright">*</span>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none transition-colors focus:border-gold"
              />
              <span className="mt-1.5 block text-[0.66rem] font-normal normal-case tracking-normal text-white/35">
                So we can send your booking confirmation and invoice.
              </span>
            </label>
            <label className="mt-4 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              Mobile number <span className="text-brand-bright">*</span>
              <div className="mt-1.5 flex items-center rounded-xl border border-white/15 bg-black/30 px-4 focus-within:border-gold">
                <span className="text-base text-white/50">+91</span>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErr(""); }}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  className="w-full bg-transparent px-2 py-3 text-base text-white outline-none"
                />
              </div>
            </label>
            {seat != null && (
              <>
                <CouponField
                  packageSlug={packageSlug}
                  citySlug={bookCity}
                  occupancy={occ}
                  pax={pax}
                  applied={coupon}
                  onApply={(c) => { setCoupon(c); setCouponNote(""); }}
                  onClear={() => { setCoupon(null); setCouponNote(""); }}
                />
                {couponNote && (
                  <p className="mt-2 text-[0.72rem] font-semibold text-gold">{couponNote}</p>
                )}
                {coupon && (
                  <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
                      your price
                    </span>
                    <span className="font-display text-xl font-extrabold text-white">
                      {inr(coupon.total)}
                      <span className="ml-2 text-sm font-bold text-white/35 line-through">{inr(seat)}</span>
                    </span>
                  </div>
                )}
              </>
            )}

            {/* an unpriced city is now honest about it, instead of showing another
                city's rate and failing at the payment step */}
            {seat == null && (
              <div className="mt-5 rounded-xl border border-gold/25 bg-gold/10 p-4">
                <p className="text-sm font-bold text-gold">No online rate from {bookCityName} yet.</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-white/55">
                  We price this trip individually from here. Send your number and we&apos;ll come back
                  with a quote — or switch your boarding city in the bar below to book instantly.
                </p>
              </div>
            )}

            {noDates && payEnabled && (
              <div className="mt-5 rounded-xl border border-gold/25 bg-gold/10 p-4">
                <p className="text-sm font-bold text-gold">No dates published for this trip yet.</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-white/55">
                  Send us your number and we&apos;ll tell you the moment the next batch opens —
                  there&apos;s nothing to pay for until there is a date to hold.
                </p>
              </div>
            )}

            {canPay && (
              <div className="mt-5 rounded-xl border border-white/12 bg-black/25 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">pay now to hold</span>
                  <span className="font-display text-2xl font-extrabold text-gold">{formatPaise(quote.holdTotalPaise)}</span>
                </div>
                <p className="mt-1.5 text-[0.68rem] leading-relaxed text-white/40">
                  {quote.holdPercent}% of {inr(tripTotal)}
                  {quote.holdGstPaise > 0 && <> + {quote.gstPercent}% GST</>} — counts toward your trip,
                  not on top of it. Our team collects {formatPaise(quote.advanceBalancePaise)} closer to
                  the date, and {formatPaise(quote.departureBalancePaise)} is due at departure.
                </p>
              </div>
            )}

            {err && <p className="mt-2.5 text-sm font-semibold text-brand-bright">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full rounded-full bg-brand py-3.5 font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright disabled:opacity-60"
            >
              {busy
                ? canPay ? "Opening secure payment…" : "Holding your seat…"
                : canPay ? `Pay ${formatPaise(quote.holdTotalPaise)} & hold my seat →` : "Confirm & continue on WhatsApp →"}
            </button>

            {canPay && (
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="mt-3 w-full rounded-full border border-white/20 py-3 text-sm font-bold text-white/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
              >
                Or talk to us on WhatsApp first
              </button>
            )}
            </form>
            <p className="mt-3 text-center text-[0.62rem] text-white/35">
              {canPay
                ? "Secure payment by PhonePe · UPI, card or netbanking"
                : "No payment now · we hold your seat 24h · reply STOP anytime"}
            </p>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/92 backdrop-blur-xl">
      {/* the printed stub (their L29 pick) — slides up out of the bar */}
      {stub && (
        <div className="pointer-events-none absolute bottom-full right-4 w-64 overflow-hidden sm:right-10">
          <div data-bb-stub className="relative rounded-t-xl bg-[#f7f2e4] px-5 pb-3 pt-4 shadow-card-lg will-change-transform">
            <div className="flex items-start justify-between border-b border-dashed border-ink/20 pb-2.5">
              <p className="font-script text-lg text-brand">tripwaley</p>
              <p className="text-right font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink/50">seat hold<br />24 hrs</p>
            </div>
            <div className="flex items-end justify-between pt-2.5">
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-widest text-ink/45">ex-{bookCityName}</p>
                <p className="font-display text-sm font-extrabold leading-tight text-ink">{packageName.slice(0, 22)}</p>
                <p className="font-mono text-[0.55rem] text-ink/55">{chosen ? `${weekday(chosen)} · ${shortDate(chosen)}` : "dates on request"} · {occ}</p>
              </div>
              <div data-bb-stamp className="opacity-0">
                <span className="inline-block rounded border-2 border-success px-1.5 py-0.5 font-display text-[0.55rem] font-extrabold uppercase tracking-widest text-success">
                  Holding
                </span>
              </div>
            </div>
            <div className="mt-2 flex h-4 items-end gap-[2px]" aria-hidden="true">
              {Array.from({ length: 26 }).map((_, i) => (
                <span key={i} className="w-[2px] bg-ink" style={{ height: `${40 + ((i * 37) % 60)}%` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* two compact rows on phones, one row from sm: up */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2.5 sm:px-8 sm:py-3">
        {/* quote */}
        <div className="min-w-0">
          <p className="truncate text-[0.55rem] font-bold uppercase tracking-widest text-white/45 sm:text-[0.6rem]">
            {packageName} · ex-{bookCityName}
          </p>
          <p className="font-display text-lg font-extrabold leading-tight text-white sm:text-2xl">
            {seat != null ? inr(seat) : "on request"}
            <span className="ml-1.5 text-[0.58rem] font-bold uppercase tracking-wider text-white/40 sm:text-[0.62rem]">/seat</span>
          </p>
        </div>

        <button
          data-bb-cta
          type="button"
          onClick={openModal}
          disabled={busy}
          className="order-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright disabled:opacity-60 sm:order-4 sm:px-8 sm:py-3"
        >
          {busy ? "Holding…" : "Hold my seat →"}
        </button>

        {/* occupancy toggle */}
        <div className="order-3 flex overflow-hidden rounded-full border border-white/15 sm:order-2" role="group" aria-label="Sharing type">
          {(["triple", "double"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => changeOcc(o)}
              disabled={!rule?.[o]}
              className={`min-h-9 px-3.5 py-1.5 text-[0.66rem] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 sm:min-h-10 sm:px-4 sm:py-2 sm:text-xs ${
                occ === o ? "bg-gold text-ink" : "text-white/70 hover:text-gold"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* travellers — pax multiplies the trip total and therefore the hold */}
        <div className="order-5 flex items-center overflow-hidden rounded-full border border-white/15 sm:order-3" role="group" aria-label="Travellers">
          <button
            type="button"
            onClick={() => changePax(Math.max(1, pax - 1))}
            disabled={pax <= 1}
            aria-label="One fewer traveller"
            className="min-h-9 px-3 text-sm font-bold text-white/70 transition-colors hover:text-gold disabled:opacity-25 sm:min-h-10"
          >
            −
          </button>
          <span className="min-w-[3.6rem] text-center text-[0.66rem] font-bold uppercase tracking-wider text-white sm:text-xs" aria-live="polite">
            {pax} {pax === 1 ? "pax" : "pax"}
          </span>
          <button
            type="button"
            onClick={() => changePax(Math.min(20, pax + 1))}
            disabled={pax >= 20}
            aria-label="One more traveller"
            className="min-h-9 px-3 text-sm font-bold text-white/70 transition-colors hover:text-gold disabled:opacity-25 sm:min-h-10"
          >
            +
          </button>
        </div>

        {/* departure city — ONLY cities this package is priced from */}
        {bookableCities.length > 1 && (
          <select
            value={bookCity}
            onChange={(e) => changeCity(e.target.value)}
            aria-label="Departure city"
            className="order-6 min-h-9 max-w-[9.5rem] rounded-full border border-white/15 bg-transparent px-3.5 py-1.5 text-[0.66rem] font-bold text-white outline-none sm:order-3 sm:min-h-10 sm:max-w-none sm:px-4 sm:py-2 sm:text-xs [&>option]:text-ink"
          >
            {bookableCities.map((c) => (
              <option key={c} value={c}>
                from {cityNames[c] ?? c}
              </option>
            ))}
          </select>
        )}

        {/* batch picker.
            `chosen` can be a date a DATE CARD selected that this list doesn't
            contain — the cards come from the creator's own dates, these options
            from the shared departures collection. A <select> whose value has no
            option renders the first one instead, so the bar showed one date
            while the modal booked another. Union, so what is displayed is
            always what will be sent. */}
        {barDates.length > 0 && (
          <select
            value={chosen}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Departure date"
            className="order-4 min-h-9 max-w-[9.5rem] rounded-full border border-white/15 bg-transparent px-3.5 py-1.5 text-[0.66rem] font-bold text-white outline-none sm:order-3 sm:min-h-10 sm:max-w-none sm:px-4 sm:py-2 sm:text-xs [&>option]:text-ink"
          >
            {barDates.map((d) => (
              <option key={d} value={d}>
                {weekday(d)} · {shortDate(d)}
              </option>
            ))}
          </select>
        )}
      </div>
      </div>
    </>
  );
}
