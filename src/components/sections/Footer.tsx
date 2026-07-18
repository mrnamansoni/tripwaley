"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { footerLinks, waLink } from "@/lib/data";

const LETTERS = "TRIPWALEY".split("");

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com/tripwaley",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: waLink("Hi Tripwaley! 👋"),
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Zm5.47 14.3c-.23.65-1.35 1.24-1.86 1.28-.5.05-.97.24-3.27-.68-2.77-1.1-4.53-3.94-4.67-4.12-.13-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.48-.09.18-.13.29-.27.45-.13.16-.28.36-.4.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.11.6-.07.16-.18.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.59.75 1.86.89.27.13.45.2.52.32.06.11.06.65-.16 1.29Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@tripwaley",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.2 9.4v5.2l4.6-2.6-4.6-2.6Z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function Footer() {
  const footRef = useRef<HTMLElement>(null);
  const lettersRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = lettersRef.current?.querySelectorAll("[data-letter]");
      if (!letters?.length) return;

      /* Act 1 — each letter drops in from below, staggered, on scroll into view */
      gsap.fromTo(
        letters,
        { yPercent: 112 },
        {
          yPercent: 0,
          duration: 1,
          ease: "back.out(1.35)",
          stagger: 0.065,
          scrollTrigger: { trigger: lettersRef.current, start: "top 88%" },
          onComplete: () => {
            /* Act 2 — a soft light sweeps across the letters forever; each
               letter pops as the wave passes through it (transform+opacity only) */
            gsap
              .timeline({ repeat: -1, repeatDelay: 1.4 })
              .to(letters, {
                keyframes: [
                  { yPercent: -7, scale: 1.05, opacity: 1, duration: 0.28, ease: "power2.out" },
                  { yPercent: 0, scale: 1, opacity: 0.32, duration: 0.5, ease: "power2.inOut" },
                ],
                stagger: 0.09,
              });
          },
        }
      );
    }, footRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footRef} className="relative bg-blush" aria-labelledby="footer-brand">
      {/* ---- triple-layer wave: light red → deep red → dark #111 ------------- */}
      <div className="relative" aria-hidden="true">
        <svg className="block w-full" viewBox="0 0 1440 190" preserveAspectRatio="none">
          <path
            d="M0 90 C 240 30, 480 130, 720 85 S 1200 20, 1440 70 V190 H0 Z"
            fill="#f2b9b4"
          />
          <path
            d="M0 120 C 260 60, 520 160, 760 110 S 1220 55, 1440 105 V190 H0 Z"
            fill="#c91b20"
          />
          <path
            d="M0 155 C 280 105, 560 190, 820 150 S 1240 100, 1440 145 V190 H0 Z"
            fill="#111111"
          />
        </svg>
      </div>

      <div className="bg-coal text-white">
        <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
          {/* ---- giant brand sign-off ---------------------------------------- */}
          <p
            ref={lettersRef}
            id="footer-brand"
            aria-label="TRIPWALEY"
            className="flex justify-center overflow-hidden pt-6 font-display text-[clamp(2.6rem,11.5vw,10.5rem)] font-extrabold leading-[1.05] tracking-tight"
          >
            {LETTERS.map((l, i) => (
              <span key={i} className="inline-block overflow-hidden">
                <span data-letter aria-hidden="true" className="inline-block text-white opacity-30 will-change-transform">
                  {l}
                </span>
              </span>
            ))}
          </p>

          <div className="mt-1 flex flex-col items-center">
            <p className="font-script text-2xl italic text-white/85 sm:text-3xl">
              your complete travel guru
            </p>
            <span className="mt-3 h-1 w-16 rounded-full bg-brand" aria-hidden="true" />
            {/* tiny dotted route */}
            <svg viewBox="0 0 220 34" className="mt-4 w-52" aria-hidden="true">
              <path
                d="M6 26 C 50 4, 90 30, 120 16 S 190 6, 214 14"
                stroke="var(--color-brand)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="0.1 7"
                fill="none"
              />
              <circle cx="6" cy="26" r="3" fill="var(--color-gold)" />
              <path d="M214 14l-7 1.5 3.2-4.6L206 8l8-1z" fill="var(--color-brand)" />
            </svg>
          </div>

          {/* ---- 4-column grid ----------------------------------------------- */}
          <div className="mt-16 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="flex items-baseline font-display text-2xl font-bold">
                <span className="font-script text-[1.6rem] text-brand-bright">trip</span>
                <span>waley</span>
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
                India&apos;s premium group-departure travel company. Curated batches, certified
                trip captains and zero-chaos adventures from Ladakh to Andaman.
              </p>
              <div className="mt-5 flex gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Tripwaley on ${s.label}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/75 transition-all hover:border-brand-bright hover:bg-brand hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {(
              [
                ["Destinations", footerLinks.destinations],
                ["Collections", footerLinks.collections],
                ["Company", footerLinks.company],
              ] as const
            ).map(([title, links]) => (
              <nav key={title} aria-label={title}>
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/45">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="inline-block py-0.5 text-[0.95rem] text-white/70 transition-colors hover:text-brand-bright"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* ---- bottom bar --------------------------------------------------- */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/45 sm:flex-row">
            <p>© 2026 Tripwaley Adventures Pvt. Ltd. Made with ☀️ in India.</p>
            <ul className="flex gap-6">
              {["Privacy", "Terms", "Cancellation"].map((label) => (
                <li key={label}>
                  <a href="#" className="py-2 transition-colors hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
