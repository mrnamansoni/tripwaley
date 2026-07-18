"use client";

/* Admin primitives + the data hook every editor shares. */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Booking, Catalog, Review } from "@/lib/types";
import type { MediaItem } from "@/lib/store";

export interface AdminData {
  catalog: Catalog;
  reviews: Review[];
  bookings: Booking[];
  media: MediaItem[];
  slots: Record<string, string[]>;
}

interface AdminCtx {
  data: AdminData;
  setData: React.Dispatch<React.SetStateAction<AdminData | null>>;
  save: (section: string, payload: unknown) => Promise<boolean>;
  reload: () => Promise<void>;
  toast: string;
}

const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => useContext(Ctx)!;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [toast, setToast] = useState("");
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/catalog");
    if (!res.ok) { setFailed(true); return; }
    setData(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(reload, 0);
    return () => clearTimeout(t);
  }, [reload]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const save = useCallback(async (section: string, payload: unknown) => {
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section, data: payload }),
    });
    if (res.ok) {
      flash(`✓ ${section} saved — site updated`);
      await reload();
      return true;
    }
    const j = await res.json().catch(() => ({}));
    flash(`✕ ${j.error ?? "save failed"}`);
    return false;
  }, [reload]);

  if (failed) return <p className="p-10 text-white/60">Couldn&apos;t load admin data — refresh or re-login.</p>;
  if (!data) return <p className="animate-pulse p-10 text-white/40">Loading the cockpit…</p>;

  return (
    <Ctx.Provider value={{ data, setData, save, reload, toast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-white/15 bg-ink px-6 py-3 text-sm font-bold text-white shadow-card-lg">
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------- form primitives */

export const label = "block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-white/45";
export const input =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-gold";

export function Field({ l, v, on, type = "text" }: { l: string; v: string | number; on: (s: string) => void; type?: string }) {
  return (
    <label className={label}>
      {l}
      <input type={type} value={v} onChange={(e) => on(e.target.value)} className={input} />
    </label>
  );
}

export function Area({ l, v, on, rows = 3 }: { l: string; v: string; on: (s: string) => void; rows?: number }) {
  return (
    <label className={label}>
      {l}
      <textarea value={v} onChange={(e) => on(e.target.value)} rows={rows} className={input} />
    </label>
  );
}

export function Btn({ children, onClick, tone = "gold", disabled }: { children: React.ReactNode; onClick?: () => void; tone?: "gold" | "ghost" | "danger"; disabled?: boolean }) {
  const cls =
    tone === "gold"
      ? "bg-gold text-ink hover:scale-[1.02]"
      : tone === "danger"
        ? "border border-brand/60 text-brand-bright hover:bg-brand/15"
        : "border border-white/20 text-white/75 hover:border-gold hover:text-gold";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

export function Head({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-white">{title}</h2>
        {sub && <p className="mt-1 text-xs text-white/45">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

/** newline-joined textarea ⇄ string[] */
export const linesToArr = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
export const arrToLines = (a: string[]) => a.join("\n");
