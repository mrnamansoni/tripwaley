"use client";

/* CAPTAINS — the people who run a batch.
 *
 * These used to be a hardcoded array with only their photos editable through a
 * media slot, so adding a captain or correcting a trip count needed a deploy.
 * Now they are rows: the band on /about and /vibe-check renders every published
 * one, and the first published captain fronts the feed on every trip page.
 */

import { useState } from "react";
import { useAdmin, Field, Area, Btn, Head, input, label } from "./ui";
import MediaPicker from "./MediaPicker";
import { DEFAULT_CAPTAINS } from "@/lib/types";
import type { Captain } from "@/lib/types";

const blank = (n: number): Captain => ({
  slug: `captain-${n}`,
  name: "New Captain",
  beat: "",
  line: "",
  trips: 0,
  photo: "/images/tw-captain-1.jpg",
  published: false,
});

export default function CaptainsEditor() {
  const { data, save } = useAdmin();
  const [rows, setRows] = useState<Captain[]>(
    () => data.catalog.captains ?? DEFAULT_CAPTAINS
  );

  const upd = (i: number, patch: Partial<Captain>) =>
    setRows((all) => all.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((all) => {
      const j = i + dir;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const livePos = (i: number) => rows.slice(0, i).filter((c) => c.published).length;

  return (
    <>
      <Head
        title="Captains"
        sub="Shown on /about and /vibe-check. The first published captain also fronts the feed on every trip page — use the arrows to choose who that is."
      >
        <Btn tone="ghost" onClick={() => setRows((all) => [...all, blank(all.length + 1)])}>
          + New captain
        </Btn>
        <Btn onClick={() => save("captains", rows)}>Save all</Btn>
      </Head>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
          No captains yet — the band is hidden until you add one.
        </p>
      )}

      <div className="space-y-4">
        {rows.map((c, i) => {
          const frontsTripPages = c.published && livePos(i) === 0;
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
                <div>
                  <MediaPicker
                    label="photo"
                    value={c.photo}
                    onChange={(v) => upd(i, { photo: v })}
                    aspect="aspect-[4/3]"
                    allowVideo={false}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field l="first name (shown as 'Captain …')" v={c.name} on={(v) => upd(i, { name: v })} />
                  <Field l="beat, e.g. High Himalaya" v={c.beat} on={(v) => upd(i, { beat: v })} />
                  <Field l="trips led" v={c.trips} type="number" on={(v) => upd(i, { trips: Number(v) || 0 })} />
                  <label className={label}>
                    status
                    <select
                      value={c.published ? "live" : "hidden"}
                      onChange={(e) => upd(i, { published: e.target.value === "live" })}
                      className={input}
                    >
                      <option value="live">live — on the site</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <Area l="one line of character" v={c.line} on={(v) => upd(i, { line: v })} rows={2} />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                <p className="text-[0.72rem] text-white/45">
                  {frontsTripPages ? (
                    <span className="font-bold text-gold">★ fronts the feed on every trip page</span>
                  ) : c.published ? (
                    "shown in the captains band"
                  ) : (
                    "hidden everywhere"
                  )}
                </p>
                <div className="flex gap-2">
                  <Btn tone="ghost" onClick={() => move(i, -1)}>↑</Btn>
                  <Btn tone="ghost" onClick={() => move(i, 1)}>↓</Btn>
                  <Btn
                    tone="ghost"
                    onClick={() => {
                      if (!confirm(`Delete Captain ${c.name}?`)) return;
                      setRows((all) => all.filter((_, j) => j !== i));
                    }}
                  >
                    Delete
                  </Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
