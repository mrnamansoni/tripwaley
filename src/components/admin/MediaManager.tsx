"use client";

/* Media manager — the photo switchboard for the whole site.

   1. IMAGE SLOTS — every fixed photo on the site, grouped by where it
      appears (hero film frames, blinds, captains, etc.). Replace any one
      by picking from the library or uploading; grow list slots (+ Add).
   2. LIBRARY — every photo file. Upload new ones, or Replace-in-place to
      swap a file everywhere it's used at once (incl. package galleries). */

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useAdmin, Btn, Head, label } from "./ui";
import { SLOT_DEFS } from "@/lib/types";

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

  // picker modal: choose an image for a slot position
  const [picker, setPicker] = useState<{ key: string; index: number } | null>(null);

  const groups = useMemo(() => {
    const g: Record<string, typeof SLOT_DEFS> = {};
    for (const d of SLOT_DEFS) (g[d.group] ??= []).push(d);
    return g;
  }, []);

  const sendFile = async (file: File, replacePath?: string): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    if (replacePath) form.append("replacePath", replacePath);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { await reload(); return j.path as string; }
    setNote(`✕ ${j.error ?? "upload failed"}`);
    return null;
  };

  const onLibPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const target = replaceTarget.current;
    replaceTarget.current = null;
    setBusyPath(target ?? "new");
    setNote("");
    const path = await sendFile(f, target ?? undefined);
    setBusyPath(null);
    if (path) setNote(target ? `✓ replaced ${target} — live site-wide` : `✓ uploaded ${path}`);
  };

  // upload directly into a slot position
  const slotUploadRef = useRef<HTMLInputElement>(null);
  const onSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !picker) return;
    const path = await sendFile(f);
    if (path) assign(picker.key, picker.index, path);
    setPicker(null);
  };

  const assign = (key: string, index: number, path: string) =>
    setDraft((d) => {
      const arr = [...(d[key] ?? [])];
      arr[index] = path;
      return { ...d, [key]: arr };
    });
  const addSlot = (key: string) =>
    setDraft((d) => ({ ...d, [key]: [...(d[key] ?? []), (data.media[0]?.path ?? "/images/group-mountains.jpg")] }));
  const removeSlot = (key: string, index: number) =>
    setDraft((d) => ({ ...d, [key]: (d[key] ?? []).filter((_, i) => i !== index) }));

  return (
    <>
      <Head title="Media" sub="Top: every photo & where it appears — replace or add. Bottom: the file library.">
        {dirty && <Btn onClick={() => save("media", draft)}>Save image placements</Btn>}
        <Btn tone="ghost" onClick={() => { replaceTarget.current = null; fileRef.current?.click(); }}>+ Upload photo</Btn>
      </Head>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onLibPick} />
      <input ref={slotUploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onSlotUpload} />
      {note && <p className="mb-4 text-sm font-bold text-gold">{note}</p>}

      {/* ---------- SLOTS: which image appears where ---------- */}
      {Object.entries(groups).map(([group, defs]) => (
        <section key={group} className="mb-8">
          <p className={label}>{group}</p>
          <div className="mt-3 space-y-4">
            {defs.map((def) => {
              const imgs = draft[def.key] ?? [];
              const isList = def.kind === "list";
              return (
                <div key={def.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-extrabold text-white">{def.label}</p>
                      {def.hint && <p className="text-xs text-white/40">{def.hint}</p>}
                    </div>
                    {isList && (!def.max || imgs.length < def.max) && (
                      <Btn tone="ghost" onClick={() => addSlot(def.key)}>+ Add image</Btn>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {imgs.map((src, i) => (
                      <div key={`${src}-${i}`} className="group relative">
                        <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-white/10">
                          <Image src={`${src}?v=slot`} alt="" fill sizes="128px" className="object-cover" unoptimized />
                          {isList && (
                            <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[0.6rem] font-extrabold text-gold">{i + 1}</span>
                          )}
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                          <button type="button" onClick={() => setPicker({ key: def.key, index: i })} className="flex-1 rounded border border-gold/50 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-gold hover:bg-gold hover:text-ink">
                            Replace
                          </button>
                          {isList && imgs.length > 1 && (
                            <button type="button" onClick={() => removeSlot(def.key, i)} className="rounded border border-brand/50 px-2 py-1 text-[0.6rem] font-bold text-brand-bright hover:bg-brand/15">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {imgs.length === 0 && <p className="text-xs text-white/40">No image set — click + Add image.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
        <strong className="text-white/75">Package photos</strong> are edited on each package in the{" "}
        <span className="text-gold">Packages</span> tab (scroll to its gallery picker).
      </div>

      {/* ---------- LIBRARY ---------- */}
      <p className={label}>Photo library — {data.media.length} files</p>
      <p className="mb-3 mt-1 text-xs text-white/40">Replace-in-place swaps a file everywhere it&apos;s used at once.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.media.map((m) => (
          <figure key={m.path} className="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <div className="relative aspect-[4/3]">
              <Image src={`${m.path}?v=${m.bytes}`} alt={m.path} fill sizes="300px" className="object-cover" unoptimized />
              {busyPath === m.path && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-gold">replacing…</span>}
            </div>
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate font-mono text-[0.62rem] text-white/70">{m.path}</span>
                <span className="text-[0.55rem] uppercase tracking-wider text-white/35">{(m.bytes / 1024).toFixed(0)} KB · {m.dir}</span>
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

      {/* ---------- PICKER MODAL ---------- */}
      {picker && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-white/12 bg-[#181614] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-extrabold text-white">Choose a photo</h3>
              <div className="flex gap-2">
                <Btn tone="ghost" onClick={() => slotUploadRef.current?.click()}>+ Upload new</Btn>
                <Btn tone="ghost" onClick={() => setPicker(null)}>Cancel</Btn>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
              {data.media.map((m) => (
                <button
                  key={m.path}
                  type="button"
                  onClick={() => { assign(picker.key, picker.index, m.path); setPicker(null); }}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-gold"
                >
                  <Image src={`${m.path}?v=${m.bytes}`} alt="" fill sizes="160px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
