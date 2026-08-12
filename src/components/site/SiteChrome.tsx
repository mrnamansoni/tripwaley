"use client";

/* Site chrome that layers over every public page (hidden on /admin):
   1. AnnouncementBar — a slim, dismissible urgency strip pinned to the very
      top. Sets --ann-h so the navbar drops below it.
   2. LeadPopup — a timed lead-capture modal that fires after N seconds and
      posts to /api/lead (same pipeline as the booking bar). */

import SiteMedia from "./SiteMedia";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { AnnouncementBar as BarCfg, LeadPopup as PopupCfg } from "@/lib/types";

export default function SiteChrome({ bar, popup }: { bar?: BarCfg; popup?: PopupCfg }) {
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin");
  if (onAdmin) return null;
  return (
    <>
      {bar?.enabled && bar.text ? <AnnouncementBar bar={bar} /> : null}
      {popup?.enabled ? <LeadPopup popup={popup} /> : null}
    </>
  );
}

/* ------------------------------------------------ announcement bar */

function AnnouncementBar({ bar }: { bar: BarCfg }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("tw-ann-dismissed");
    if (dismissed === bar.text) return; // re-show if the message changed
    setShow(true);
    document.documentElement.style.setProperty("--ann-h", "2.5rem");
    return () => {
      document.documentElement.style.removeProperty("--ann-h");
    };
  }, [bar.text]);

  if (!show) return null;

  const inner = (
    <span className="flex items-center justify-center gap-2 px-4 text-center text-[0.72rem] font-bold tracking-wide text-ink sm:text-sm">
      {bar.emoji && <span aria-hidden="true">{bar.emoji}</span>}
      {bar.text}
      {bar.href && <span aria-hidden="true" className="font-extrabold">→</span>}
    </span>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-center bg-gold">
      {bar.href ? <a href={bar.href} className="flex-1">{inner}</a> : inner}
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setShow(false);
          sessionStorage.setItem("tw-ann-dismissed", bar.text);
          document.documentElement.style.removeProperty("--ann-h");
        }}
        className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-ink/60 hover:bg-ink/10 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}

/* ------------------------------------------------ timed lead popup */

function LeadPopup({ popup }: { popup: PopupCfg }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (localStorage.getItem("tw-lead-popup") === "done") return;
    const t = setTimeout(() => setOpen(true), Math.max(1, popup.delaySeconds) * 1000);
    return () => clearTimeout(t);
  }, [popup.delaySeconds]);

  const close = () => {
    setOpen(false);
    localStorage.setItem("tw-lead-popup", "seen");
  };

  const submit = async () => {
    if (!/^[6-9]\d{9}$/.test(phone.replace(/[^\d]/g, "").slice(-10))) {
      setState("error");
      return;
    }
    setState("sending");
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, source: "timed-popup" }),
    });
    if (res.ok) {
      setState("done");
      localStorage.setItem("tw-lead-popup", "done");
      setTimeout(() => setOpen(false), 2200);
    } else {
      setState("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Get this week's departures">
      <div className="relative grid w-full max-w-2xl overflow-hidden rounded-3xl border border-white/12 bg-cream shadow-card-lg sm:grid-cols-2">
        <button type="button" aria-label="Close" onClick={close} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-ink/60 hover:bg-ink/20 hover:text-ink">✕</button>

        <div className="relative hidden min-h-[18rem] sm:block">
          <SiteMedia src={popup.image} alt="" fill sizes="360px" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" aria-hidden="true" />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          {popup.incentive && (
            <span className="mb-3 inline-flex w-fit rounded-full bg-brand/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-brand">{popup.incentive}</span>
          )}
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{popup.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{popup.subtitle}</p>

          {state === "done" ? (
            <p className="mt-5 rounded-xl bg-success/12 px-4 py-3 text-sm font-bold text-success">✓ Got it — we&apos;ll be in touch on WhatsApp shortly.</p>
          ) : (
            <div className="mt-5 space-y-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink outline-none focus:border-brand"
              />
              <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 focus-within:border-brand">
                <span className="text-sm font-bold text-ink/50">+91</span>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (state === "error") setState("idle"); }}
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </div>
              {state === "error" && <p className="text-xs font-bold text-brand">Enter a valid 10-digit Indian mobile number.</p>}
              <button
                type="button"
                onClick={submit}
                disabled={state === "sending"}
                className="w-full rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-red transition-colors hover:bg-brand-bright disabled:opacity-50"
              >
                {state === "sending" ? "Sending…" : popup.cta || "Send"}
              </button>
              <button type="button" onClick={close} className="w-full text-center text-[0.7rem] font-semibold uppercase tracking-wider text-ink/40 hover:text-ink/70">
                No thanks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
