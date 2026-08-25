"use client";

/* THE CURTAIN — footer (their L37 pick, "good one").
   The page lifts away like a theatre curtain, revealing the footer that
   was underneath the whole time. The film ends; the credits roll.
   Everything here reads from settings — the future admin owns it. */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";

const COLS = [
  { head: "Trips", links: [["All departures", "/trips"], ["Himachal", "/trips"], ["Uttarakhand", "/trips"], ["Kashmir", "/trips"]] },
  { head: "Company", links: [["About us", "/about"], ["Reviews", "/#reviews"], ["Contact", "/contact"], ["Stories", "/stories"]] },
  { head: "Help", links: [["WhatsApp us", "wa"], ["FAQs", "/about#faqs"], ["Cancellation", "/refund-policy"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Policies", "/policies"]] },
];

/** 919625330270 → +91 96253 30270, so the footer never drifts from Settings */
function prettyPhone(raw: string): string {
  const d = (raw ?? "").replace(/[^\d]/g, "");
  if (!d) return "";
  const ten = d.length > 10 ? d.slice(-10) : d;
  const cc = d.length > 10 ? d.slice(0, d.length - 10) : "91";
  return ten.length === 10 ? `+${cc} ${ten.slice(0, 5)} ${ten.slice(5)}` : `+${d}`;
}

export default function CurtainFooter({
  whatsappLink,
  whatsapp = "",
  announcement,
  eyebrow = "the end of the page",
  headline = "…not of the map.",
  sub = "Somewhere a batch is boarding without you — Spiti at first light, Kashmir in bloom, Meghalaya after the rain. All still unstamped in your passport.",
  cue = "keep pulling ↓",
}: {
  whatsappLink: string;
  /** digits from Settings; the visible number is derived from this, never typed */
  whatsapp?: string;
  announcement: string;
  eyebrow?: string;
  headline?: string;
  sub?: string;
  cue?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.45 };
      gsap.to("[data-cf-curtain]", { yPercent: -100, ease: "none", scrollTrigger: st });
      gsap.fromTo("[data-cf-mark]", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: st });
      gsap.fromTo("[data-cf-item]", { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1, y: 0, ease: "none", stagger: 0.04,
        scrollTrigger: { ...st, start: "40% bottom", end: "80% bottom" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={ref} className="relative h-[160vh] sm:h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-[#12100d]">
        {/* the credits, underneath all along — compact 2-col on phones so it
            always fits one screen */}
        <div className="absolute inset-0 flex flex-col justify-between px-5 pb-4 pt-[9vh] sm:px-10 sm:pb-6 sm:pt-[12vh]">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-[1.3fr_1fr_1fr_1fr] sm:gap-10">
            <div data-cf-item className="col-span-2 sm:col-span-1">
              <p className="font-script text-2xl text-gold sm:text-3xl">stay restless</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/45 sm:mt-3 sm:text-sm">{announcement}</p>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-3.5 inline-flex min-h-10 items-center gap-2.5 rounded-full bg-success px-5 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.03] sm:mt-5 sm:min-h-11 sm:px-6 sm:py-3 sm:text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Z" /></svg>
                {prettyPhone(whatsapp) || "WhatsApp us"}
              </a>
            </div>
            {COLS.map((col) => (
              <nav key={col.head} data-cf-item aria-label={col.head}>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/40 sm:text-[0.62rem] sm:tracking-[0.35em]">{col.head}</p>
                <ul className="mt-2.5 space-y-1.5 sm:mt-4 sm:space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href === "wa" ? (
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-[0.82rem] font-semibold text-white/75 transition-colors hover:text-gold sm:text-[0.95rem]">
                          <span aria-hidden="true" className="hidden h-px w-0 bg-gold transition-all duration-300 group-hover:w-4 sm:block" />
                          {label}
                        </a>
                      ) : (
                        <Link href={href} className="group inline-flex items-center gap-2 text-[0.82rem] font-semibold text-white/75 transition-colors hover:text-gold sm:text-[0.95rem]">
                          <span aria-hidden="true" className="hidden h-px w-0 bg-gold transition-all duration-300 group-hover:w-4 sm:block" />
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="overflow-x-clip py-[0.12em]">
            <p data-cf-mark aria-label="tripwaley" className="select-none whitespace-nowrap text-center font-display text-[18vw] font-extrabold leading-[1.06] tracking-tighter will-change-transform sm:text-[16.5vw]">
              {"tripwaley".split("").map((ch, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="cf-letter"
                  style={{ animationDelay: `${i * 0.11}s`, color: i < 4 ? "var(--color-brand)" : "#FFFCF8" }}
                >
                  {ch}
                </span>
              ))}
            </p>
          </div>

          <div data-cf-item className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3.5 text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-white/35 sm:pt-5 sm:text-[0.6rem] sm:tracking-[0.2em]">
            <p>© 2026 Tripwaley · departures from 12 cities</p>
            <p className="hidden text-white/25 sm:block">free cancellation until 7 days before departure</p>
            <p>made between trips</p>
          </div>
        </div>

        {/* the curtain */}
        <div data-cf-curtain className="absolute inset-0 flex flex-col items-center justify-center bg-cream px-6 text-center will-change-transform">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-ink/45">{eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            {headline}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/55 sm:text-base">
            {sub}
          </p>

          {/* destinations still waiting */}
          <div className="mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
            {["Spiti", "Ladakh", "Kashmir", "Meghalaya", "Kerala", "Kedarkantha", "Andaman", "Rajasthan"].map((d, i) => (
              <span key={d} className="flex items-center gap-2.5">
                {i > 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-brand/40" />}
                <span className="text-[0.66rem] font-bold uppercase tracking-[0.25em] text-brand/70">{d}</span>
              </span>
            ))}
          </div>

          {/* the receipt so far */}
          <div className="mt-8 flex items-center gap-6 sm:gap-10">
            {[
              ["12", "cities boarding"],
              ["300+", "departures a year"],
              ["12,000", "already gone"],
            ].map(([n, label]) => (
              <div key={label}>
                <p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{n}</p>
                <p className="mt-1 text-[0.56rem] font-bold uppercase tracking-[0.2em] text-ink/45 sm:text-[0.62rem]">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 font-script text-2xl text-brand">{cue}</p>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-ink/25" />
        </div>
      </div>
    </footer>
  );
}
