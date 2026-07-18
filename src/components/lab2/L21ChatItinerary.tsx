"use client";

/* L21 — "Captain's Feed" (itinerary section)
   The itinerary told the way it actually unfolds: as live updates from
   your trip captain. Scroll scrubs the conversation into view, day by
   day, complete with a dropped pin and a 5:47 AM wake-up call. */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "./shared";

const FEED = [
  { day: "DAY 1", msgs: [{ t: "Everyone's aboard. Delhi in the mirror. 🚐", time: "06:12" }, { t: "Dhaba stop — parathas are on the company.", time: "09:40" }] },
  { day: "DAY 2", msgs: [{ t: "Wake-up call at 5:47. Trust me on this one.", time: "21:30" }, { t: "📍 Pin dropped: sunrise point, 11 min walk from camp", time: "21:31", pin: true }] },
  { day: "DAY 3", msgs: [{ t: "River crossing today. Waterproof bags at the front seat.", time: "07:02" }, { t: "Everyone made it. Some drier than others. 😄", time: "16:44" }] },
  { day: "DAY 4", msgs: [{ t: "Summit day. Phones on airplane mode — the view doesn't upload anyway.", time: "04:55" }] },
];

export default function L21ChatItinerary() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-l21-item]").forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 26, scale: 0.96 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)",
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
      });
      gsap.fromTo("[data-l21-head]", { autoAlpha: 0, y: 26 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 62%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-cream py-[12vh]">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:sticky lg:top-[18vh] lg:self-start">
          <Eyebrow>how it actually reads</Eyebrow>
          <h2 data-l21-head className="mt-3 font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            Your itinerary,
            <br />
            <span className="text-brand">narrated live.</span>
          </h2>
          <p data-l21-head className="mt-5 max-w-sm text-base leading-relaxed text-ink/60">
            Every batch gets a captain and a group thread. This is a real
            week of messages — names changed, parathas real.
          </p>
          <div data-l21-head className="mt-7 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-script text-xl text-white">T</span>
            <div>
              <p className="font-bold text-ink">Captain Tenzin</p>
              <p className="text-xs text-ink/50">147 trips led · replies fast, walks faster</p>
            </div>
          </div>
        </div>

        {/* the feed */}
        <div className="space-y-6">
          {FEED.map((block) => (
            <div key={block.day}>
              <div data-l21-item className="mb-3 flex justify-center opacity-0">
                <span className="rounded-full bg-ink/8 px-4 py-1 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-ink/55">{block.day}</span>
              </div>
              <div className="space-y-2.5">
                {block.msgs.map((m, j) => (
                  <div key={j} data-l21-item className="flex max-w-[92%] items-end gap-2.5 opacity-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-script text-sm text-white">T</span>
                    <div className="rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3 shadow-sm">
                      <p className="text-[0.92rem] leading-snug text-ink">{m.t}</p>
                      {"pin" in m && m.pin && (
                        <div className="relative mt-2 h-24 w-52 overflow-hidden rounded-lg">
                          <Image src="/images/himalaya-sunrise.jpg" alt="Sunrise point" fill sizes="220px" className="object-cover" />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-xl" aria-hidden="true">📍</span>
                        </div>
                      )}
                      <p className="mt-1 text-right text-[0.58rem] text-ink/40">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div data-l21-item className="flex justify-center pt-2 opacity-0">
            <a href="#" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-success px-7 py-3.5 font-bold text-white shadow-card-lg transition-transform hover:scale-[1.03]">
              Get added to a thread →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
