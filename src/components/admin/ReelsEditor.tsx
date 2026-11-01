"use client";

/* REELS — short vertical videos for the homepage reel stage.
 *
 * Order matters: the first live reel is the one that plays first, and the
 * stage advances down the list. Upload vertical (9:16) clips — the stage crops
 * to a phone-shaped frame, so a landscape clip loses its sides. Keep each one
 * short and light (under ~15 MB); only the reel in the middle ever plays.
 */

import { useState } from "react";
import { useAdmin, Field, Btn, Head, input, label } from "./ui";
import MediaPicker from "./MediaPicker";
import { isVideoMedia } from "@/lib/types";
import type { Reel } from "@/lib/types";

const blank = (): Reel => ({
  id: `reel-${Date.now().toString(36)}`,
  video: "",
  title: "",
  published: false,
});

export default function ReelsEditor() {
  const { data, save } = useAdmin();
  const [rows, setRows] = useState<Reel[]>(() => data.catalog.reels ?? []);
  const packages = data.catalog.packages.filter((p) => p.status === "live");

  const upd = (i: number, patch: Partial<Reel>) =>
    setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((all) => {
      const j = i + dir;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const liveCount = rows.filter((r) => r.published && isVideoMedia(r.video)).length;

  return (
    <>
      <Head
        title="Reels"
        sub="The reel stage on the homepage. Upload vertical (9:16) clips under ~15 MB. The first live reel plays first; the stage is hidden until at least one reel is live."
      >
        <Btn tone="ghost" onClick={() => setRows((all) => [...all, blank()])}>
          + New reel
        </Btn>
        <Btn onClick={() => save("reels", rows)}>Save all</Btn>
      </Head>

      <p className="mb-4 text-sm text-white/55">
        {liveCount ? `${liveCount} live on the homepage.` : "Nothing live — the homepage hides the reel stage."}
      </p>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
          No reels yet. Add one, upload the clip, set it live and save.
        </p>
      )}

      <div className="space-y-4">
        {rows.map((r, i) => {
          const notVideo = !!r.video && !isVideoMedia(r.video);
          return (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-4 lg:grid-cols-[9rem_9rem_1fr]">
                <div>
                  <MediaPicker label="video (9:16)" value={r.video} onChange={(v) => upd(i, { video: v })} aspect="aspect-[9/16]" />
                  {notVideo && <p className="mt-1.5 text-[0.7rem] font-bold text-brand">That&apos;s a photo — pick a video.</p>}
                </div>
                <div>
                  <MediaPicker
                    label="cover photo (optional)"
                    value={r.poster ?? ""}
                    onChange={(v) => upd(i, { poster: v || undefined })}
                    aspect="aspect-[9/16]"
                    allowVideo={false}
                  />
                </div>

                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field l="caption — one short line" v={r.title} on={(v) => upd(i, { title: v })} />
                  </div>
                  <Field l="place, e.g. Chandratal, Spiti" v={r.place ?? ""} on={(v) => upd(i, { place: v || undefined })} />
                  <Field l="credit, e.g. @handle or Captain Aman" v={r.credit ?? ""} on={(v) => upd(i, { credit: v || undefined })} />
                  <label className={label}>
                    &ldquo;see this trip&rdquo; link
                    <select value={r.packageSlug ?? ""} onChange={(e) => upd(i, { packageSlug: e.target.value || undefined })} className={input}>
                      <option value="">no link</option>
                      {packages.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={label}>
                    status
                    <select
                      value={r.published ? "live" : "hidden"}
                      onChange={(e) => upd(i, { published: e.target.value === "live" })}
                      className={input}
                    >
                      <option value="live">live — on the homepage</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-white/8 pt-3">
                <Btn tone="ghost" onClick={() => move(i, -1)}>↑</Btn>
                <Btn tone="ghost" onClick={() => move(i, 1)}>↓</Btn>
                <Btn
                  tone="ghost"
                  onClick={() => {
                    if (!confirm(`Delete this reel${r.title ? ` ("${r.title}")` : ""}? The video file stays in the Media library.`)) return;
                    setRows((all) => all.filter((_, j) => j !== i));
                  }}
                >
                  Delete
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
