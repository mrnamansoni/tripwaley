"use client";

/* Media manager — the photo/video switchboard for the whole site.

   1. SLOTS — every fixed piece of media on the site, grouped by where it
      appears (hero background, film frames, captains, the trip-type pages…).
      Each position can be filled from the library, a fresh upload, or a
      pasted link — and any of them may be a video instead of a photo.
   2. LIBRARY — every file on the server. Upload new ones, or Replace-in-place
      to swap a file everywhere it's used at once (incl. package galleries). */

import { useMemo, useRef, useState } from "react";
import { useAdmin, Btn, Head, label } from "./ui";
import MediaPicker, { Thumb } from "./MediaPicker";
import { SLOT_DEFS } from "@/lib/types";

const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";

export default function MediaManager() {
  const { data, save, reload } = useAdmin();
  const slots = useMemo(() => data.slots ?? {}, [data.slots]);

  // working copy of slot assignments
  const [draft, setDraft] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(SLOT_DEFS.map((d) => [d.key, [...(slots[d.key] ?? d.defaults)]]))
  );
  const dirty = useMemo(
    () => SLOT_DEFS.some((d) => JSON.stringify(draft[d.key]) !== JSON.stringify(slots[d.key] ?? d.defaults)),
    [draft, slots]
  );

  // library upload / replace
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const replaceTarget = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const g: Record<string, typeof SLOT_DEFS> = {};
    for (const d of SLOT_DEFS) (g[d.group] ??= []).push(d);
    return g;
  }, []);

  const onLibPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const target = replaceTarget.current;
    replaceTarget.current = null;
    setBusyPath(target ?? "new");
    setNote("");
    const form = new FormData();
    form.append("file", f);
    if (target) form.append("replacePath", target);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const j = await res.json().catch(() => ({}));
    setBusyPath(null);
    if (!res.ok) { setNote(`✕ ${j.error ?? "upload failed"}`); return; }
    await reload();
    setNote(target ? `✓ replaced ${target} — live site-wide` : `✓ uploaded ${j.path}`);
  };

  /** set a position; clearing one inside a list removes it instead of
   *  leaving an empty string the site would try to render */
  const assign = (key: string, index: number, ref: string, isList: boolean) =>
    setDraft((d) => {
      const arr = [...(d[key] ?? [])];
      if (!ref && isList) arr.splice(index, 1);
      else arr[index] = ref;
      return { ...d, [key]: arr };
    });
  const addSlot = (key: string) => setDraft((d) => ({ ...d, [key]: [...(d[key] ?? []), ""] }));
  const move = (key: string, i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const arr = [...(d[key] ?? [])];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, [key]: arr };
    });

  return (
    <>
      <Head title="Media" sub="Top: every photo/video and where it appears. Bottom: the file library. Anything here can be an upload or a pasted link.">
        {dirty && <Btn onClick={() => save("media", draft)}>Save placements</Btn>}
        <Btn tone="ghost" onClick={() => { replaceTarget.current = null; fileRef.current?.click(); }}>+ Upload file</Btn>
      </Head>
      <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} className="hidden" onChange={onLibPick} />
      {note && <p className="mb-4 text-sm font-bold text-gold">{note}</p>}

      <div className="mb-6 rounded-2xl border border-gold/25 bg-gold/[0.06] p-4 text-sm text-white/60">
        Every position below accepts a <strong className="text-white/85">photo or a video</strong>. Use
        <strong className="text-white/85"> Upload file</strong> to store it on the server, or
        <strong className="text-white/85"> paste a link</strong> (Google Drive, Dropbox, any URL).
        Photos up to 6 MB, video up to 25 MB — keep background videos short and muted.
      </div>

      {/* ---------- SLOTS: what appears where ---------- */}
      {Object.entries(groups).map(([group, defs]) => (
        <section key={group} className="mb-8">
          <p className={label}>{group}</p>
          <div className="mt-3 space-y-4">
            {defs.map((def) => {
              const refs = draft[def.key] ?? [];
              const isList = def.kind === "list";
              return (
                <div key={def.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-extrabold text-white">{def.label}</p>
                      {def.hint && <p className="text-xs text-white/40">{def.hint}</p>}
                    </div>
                    {isList && (!def.max || refs.length < def.max) && (
                      <Btn tone="ghost" onClick={() => addSlot(def.key)}>+ Add</Btn>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {refs.map((src, i) => (
                      <div key={`${def.key}-${i}`} className="w-44">
                        <MediaPicker
                          value={src}
                          onChange={(ref) => assign(def.key, i, ref, isList)}
                          label={isList ? `#${i + 1}` : undefined}
                        />
                        {isList && refs.length > 1 && (
                          <div className="mt-1.5 flex gap-1.5">
                            <button type="button" onClick={() => move(def.key, i, -1)} className="rounded border border-white/20 px-2 py-0.5 text-[0.6rem] font-bold text-white/60 hover:border-gold hover:text-gold">←</button>
                            <button type="button" onClick={() => move(def.key, i, 1)} className="rounded border border-white/20 px-2 py-0.5 text-[0.6rem] font-bold text-white/60 hover:border-gold hover:text-gold">→</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {refs.length === 0 && <p className="text-xs text-white/40">Nothing set — click + Add.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
        <strong className="text-white/75">Package photos</strong> (gallery, hero, per-day) are edited on each
        package in the <span className="text-gold">Packages</span> tab.
      </div>

      {/* ---------- LIBRARY ---------- */}
      <p className={label}>File library — {data.media.length} files</p>
      <p className="mb-3 mt-1 text-xs text-white/40">
        Replace-in-place swaps a file everywhere it&apos;s used at once, keeping the same file type.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.media.map((m) => (
          <figure key={m.path} className="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <div className="relative aspect-[4/3]">
              <Thumb src={m.path} cacheKey={m.bytes} />
              {busyPath === m.path && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-gold">replacing…</span>}
            </div>
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate font-mono text-[0.62rem] text-white/70">{m.path}</span>
                <span className="text-[0.55rem] uppercase tracking-wider text-white/35">
                  {(m.bytes / 1024).toFixed(0)} KB · {m.dir} · {m.kind}
                </span>
              </span>
              <button
                type="button"
                onClick={() => { replaceTarget.current = m.path; fileRef.current?.click(); }}
                className="shrink-0 rounded-lg border border-gold/50 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-ink"
              >
                Replace
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
