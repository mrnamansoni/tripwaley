"use client";

/* Reusable photo field — shows the current image with a "Change" button that
   opens a modal to pick from the library or upload a new file. Used anywhere a
   single editable photo is needed (blog cover, popup image, itinerary day,
   OG image, etc.). Backs onto the same media library + upload API as the
   Media tab. */

import Image from "next/image";
import { useRef, useState } from "react";
import { useAdmin, Btn } from "./ui";

export default function ImagePicker({
  value,
  onChange,
  label,
  aspect = "aspect-[4/3]",
}: {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  aspect?: string;
}) {
  const { data, reload } = useAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File): Promise<string | null> => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { await reload(); return j.path as string; }
    return null;
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const path = await upload(f);
    if (path) { onChange(path); setOpen(false); }
  };

  return (
    <div>
      {label && <p className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">{label}</p>}
      <div className="flex items-center gap-3">
        <div className={`relative ${aspect} w-28 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30`}>
          {value ? (
            <Image src={`${value}?v=pick`} alt="" fill sizes="112px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center text-[0.6rem] text-white/30">no image</span>
          )}
        </div>
        <Btn tone="ghost" onClick={() => setOpen(true)}>Change photo</Btn>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-white/12 bg-[#181614] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-extrabold text-white">Choose a photo</h3>
              <div className="flex gap-2">
                <Btn tone="ghost" onClick={() => fileRef.current?.click()}>{busy ? "uploading…" : "+ Upload new"}</Btn>
                <Btn tone="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
              {data.media.map((m) => (
                <button
                  key={m.path}
                  type="button"
                  onClick={() => { onChange(m.path); setOpen(false); }}
                  className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all hover:border-gold ${value === m.path ? "border-gold" : "border-transparent"}`}
                >
                  <Image src={`${m.path}?v=${m.bytes}`} alt="" fill sizes="160px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
