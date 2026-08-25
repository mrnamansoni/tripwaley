"use client";

/* COLLEGES — the proof wall on /college-trips.
 *
 * Each row is a batch we already ran, not something bookable: the bookable
 * college packages are ordinary trips tagged with the "college" category in
 * the Packages tab. That split is deliberate — a coordinator wants evidence
 * first and a price second, and the two lists change at different rates.
 */

import { useState } from "react";
import { useAdmin, Field, Area, Btn, Head, input, label, linesToArr, arrToLines } from "./ui";
import MediaPicker from "./MediaPicker";
import type { CollegeTrip } from "@/lib/types";

const blank = (n: number): CollegeTrip => ({
  slug: `college-${n}`,
  college: "New college",
  city: "",
  destination: "",
  nights: 5,
  students: 40,
  pricePerStudent: undefined,
  year: String(new Date().getFullYear()),
  cover: "/images/group-mountains.jpg",
  gallery: [],
  quote: "",
  quoteBy: "",
  published: false,
});

export default function CollegesEditor() {
  const { data, save } = useAdmin();
  const [rows, setRows] = useState<CollegeTrip[]>(() =>
    (data.catalog.colleges ?? []).map((c) => ({ ...c, gallery: c.gallery ?? [] }))
  );
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const row = rows.find((r) => r.slug === openSlug) ?? null;
  const upd = (patch: Partial<CollegeTrip>) =>
    setRows((all) => all.map((r) => (r.slug === openSlug ? { ...r, ...patch } : r)));

  /* ---------------------------------------------- list ---------------- */
  if (!row) {
    return (
      <>
        <Head
          title="College trips"
          sub="The batches already run — this is the wall of proof on /college-trips. Bookable college packages live in Packages, tagged with the College category."
        >
          <Btn
            tone="ghost"
            onClick={() => {
              const c = blank(rows.length + 1);
              setRows((all) => [c, ...all]);
              setOpenSlug(c.slug);
            }}
          >
            + New college batch
          </Btn>
          <Btn onClick={() => save("colleges", rows)}>Save all</Btn>
        </Head>

        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
            No college batches yet — add one so the page has proof to show.
          </p>
        )}

        <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
          {rows.map((r) => (
            <div key={r.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpenSlug(r.slug)}
                className="min-w-44 flex-1 truncate text-left font-bold text-white hover:text-gold"
              >
                {r.college}
                <span className="ml-2 font-mono text-[0.6rem] text-white/35">{r.destination}</span>
              </button>
              <span className="hidden text-xs text-white/40 sm:block">
                {r.students} students · {r.nights}D · {r.year}
              </span>
              <button
                type="button"
                onClick={() =>
                  setRows((all) => all.map((x) => (x.slug === r.slug ? { ...x, published: !x.published } : x)))
                }
                className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
                  r.published ? "bg-success/20 text-success" : "bg-white/10 text-white/45"
                }`}
              >
                {r.published ? "live" : "hidden"}
              </button>
              <Btn tone="ghost" onClick={() => setOpenSlug(r.slug)}>
                edit →
              </Btn>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ---------------------------------------------- one batch ----------- */
  return (
    <>
      <Head title={row.college} sub={`${row.destination || "—"} · shown on /college-trips`}>
        <Btn tone="ghost" onClick={() => setOpenSlug(null)}>
          ← All colleges
        </Btn>
        <Btn
          tone="ghost"
          onClick={() => {
            if (!confirm(`Delete the ${row.college} batch? This cannot be undone.`)) return;
            setRows((all) => all.filter((r) => r.slug !== row.slug));
            setOpenSlug(null);
          }}
        >
          Delete
        </Btn>
        <Btn onClick={() => save("colleges", rows)}>Save all</Btn>
      </Head>

      <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
        <Field l="college / university" v={row.college} on={(v) => upd({ college: v })} />
        <Field l="campus city" v={row.city} on={(v) => upd({ city: v })} />
        <Field l="destination" v={row.destination} on={(v) => upd({ destination: v })} />
        <Field l="year label (e.g. 2025)" v={row.year} on={(v) => upd({ year: v })} />
        <Field l="students who travelled" v={row.students} type="number" on={(v) => upd({ students: Number(v) || 0 })} />
        <Field l="days on the road" v={row.nights} type="number" on={(v) => upd({ nights: Number(v) || 0 })} />
        <Field
          l="₹ per student (blank = hidden)"
          v={row.pricePerStudent ?? ""}
          type="number"
          on={(v) => upd({ pricePerStudent: v ? Number(v) : undefined })}
        />
        <label className={label}>
          status
          <select
            value={row.published ? "live" : "hidden"}
            onChange={(e) => upd({ published: e.target.value === "live" })}
            className={input}
          >
            <option value="live">live — on the site</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
      </div>

      <div className="mt-6 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <MediaPicker
          label="cover photo / video"
          value={row.cover}
          onChange={(v) => upd({ cover: v })}
          aspect="aspect-[4/3]"
        />
      </div>

      <div className="mt-6 max-w-5xl">
        <p className={label}>what the trip lead said afterwards</p>
        <div className="mt-2 grid gap-4">
          <Area l="quote" v={row.quote ?? ""} on={(v) => upd({ quote: v })} rows={3} />
          <Field l="attributed to (e.g. Faculty Coordinator)" v={row.quoteBy ?? ""} on={(v) => upd({ quoteBy: v })} />
        </div>
      </div>

      <div className="mt-6 max-w-5xl">
        <Area
          l="extra gallery photos — one media path or link per line"
          v={arrToLines(row.gallery)}
          on={(v) => upd({ gallery: linesToArr(v) })}
          rows={4}
        />
        <p className="mt-1 text-[0.68rem] text-white/35">
          Use the Media tab to upload, then paste the path here — or paste an external link.
        </p>
      </div>
    </>
  );
}
