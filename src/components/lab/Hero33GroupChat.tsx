"use client";

/* HERO 33 — "The Group Chat"
   The truest Tripwaley hero: every legendary trip starts as a group chat.
   A live WhatsApp-style thread replays itself — typing dots, photo drops,
   voice notes, the 2 AM "I'M IN" — on loop, forever recruiting. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

interface Msg {
  from: string;
  hue: number;
  text?: string;
  img?: string;
  voice?: boolean;
  me?: boolean;
  time: string;
}

const THREAD: Msg[] = [
  { from: "Aisha", hue: 330, text: "guys. GUYS. tripwaley has a ladakh batch on the 12th 👀", time: "1:47 am" },
  { from: "Rohan", hue: 210, text: "bro it's 2am", time: "1:48 am" },
  { from: "Aisha", hue: 330, img: "/images/ladakh.jpg", time: "1:48 am" },
  { from: "Rohan", hue: 210, text: "...ok I'm awake", time: "1:49 am" },
  { from: "Dev", hue: 150, voice: true, time: "1:52 am" },
  { from: "Dev", hue: 150, text: "that was me screaming. I'M IN 🏔️", time: "1:52 am" },
  { from: "You", hue: 20, text: "seat held. 3 left. MOVE.", me: true, time: "1:54 am" },
];

const STEP_MS = 1650;

export default function Hero33GroupChat() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  /* replay the thread on loop */
  useEffect(() => {
    const iv = setInterval(() => {
      setCount((v) => (v >= THREAD.length ? 0 : v + 1));
    }, STEP_MS);
    return () => clearInterval(iv);
  }, []);

  /* new bubble pops in; keep the thread scrolled to the latest */
  useEffect(() => {
    if (!listRef.current || count === 0) return;
    const bubbles = listRef.current.querySelectorAll("[data-gc-bubble]");
    const last = bubbles[bubbles.length - 1];
    if (last) gsap.fromTo(last, { scale: 0.7, autoAlpha: 0, y: 14 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" });
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [count]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gc-in]",
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: ref.current, start: "top 60%" } }
      );
      gsap.fromTo(
        "[data-gc-phone]",
        { autoAlpha: 0, y: 80, rotate: 4 },
        { autoAlpha: 1, y: 0, rotate: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 58%" } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden bg-blush">
      {/* giant ghost quotes */}
      <p aria-hidden="true" className="absolute -left-6 top-10 font-script text-[11rem] text-brand/8 sm:text-[16rem]">
        &ldquo;
      </p>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
        <div>
          <p data-gc-in className="font-script text-2xl text-brand sm:text-3xl">tale as old as time</p>
          <h1 data-gc-in className="mt-3 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Every legendary trip
            <br />
            starts as a
            <br />
            <span className="text-brand">group chat.</span>
          </h1>
          <p data-gc-in className="mt-6 max-w-md text-base leading-relaxed text-ink/65">
            We just make sure this one actually leaves the chat. Fixed dates,
            held seats, a captain added to the group — done before the hype dies.
          </p>
          <div data-gc-in className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#" className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-success px-7 py-3.5 font-bold text-white shadow-card-lg transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Z" /></svg>
              Join yours — WhatsApp us
            </a>
            <span className="text-sm font-semibold text-ink/50">replies in ~4 min</span>
          </div>
        </div>

        {/* the phone */}
        <div data-gc-phone className="mx-auto w-full max-w-sm">
          <div className="rounded-[2.4rem] border border-line bg-ink p-2.5 shadow-card-lg">
            <div className="overflow-hidden rounded-[1.9rem] bg-[#ece5dd]">
              {/* chat header */}
              <div className="flex items-center gap-3 bg-ink px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-script text-lg text-white">t</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">Ladakh 12 Jul · Tripwaley ✈️</p>
                  <p className="text-[0.65rem] text-white/60">Aisha, Rohan, Dev, You, +11 · Captain Tenzin</p>
                </div>
              </div>
              {/* messages */}
              <div ref={listRef} className="flex h-[21rem] flex-col gap-2 overflow-hidden px-3 py-4">
                {THREAD.slice(0, count).map((m, i) => (
                  <div key={i} data-gc-bubble className={`max-w-[80%] ${m.me ? "self-end" : "self-start"}`}>
                    <div className={`rounded-2xl px-3 py-2 shadow-sm ${m.me ? "rounded-br-md bg-[#d7f3c8]" : "rounded-bl-md bg-white"}`}>
                      {!m.me && (
                        <p className="text-[0.66rem] font-bold" style={{ color: `hsl(${m.hue} 65% 42%)` }}>{m.from}</p>
                      )}
                      {m.text && <p className="text-[0.82rem] leading-snug text-ink">{m.text}</p>}
                      {m.img && (
                        <div className="relative mt-1 h-28 w-48 overflow-hidden rounded-lg">
                          <Image src={m.img} alt="Ladakh road" fill sizes="200px" className="object-cover" />
                        </div>
                      )}
                      {m.voice && (
                        <div className="flex items-center gap-2 py-1">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white" aria-hidden="true">▶</span>
                          <span className="flex items-end gap-[2px]" aria-label="voice note">
                            {[3, 8, 5, 11, 7, 12, 5, 9, 4, 10, 6].map((h, j) => (
                              <span key={j} className="w-[3px] rounded bg-ink/40" style={{ height: h }} />
                            ))}
                          </span>
                          <span className="text-[0.62rem] text-ink/45">0:11</span>
                        </div>
                      )}
                      <p className="mt-0.5 text-right text-[0.58rem] text-ink/40">{m.time}</p>
                    </div>
                  </div>
                ))}
                {/* typing indicator while thread is mid-replay */}
                {count < THREAD.length && (
                  <div className="self-start rounded-2xl rounded-bl-md bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex gap-1" aria-label="typing">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                )}
              </div>
              {/* composer */}
              <div className="flex items-center gap-2 border-t border-ink/10 bg-[#f6f2ec] px-3 py-2.5">
                <p className="flex-1 rounded-full bg-white px-4 py-2 text-[0.75rem] text-ink/40">Type “I&apos;m in”…</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white" aria-hidden="true">➤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
