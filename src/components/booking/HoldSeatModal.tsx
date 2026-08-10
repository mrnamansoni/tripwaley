"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatINR } from "@/lib/data";
import { trackInitiateCheckout, trackLead } from "@/lib/analytics";
import type { BookingMode, BookingTrip } from "./BookingContext";

type Phase = "form" | "submitting" | "held" | "paying" | "confirmed";

interface Props {
  mode: BookingMode;
  initialTrip?: string;
  trips: BookingTrip[];
  onClose: () => void;
}

const priceLabel = (n: number) => (n > 0 ? `from ${formatINR(n)}` : "on request");

/**
 * Conversion modal: "Hold My Seat" (free 24h hold) and "Pay Token & Book".
 * The hold submits to /api/lead — the SAME durable pipeline the booking bar
 * uses (persists the lead + forwards to n8n/CRM). The optional token step
 * (/api/book-token) is the payment-gateway integration point.
 */
export default function HoldSeatModal({ mode, initialTrip, trips, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState(
    (initialTrip && trips.some((t) => t.slug === initialTrip) ? initialTrip : trips[0]?.slug) ?? ""
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const selected: BookingTrip =
    trips.find((t) => t.slug === trip) ?? trips[0] ?? { slug: "", name: "your trip", dateLabel: "next batch", priceFrom: 0 };

  /* Focus management + Escape to close + scroll lock */
  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // the modal only ever opens from a Hold-a-seat / Claim click, so mounting it
  // is exactly the InitiateCheckout moment Meta's install doc describes
  useEffect(() => {
    trackInitiateCheckout({
      slug: selected.slug,
      name: selected.name,
      price: selected.priceFrom,
    });
    // fire once per open, not on every trip re-pick inside the modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    // strip any country-code / leading-zero prefix before validating (a visitor
    // may type +91 or 0 ahead of the 10 digits)
    const digits = String(data.get("phone") ?? "").replace(/\D/g, "");
    const phone = digits.length > 10 ? digits.slice(-10) : digits;
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhase("submitting");
    try {
      // the SAME durable pipeline the booking bar uses: persists the lead to the
      // bookings log and forwards to n8n/CRM. (The old /api/hold-seat was a
      // placeholder that discarded the lead entirely.)
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          phone,
          package: selected.slug,
          date: selected.dateLabel,
          price: selected.priceFrom > 0 ? selected.priceFrom : null,
          source: mode === "token" ? "hold-modal-token" : "hold-modal",
        }),
      });
      if (!res.ok) throw new Error("lead failed");
      trackLead({ slug: selected.slug, name: selected.name, price: selected.priceFrom });
      setPhase("held");
    } catch {
      setPhase("form");
      setError("Couldn't reach the booking desk. Please retry or WhatsApp us.");
    }
  }

  async function payToken() {
    setPhase("paying");
    try {
      const res = await fetch("/api/book-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip: selected.slug, amount: 2000 }),
      });
      if (!res.ok) throw new Error("token failed");
      setPhase("confirmed");
    } catch {
      setPhase("held");
      setError("Payment gateway hiccup — please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      {/* Backdrop */}
      <button
        aria-label="Close booking dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/55 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-card-lg sm:rounded-3xl sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-blush hover:text-brand"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {(phase === "form" || phase === "submitting") && (
          <form onSubmit={handleSubmit}>
            <p className="font-script text-2xl text-brand">no payment needed yet!</p>
            <h2 id="booking-title" className="font-display text-3xl font-bold tracking-tight">
              Hold my seat
            </h2>
            <p className="mt-2 text-sm text-ink/65">
              We&apos;ll block a seat on <strong>{selected.name}</strong> for 24 hours,
              free. Our trip captain will WhatsApp you the full plan.
            </p>

            <label className="mt-5 block text-sm font-semibold" htmlFor="hold-name">
              Your name
            </label>
            <input
              ref={firstFieldRef}
              id="hold-name"
              name="name"
              required
              autoComplete="name"
              placeholder="Priya Sharma"
              className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-shadow focus:border-brand focus:shadow-[0_0_0_3px_rgba(201,27,32,0.12)]"
            />

            <label className="mt-4 block text-sm font-semibold" htmlFor="hold-phone">
              WhatsApp number
            </label>
            <div className="mt-1.5 flex overflow-hidden rounded-xl border border-line bg-card transition-shadow focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(201,27,32,0.12)]">
              <span className="flex items-center border-r border-line bg-blush px-3 text-sm font-semibold text-ink/70">
                +91
              </span>
              <input
                id="hold-phone"
                name="phone"
                required
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="w-full bg-transparent px-4 py-3 text-base outline-none"
              />
            </div>

            <label className="mt-4 block text-sm font-semibold" htmlFor="hold-trip">
              Trip
            </label>
            <select
              id="hold-trip"
              name="trip"
              value={trip}
              onChange={(e) => setTrip(e.target.value)}
              className="mt-1.5 w-full appearance-none rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-brand"
            >
              {trips.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} · {t.dateLabel} · {priceLabel(t.priceFrom)}
                </option>
              ))}
            </select>

            {selected.dateLabel !== "flexible dates" && (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand">
                <span className="animate-live inline-block h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                Filling fast — next batch departs {selected.dateLabel}
              </p>
            )}

            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={phase === "submitting"}
              className="mt-5 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-white shadow-red transition-all hover:bg-brand-bright active:scale-[0.98] disabled:opacity-60"
            >
              {phase === "submitting" ? "Holding your seat…" : "Hold my seat — free for 24h"}
            </button>
            <p className="mt-3 text-center text-xs text-ink/50">
              No spam, no charges. One WhatsApp message from your trip captain.
            </p>
          </form>
        )}

        {(phase === "held" || phase === "paying") && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12.5l5 5L20 6.5" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id="booking-title" className="mt-4 font-display text-3xl font-bold">
              Seat held! 🎉
            </h2>
            <p className="mt-2 text-sm text-ink/65">
              Your seat on <strong>{selected.name} · {selected.dateLabel}</strong> is
              blocked for the next <strong>24 hours</strong>. Lock it in with a token —
              fully adjusted in your trip price.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
                {error}
              </p>
            )}
            <button
              onClick={payToken}
              disabled={phase === "paying"}
              className="mt-6 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-white shadow-red transition-all hover:bg-brand-bright active:scale-[0.98] disabled:opacity-60"
            >
              {phase === "paying" ? "Opening secure payment…" : "Pay ₹2,000 token & book"}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-full border border-line bg-card px-6 py-3.5 text-sm font-semibold text-ink/70 transition-colors hover:border-brand hover:text-brand"
            >
              I&apos;ll decide within 24h
            </button>
          </div>
        )}

        {phase === "confirmed" && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
              <span className="text-3xl" aria-hidden="true">🏔️</span>
            </div>
            <h2 id="booking-title" className="mt-4 font-display text-3xl font-bold">
              You&apos;re in, waley!
            </h2>
            <p className="mt-2 text-sm text-ink/65">
              Token received for <strong>{selected.name}</strong>. Your trip captain and
              the batch WhatsApp group invite are on their way to your phone.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-base font-bold text-cream transition-transform active:scale-[0.98]"
            >
              Back to dreaming
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
