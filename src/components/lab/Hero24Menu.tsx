"use client";

/* HERO 24 — "The Tasting Menu"
   The luxury-restaurant pattern: an austere list of journeys; hovering a
   line floods the room with that destination. Hairline rules, serial
   numbers, serif italics — quiet money. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const COURSES = [
  { n: "I", name: "Ladakh", detail: "seven nights · high passes", price: "₹24,999", img: "/images/ladakh.jpg" },
  { n: "II", name: "Spiti", detail: "eight nights · cold desert", price: "₹18,999", img: "/images/spiti.jpg" },
  { n: "III", name: "Meghalaya", detail: "six nights · living bridges", price: "₹17,999", img: "/images/meghalaya.jpg" },
  { n: "IV", name: "Kerala", detail: "six nights · backwaters", price: "₹16,999", img: "/images/kerala.jpg" },
  { n: "V", name: "Andaman", detail: "six nights · emerald reefs", price: "₹28,999", img: "/images/andaman.jpg" },
];

export default function Hero24Menu() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-menu-row]",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: ref.current, start: "top 60%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen overflow-hidden bg-[#111010]"
      onPointerLeave={() => setActive(null)}
    >
      {/* full-bleed destination floods in behind the menu */}
      {COURSES.map((c, i) => (
        <div
          key={c.img}
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
          style={{ opacity: active === i ? 1 : 0 }}
        >
          <Image src={c.img} alt="" fill sizes="100vw" className="scale-105 object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ))}

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-24 sm:px-10">
        <div className="flex items-end justify-between border-b border-white/15 pb-6">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.5em] text-gold">Tripwaley presents</p>
            <h1 className="mt-3 text-4xl font-light text-white sm:text-6xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              The monsoon <em className="italic text-[#e8d5b5]">carte</em>
            </h1>
          </div>
          <p className="hidden text-right text-[0.62rem] font-semibold uppercase tracking-[0.3em] leading-loose text-white/40 sm:block">
            Season VII
            <br />
            Jul — Sep 2026
          </p>
        </div>

        <ul className="mt-2">
          {COURSES.map((c, i) => (
            <li key={c.name} data-menu-row>
              <a
                href="#"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group flex items-baseline gap-5 border-b border-white/10 py-6 outline-offset-8 transition-all duration-500 hover:border-gold/60 sm:gap-8 sm:py-7"
              >
                <span className="w-8 text-sm italic text-gold/80" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                  {c.n}
                </span>
                <span
                  className={`text-3xl font-light transition-all duration-500 sm:text-5xl ${
                    active === i ? "translate-x-3 italic text-white" : "text-white/85"
                  }`}
                  style={{ fontFamily: "var(--font-fraunces), serif" }}
                >
                  {c.name}
                </span>
                <span className="hidden flex-1 border-b border-dotted border-white/20 sm:block" aria-hidden="true" />
                <span className="hidden text-xs uppercase tracking-[0.25em] text-white/45 sm:block">{c.detail}</span>
                <span className="ml-auto text-sm font-semibold text-gold sm:ml-0">{c.price}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/35">
            service compris · captains at every table
          </p>
          <a href="#" className="border border-white/25 px-7 py-3.5 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white transition-all duration-500 hover:border-gold hover:text-gold">
            Reserve
          </a>
        </div>
      </div>
    </section>
  );
}
