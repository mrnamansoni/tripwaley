"use client";

/* Global FAQ editor — drives the About page accordion and any FAQ block.
   Stored as catalog.faqs; empty falls back to sensible defaults in catalog.ts. */

import { useState } from "react";
import { useAdmin, Btn, Head, Field, Area } from "./ui";
import type { Faq } from "@/lib/types";

const DEFAULT_SEED: Faq[] = [
  { q: "Are these trips solo-friendly?", a: "Completely. Most travellers join solo and end up in a tight batch by day two." },
  { q: "What does the price include?", a: "Stays, most meals, transport from the boarding city, permits and your trip captain." },
];

export default function FaqEditor() {
  const { data, save } = useAdmin();
  const [faqs, setFaqs] = useState<Faq[]>(data.catalog.faqs?.length ? data.catalog.faqs : DEFAULT_SEED);
  const upd = (i: number, patch: Partial<Faq>) => setFaqs((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setFaqs((f) => {
      const j = i + dir;
      if (j < 0 || j >= f.length) return f;
      const copy = [...f];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <>
      <Head title="FAQ" sub="Questions & answers shown on the About page and FAQ blocks.">
        <Btn tone="ghost" onClick={() => setFaqs((f) => [...f, { q: "", a: "" }])}>+ Add question</Btn>
        <Btn onClick={() => save("faqs", faqs.filter((f) => f.q.trim() && f.a.trim()))}>Save FAQ</Btn>
      </Head>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl border border-white/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/40">Q{i + 1}</span>
              <div className="flex gap-1.5">
                <Btn tone="ghost" onClick={() => move(i, -1)}>↑</Btn>
                <Btn tone="ghost" onClick={() => move(i, 1)}>↓</Btn>
                <Btn tone="danger" onClick={() => setFaqs((x) => x.filter((_, j) => j !== i))}>remove</Btn>
              </div>
            </div>
            <Field l="question" v={f.q} on={(v) => upd(i, { q: v })} />
            <div className="mt-2"><Area l="answer" v={f.a} on={(v) => upd(i, { a: v })} rows={3} /></div>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-sm text-white/40">No questions yet — add one.</p>}
      </div>
    </>
  );
}
