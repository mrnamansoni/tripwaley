"use client";

/* CAPTAIN'S FEED — the itinerary as it actually unfolds (their L21 pick).
   Messages are generated from the package's real day-by-day itinerary and
   pop in as you scroll — the trip narrated live, day by day. */

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { ItineraryDay } from "@/lib/types";

const TIMES = ["05:47", "07:12", "09:40", "13:05", "17:26", "21:30", "23:02"];
const RIFFS = [
  "Wake-up call incoming. Trust me on this one.",
  "Everyone's aboard. Playlist wars have begun. 🚐",
  "Chai stop — this one's on the company.",
  "Phones on airplane mode. The view doesn't upload anyway.",
  "Some drier than others, but everyone made it. 😄",
  "Bonfire's lit. Guitar has appeared from somewhere.",
  "Headcount 15/15. Goodnight from the mountains.",
];

export default function CaptainFeed({
  days,
  packageName,
  captain,
}: {
  days: ItineraryDay[];
  packageName: string;
  /** whoever is fronting this trip — passed in so the name, count and initial
   *  come from the Captains tab instead of being hardcoded here */
  captain?: { name: string; trips: number; line: string };
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-cfeed-item]").forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 24, scale: 0.96 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const feed = days.slice(0, 6);

  return (
    <section ref={ref} className="bg-[#101013] py-[10vh]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="lg:sticky lg:top-[16vh] lg:self-start">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.5em] text-gold">how it reads on the road</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl">
            The captain
            <br />
            <span className="text-gold">narrates it live.</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/55">
            Every batch gets a WhatsApp thread and a captain who runs it like
            mission control. This is how {packageName} unfolds — message by message.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-script text-xl text-white">
              {(captain?.name ?? "T").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-bold text-white">Captain {captain?.name ?? "Tenzin"}</p>
              <p className="text-xs text-white/45">
                {captain?.trips ?? 147} trips led · {captain?.line ?? "replies fast, walks faster"}
              </p>
            </div>
            <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-success">
              <span className="animate-live h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              on route
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {feed.map((d, i) => (
            <div key={d.day}>
              <div data-cfeed-item className="mb-2.5 flex justify-center opacity-0">
                <span className="rounded-full bg-white/8 px-4 py-1 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/50">
                  Day {String(d.day).padStart(2, "0")}
                </span>
              </div>
              <div data-cfeed-item className="flex max-w-[94%] items-end gap-2.5 opacity-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-script text-sm text-white">T</span>
                <div className="rounded-2xl rounded-bl-md border border-white/10 bg-[#1a1922] px-4 py-3">
                  <p className="text-[0.9rem] font-semibold leading-snug text-white">{d.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-snug text-white/55">{RIFFS[i % RIFFS.length]}</p>
                  <p className="mt-1 text-right text-[0.56rem] text-white/35">{TIMES[i % TIMES.length]} ✓✓</p>
                </div>
              </div>
            </div>
          ))}
          <div data-cfeed-item className="flex justify-center pt-3 opacity-0">
            <span className="rounded-full border border-white/12 px-5 py-2.5 text-xs font-bold text-white/60">
              your name joins this thread the moment you hold a seat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
