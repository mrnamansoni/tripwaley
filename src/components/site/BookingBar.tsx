"use client";

/* THE BOOKING BAR — sticky on every package page.
   City-aware live quote → batch picker → one tap: the lead is captured
   via /api/book (→ n8n → CRM) and the visitor lands in WhatsApp with a
   pre-written message. Payment (Razorpay, 40% advance) plugs into this
   same flow at deploy time. */

import { useMemo, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useCity } from "./CityProvider";
import { inr, shortDate, weekday } from "@/lib/types";

export interface BarDeparture { date: string; citySlugs: string[] }
export interface BarPrices { [citySlug: string]: { triple?: number; double?: number } }

export default function BookingBar({
  packageSlug,
  packageName,
  departures,
  prices,
  whatsapp,
}: {
  packageSlug: string;
  packageName: string;
  departures: BarDeparture[];
  prices: BarPrices;
  whatsapp: string; // digits only, e.g. 919625330270
}) {
  const { city } = useCity();
  const [occ, setOcc] = useState<"triple" | "double">("triple");
  const [date, setDate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [stub, setStub] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  const cityDeps = useMemo(() => {
    const mine = departures.filter((d) => d.citySlugs.includes(city.slug));
    return (mine.length ? mine : departures).slice(0, 6);
  }, [departures, city.slug]);

  const rule = prices[city.slug] ?? Object.values(prices)[0];
  const seat = rule?.[occ] ?? rule?.triple ?? rule?.double;
  const chosen = date || cityDeps[0]?.date || "";

  const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/[^\d]/g, "").slice(-10));

  /* step 1: the CTA opens the capture modal (phone is the lead) */
  const openModal = () => {
    setErr("");
    setModal(true);
  };

  /* step 2: confirm → capture lead WITH phone, then printer + WhatsApp */
  const confirm = async () => {
    if (busy) return;
    if (!validPhone(phone)) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, package: packageSlug, city: city.slug, date: chosen, occupancy: occ, price: seat ?? null, source: "booking-bar" }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setErr("Couldn't hold the seat — check the number and retry.");
      setBusy(false);
      return;
    }
    setModal(false);
    // the printer moment: a stub prints out of the bar, then WhatsApp opens
    gsap.fromTo("[data-bb-cta]", { scale: 0.94 }, { scale: 1, duration: 0.45, ease: "elastic.out(1.2,0.5)" });
    setStub(true);
    requestAnimationFrame(() => {
      gsap.fromTo("[data-bb-stub]", { yPercent: 96 }, { yPercent: 0, duration: 0.9, ease: "power3.out" });
      gsap.fromTo("[data-bb-stamp]", { autoAlpha: 0, scale: 2.4, rotate: 12 }, { autoAlpha: 1, scale: 1, rotate: -7, duration: 0.35, ease: "power4.in", delay: 0.75 });
    });
    const msg = encodeURIComponent(
      `Hi Tripwaley! Hold a seat for me:\n• ${packageName}\n• From ${city.name}\n• ${chosen ? `${weekday(chosen)}, ${shortDate(chosen)}` : "next batch"}\n• ${occ} sharing${seat ? ` — ${inr(seat)}/seat` : ""}${name ? `\n• Name: ${name}` : ""}\n• Mobile: ${phone.replace(/[^\d]/g, "").slice(-10)}`
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
          <div className="w-full max-w-md rounded-3xl border border-white/12 bg-[#181614] p-6 shadow-card-lg sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">seat hold · 24h free</p>
                <h3 className="mt-1.5 font-display text-2xl font-extrabold text-white">Where do we reach you?</h3>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Close" className="text-2xl leading-none text-white/40 hover:text-white">×</button>
            </div>
            <p className="mt-1.5 text-sm text-white/50">
              {packageName} · ex-{city.name} · {chosen ? `${weekday(chosen)}, ${shortDate(chosen)}` : "next batch"} · {occ}{seat ? ` · ${inr(seat)}/seat` : ""}
            </p>

            <label className="mt-6 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              Your name <span className="text-white/25">(optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Naman"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-4 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              Mobile number <span className="text-brand-bright">*</span>
              <div className="mt-1.5 flex items-center rounded-xl border border-white/15 bg-black/30 px-4 focus-within:border-gold">
                <span className="text-base text-white/50">+91</span>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && confirm()}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  className="w-full bg-transparent px-2 py-3 text-base text-white outline-none"
                />
              </div>
            </label>
            {err && <p className="mt-2.5 text-sm font-semibold text-brand-bright">{err}</p>}

            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full rounded-full bg-brand py-3.5 font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright disabled:opacity-60"
            >
              {busy ? "Holding your seat…" : "Confirm & continue on WhatsApp →"}
            </button>
            <p className="mt-3 text-center text-[0.62rem] text-white/35">
              No payment now · we hold your seat 24h · reply STOP anytime
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
                <p className="font-mono text-[0.5rem] uppercase tracking-widest text-ink/45">ex-{city.name}</p>
                <p className="font-display text-sm font-extrabold leading-tight text-ink">{packageName.slice(0, 22)}</p>
                <p className="font-mono text-[0.55rem] text-ink/55">{chosen ? `${weekday(chosen)} · ${shortDate(chosen)}` : "next batch"} · {occ}</p>
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
            {packageName} · ex-{city.name}
          </p>
          <p className="font-display text-lg font-extrabold leading-tight text-white sm:text-2xl">
            {seat ? inr(seat) : "on request"}
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
              onClick={() => setOcc(o)}
              disabled={!rule?.[o]}
              className={`min-h-9 px-3.5 py-1.5 text-[0.66rem] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 sm:min-h-10 sm:px-4 sm:py-2 sm:text-xs ${
                occ === o ? "bg-gold text-ink" : "text-white/70 hover:text-gold"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* batch picker */}
        {cityDeps.length > 0 && (
          <select
            value={chosen}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Departure date"
            className="order-4 min-h-9 max-w-[9.5rem] rounded-full border border-white/15 bg-transparent px-3.5 py-1.5 text-[0.66rem] font-bold text-white outline-none sm:order-3 sm:min-h-10 sm:max-w-none sm:px-4 sm:py-2 sm:text-xs [&>option]:text-ink"
          >
            {cityDeps.map((d) => (
              <option key={d.date} value={d.date}>
                {weekday(d.date)} · {shortDate(d.date)}
              </option>
            ))}
          </select>
        )}
      </div>
      </div>
    </>
  );
}
