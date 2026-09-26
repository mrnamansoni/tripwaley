"use client";

/* Questions and answers on a story. These are output as FAQPage schema, which
   is what makes a story eligible for the expandable answers Google shows
   under a result — the cheapest visibility a page of writing can buy. */

import type { StoryFaq } from "@/lib/types";
import { Btn, Field, Area, label } from "./ui";

export default function StoryFaqs({
  faqs,
  onChange,
}: {
  faqs: StoryFaq[];
  onChange: (faqs: StoryFaq[]) => void;
}) {
  const set = (i: number, patch: Partial<StoryFaq>) =>
    onChange(faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="sm:col-span-2">
      <p className={label}>questions people ask</p>
      <div className="mt-2 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl border border-white/10 p-3">
            <Field l={`question ${i + 1}`} v={f.q} on={(v) => set(i, { q: v })} />
            <div className="mt-2"><Area l="answer" v={f.a} on={(v) => set(i, { a: v })} rows={3} /></div>
            <div className="mt-2 flex justify-end">
              <Btn tone="danger" onClick={() => onChange(faqs.filter((_, j) => j !== i))}>Remove</Btn>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-[0.72rem] text-white/40">None yet. Three to five real questions is the sweet spot.</p>
        )}
        <Btn tone="ghost" onClick={() => onChange([...faqs, { q: "", a: "" }])}>+ Add a question</Btn>
      </div>
    </div>
  );
}
