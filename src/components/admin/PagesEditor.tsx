"use client";

/* Pages tab — the master switchboard. Every band on /trips and /destinations
   can be switched on/off here (state in catalog.pageSections; unset = the
   registry default, so new sections ship on). Below it: the live-booking
   wire entries the Wire band cycles through. */

import { useState } from "react";
import { useAdmin, Btn, Head, Field, label } from "./ui";
import { PAGE_SECTION_DEFS, resolvePageSection, type WireEntry } from "@/lib/types";

const PAGE_LABELS: Record<string, string> = {
  trips: "/trips — all departures",
  destinations: "/destinations — where the batches go",
};

export default function PagesEditor() {
  const { data, save } = useAdmin();

  const [sections, setSections] = useState<Record<string, Record<string, boolean>>>(() => {
    const out: Record<string, Record<string, boolean>> = {};
    for (const def of PAGE_SECTION_DEFS) {
      out[def.page] ??= {};
      out[def.page][def.key] = resolvePageSection(data.catalog.pageSections, def.page, def.key);
    }
    return out;
  });

  const [wire, setWire] = useState<WireEntry[]>(data.catalog.wire ?? []);

  const pages = [...new Set(PAGE_SECTION_DEFS.map((d) => d.page))];

  return (
    <>
      <Head title="Pages" sub="Switch any section on or off — the page reflows instantly on save. No deploys.">
        <Btn onClick={async () => { await save("pageSections", sections); await save("wire", wire.filter((w) => w.name.trim())); }}>
          Save pages
        </Btn>
      </Head>

      <div className="max-w-4xl space-y-8">
        {pages.map((page) => (
          <section key={page}>
            <p className={label}>{PAGE_LABELS[page] ?? page}</p>
            <div className="mt-3 divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.03]">
              {PAGE_SECTION_DEFS.filter((d) => d.page === page).map((def) => (
                <label key={def.key} className="flex cursor-pointer items-center gap-4 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={sections[page]?.[def.key] ?? def.default}
                    onChange={(e) =>
                      setSections((s) => ({ ...s, [page]: { ...s[page], [def.key]: e.target.checked } }))
                    }
                    className="h-4 w-4 shrink-0 accent-gold"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">{def.label}</span>
                    {def.hint && <span className="block text-xs text-white/40">{def.hint}</span>}
                  </span>
                  <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-wider ${
                    (sections[page]?.[def.key] ?? def.default) ? "bg-success/15 text-success" : "bg-white/10 text-white/40"
                  }`}>
                    {(sections[page]?.[def.key] ?? def.default) ? "on" : "off"}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}

        {/* wire entries */}
        <section>
          <div className="flex items-center justify-between">
            <p className={label}>Live booking wire — entries (cycled on /trips)</p>
            <Btn tone="ghost" onClick={() => setWire((w) => [...w, { name: "", city: "", act: "just booked", trip: "" }])}>+ Add entry</Btn>
          </div>
          <div className="mt-3 space-y-2.5">
            {wire.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/40">
                Empty — the site shows a sensible seeded set. Add entries to take control.
              </p>
            )}
            {wire.map((w, i) => (
              <div key={i} className="grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto]">
                <Field l="name" v={w.name} on={(v) => setWire((x) => x.map((y, j) => (j === i ? { ...y, name: v } : y)))} />
                <Field l="city" v={w.city} on={(v) => setWire((x) => x.map((y, j) => (j === i ? { ...y, city: v } : y)))} />
                <Field l="action (e.g. just booked)" v={w.act} on={(v) => setWire((x) => x.map((y, j) => (j === i ? { ...y, act: v } : y)))} />
                <Field l="trip (e.g. Spiti · 19 Jul)" v={w.trip} on={(v) => setWire((x) => x.map((y, j) => (j === i ? { ...y, trip: v } : y)))} />
                <div className="flex items-end"><Btn tone="danger" onClick={() => setWire((x) => x.filter((_, j) => j !== i))}>✕</Btn></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
