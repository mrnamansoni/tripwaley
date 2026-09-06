"use client";

/* ASK <CREATOR> — the "talk to a human first" moment.
 *
 * This used to be a small outline button sitting next to the hero CTA, where
 * it competed with the thing the page is actually for: holding a seat. It is a
 * different intent — someone who is nearly convinced and wants to ask one
 * question — so it belongs low on the page, after the trip has made its case.
 *
 * Built once for every creator: name, portrait, handle and accent all come
 * from the creator record, so nothing here is specific to any one of them.
 */

import { useEffect, useRef } from "react";
import SiteMedia from "@/components/site/SiteMedia";

export default function AskCreator({
  firstName,
  name,
  handle,
  portrait,
  waLink,
  accent = "gold",
  question,
}: {
  firstName: string;
  name: string;
  handle: string;
  portrait: string;
  waLink: string;
  accent?: "brand" | "gold";
  /** the line in the creator's voice; a sensible default when unset */
  question?: string;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* IntersectionObserver + CSS transitions, deliberately NOT a GSAP
     * ScrollTrigger reveal.
     *
     * The first attempt used gsap.from({autoAlpha: 0}) and the section never
     * appeared: the trigger was created (ScrollTrigger.getAll() found it),
     * refresh() and update() both ran, and the block stayed at opacity 0
     * forever. Switching to fromTo with immediateRender:false did not fix it
     * either — this page drives scrolling through Lenis, and the interaction
     * between the two is not something a decorative flourish should depend on.
     *
     * An entire section silently disappearing is far worse than one that
     * doesn't animate, so the reveal is now built so it CANNOT fail closed:
     * the markup is visible by default, the hidden state is applied by JS only
     * once we know we can undo it, and a timer reveals everything regardless
     * if the observer never fires. */
    const parts = Array.from(el.querySelectorAll<HTMLElement>("[data-ask-line], [data-ask-portrait]"));
    if (!parts.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return; // leave it plainly visible

    const show = (e: HTMLElement) => {
      e.style.opacity = "";
      e.style.transform = "";
    };
    const revealAll = () => parts.forEach((e, i) => setTimeout(() => show(e), i * 90));

    for (const e of parts) {
      e.style.transition = "opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)";
      e.style.opacity = "0";
      e.style.transform = "translateY(22px)";
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((x) => x.isIntersecting)) {
          revealAll();
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);

    // the safety net: whatever happens, this content becomes visible
    const failsafe = setTimeout(revealAll, 2500);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
      parts.forEach(show);
    };
  }, []);

  const accentText = accent === "brand" ? "text-brand" : "text-gold";
  const accentBg = accent === "brand" ? "bg-brand" : "bg-gold";
  const accentOn = accent === "brand" ? "text-white" : "text-ink";
  const ringColor = accent === "brand" ? "border-brand/35" : "border-gold/35";

  return (
    <section ref={root} className="relative overflow-hidden bg-ink px-5 py-[13vh] sm:px-8">
      <div className="noise absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-9 text-center sm:gap-11">
        <div className="relative">
          <span
            aria-hidden="true"
            className={`absolute -inset-5 animate-[spin_46s_linear_infinite] rounded-full border-2 border-dashed motion-reduce:animate-none ${ringColor}`}
          />
          <div data-ask-portrait className="relative h-32 w-32 overflow-hidden rounded-full sm:h-40 sm:w-40">
            <SiteMedia src={portrait} alt={name} fill sizes="160px" className="object-cover" />
          </div>
        </div>

        <div>
          <p data-ask-line className={`font-script text-3xl sm:text-4xl ${accentText}`}>
            still deciding?
          </p>
          <h2
            data-ask-line
            className="mt-2 font-display text-3xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl"
          >
            Ask {firstName} anything.
          </h2>
          <p data-ask-line className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
            {question ??
              `Not a call centre — ${firstName} runs these batches personally and answers the messages. Fitness, food, what the rooms are actually like, whether it suits a first-timer. Ask before you book, not after.`}
          </p>
        </div>

        <div data-ask-line className="flex flex-col items-center gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-12 items-center gap-2 rounded-full px-8 py-3.5 text-sm font-extrabold transition-transform hover:scale-[1.03] active:scale-100 ${accentBg} ${accentOn}`}
          >
            Message {firstName} on WhatsApp →
          </a>
          {handle && <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-white/35">{handle}</p>}
        </div>
      </div>
    </section>
  );
}
