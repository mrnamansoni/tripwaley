"use client";

/* L23 — "The Long Read" (itinerary / story section)
   NYT-grade scrollytelling: the photography stays pinned and crossfades
   while chapters of text drift past it. The reader controls the pace;
   the pictures keep up. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap";

const CHAPTERS = [
  { img: "traveller-street", kicker: "Hour 0", title: "It starts in traffic", body: "Every great escape begins in a jam on NH44, someone's aux cable already causing diplomatic incidents. By the first toll, strangers are splitting snacks." },
  { img: "group-trek", kicker: "Hour 26", title: "Legs meet mountain", body: "The trail doesn't care about your gym streak. It cares that you keep walking. Somewhere past the second ridge, the group finds its rhythm — single file, bad jokes, shared water." },
  { img: "camp-tents", kicker: "Hour 38", title: "Camp runs on firelight", body: "Phones die politely. Someone produces a guitar that has no business being this far up. The cook makes dal that outperforms every restaurant you've rated five stars." },
  { img: "stars", kicker: "Hour 41", title: "Then the sky shows off", body: "At 3,900 metres there's nothing between you and everything. The Milky Way isn't a photo trick. It's just been waiting for you to leave the city." },
];

export default function L23Scrolly() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-l23-step]").forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        });
        gsap.fromTo(step.querySelector("[data-l23-card]"), { autoAlpha: 0, y: 44 }, {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 68%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-ink">
      <div className="mx-auto grid w-full max-w-7xl gap-0 px-0 lg:grid-cols-2 lg:gap-10 lg:px-8">
        {/* pinned media */}
        <div className="sticky top-0 h-[52vh] self-start overflow-hidden lg:top-[8vh] lg:h-[84vh] lg:rounded-3xl">
          {CHAPTERS.map((c, i) => (
            <div key={c.img} className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out" style={{ opacity: i === active ? 1 : 0 }} aria-hidden={i !== active}>
              <Image src={`/images/${c.img}.jpg`} alt="" fill sizes="(max-width:1024px) 100vw, 50vw" className="scale-105 object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden="true" />
          {/* chapter meter */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <p key={active} className="animate-[fadeUp_.4s_ease-out] font-display text-5xl font-extrabold text-white/90">{String(active + 1).padStart(2, "0")}</p>
            <div className="flex flex-col gap-1.5" aria-hidden="true">
              {CHAPTERS.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-9 bg-gold" : "w-4 bg-white/30"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* the chapters */}
        <div className="px-5 sm:px-8 lg:px-0">
          {CHAPTERS.map((c, i) => (
            <div key={c.title} data-l23-step className="flex min-h-[88vh] items-center py-14">
              <div data-l23-card className="max-w-md opacity-0">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.3em] text-gold">{c.kicker}</p>
                <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">{c.title}</h3>
                <p className="mt-5 text-base leading-relaxed text-white/65">{c.body}</p>
                {i === CHAPTERS.length - 1 && (
                  <a href="#" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-8 py-4 font-bold text-ink transition-transform hover:scale-[1.04]">
                    Live hour 41 yourself →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
