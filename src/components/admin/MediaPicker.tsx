"use client";

/* Reusable photo/video field.
 *
 * Three ways to fill any media slot on the site, all in one control:
 *   1. pick from the library already on the server
 *   2. upload a new file (photo or video) — saved to the VPS
 *   3. paste a link (Google Drive, Dropbox, or any direct URL)
 *
 * Everything is stored as a plain string, so the site renders it through
 * <SiteMedia> without caring which of the three it came from.
 */

import { useRef, useState } from "react";
import { useAdmin, Btn } from "./ui";
import { isVideoMedia, isExternalMedia, normalizeMediaUrl, isValidMediaRef } from "@/lib/types";

/** local files get a cache-buster so a "replace" shows instantly in the panel;
 *  pasted URLs are left exactly as typed */
const bust = (src: string, v: string | number = "p") =>
  isExternalMedia(src) ? normalizeMediaUrl(src) : `${src}?v=${v}`;

export function Thumb({ src, cacheKey }: { src: string; cacheKey?: string | number }) {
  const url = bust(src, cacheKey);
  if (isVideoMedia(src)) {
    return (
      <>
        <video src={url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-white">
          ▶ video
        </span>
      </>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />;
}

export default function MediaPicker({
  value,
  onChange,
  label,
  aspect = "aspect-[4/3]",
  allowVideo = true,
}: {
  value: string;
  onChange: (ref: string) => void;
  label?: string;
  aspect?: string;
  allowVideo?: boolean;
}) {
  const { data, reload } = useAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const library = allowVideo ? data.media : data.media.filter((m) => m.kind !== "video");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setErr("");
    const form = new FormData();
    form.append("file", f);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "upload failed"); return; }
    await reload();
    onChange(j.path as string);
    setOpen(false);
  };

  const applyLink = () => {
    const v = link.trim();
    if (!isValidMediaRef(v)) { setErr("Paste a full link starting with http:// or https://"); return; }
    onChange(v);
    setLink("");
    setErr("");
    setOpen(false);
  };

  const accept = allowVideo
    ? "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp";

  return (
    <div>
      {label && <p className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">{label}</p>}
      <div className="flex items-center gap-3">
        <div className={`relative ${aspect} w-28 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30`}>
          {value ? <Thumb src={value} /> : <span className="flex h-full items-center justify-center text-[0.6rem] text-white/30">empty</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Btn tone="ghost" onClick={() => { setOpen(true); setErr(""); }}>
            {value ? "Change" : `Add ${allowVideo ? "photo / video" : "photo"}`}
          </Btn>
          {value && <button type="button" onClick={() => onChange("")} className="text-left text-[0.6rem] font-bold uppercase tracking-wider text-white/35 hover:text-brand-bright">clear</button>}
        </div>
      </div>
      {value && isExternalMedia(value) && (
        <p className="mt-1.5 truncate text-[0.6rem] text-white/35">🔗 {value}</p>
      )}

      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={onFile} />

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-3xl border border-white/12 bg-[#181614] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-extrabold text-white">
                Choose {allowVideo ? "a photo or video" : "a photo"}
              </h3>
              <div className="flex gap-2">
                <Btn tone="ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? "uploading…" : "⬆ Upload file"}
                </Btn>
                <Btn tone="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              </div>
            </div>

            {/* paste-a-link row */}
            <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">or paste a link</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={link}
                  onChange={(e) => { setLink(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyLink()}
                  placeholder="https://… (Google Drive, Dropbox, or any direct link)"
                  className="min-w-52 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-gold"
                />
                <Btn onClick={applyLink}>Use link</Btn>
              </div>
              <p className="mt-1.5 text-[0.6rem] text-white/30">
                Drive and Dropbox share links are converted to a direct link automatically.
              </p>
            </div>

            {err && <p className="mb-3 rounded-lg bg-brand/15 px-3 py-2 text-sm font-bold text-brand-bright">{err}</p>}

            <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45">
              already on the server ({library.length})
            </p>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
              {library.map((m) => (
                <button
                  key={m.path}
                  type="button"
                  onClick={() => { onChange(m.path); setOpen(false); }}
                  className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all hover:border-gold ${value === m.path ? "border-gold" : "border-transparent"}`}
                >
                  <Thumb src={m.path} cacheKey={m.bytes} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
