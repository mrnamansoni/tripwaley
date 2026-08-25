"use client";

/* COUPONS — discount codes applied at booking.
 *
 * Every field here is a guard-rail the SERVER enforces at validation time
 * (/api/coupon), not a hint the browser is trusted to respect: a traveller
 * can type any code they like, but only this list decides what it is worth.
 * The live preview below runs the exact same applyCoupon() the server does,
 * so what the owner sees here is what a customer will get.
 */

import { useState } from "react";
import { useAdmin, Field, Btn, Head, input, label } from "./ui";
import { applyCoupon, inr, CATEGORY_DEFS, normalizeCouponCode } from "@/lib/types";
import type { Coupon, TripCategory } from "@/lib/types";

const blank = (): Coupon => ({
  code: "",
  kind: "percent",
  value: 10,
  active: true,
  usedCount: 0,
});

const PREVIEW_TOTAL = 20000;

export default function CouponsEditor() {
  const { data, save } = useAdmin();
  const [rows, setRows] = useState<Coupon[]>(() => data.catalog.coupons ?? []);
  const today = new Date().toISOString().slice(0, 10);

  const upd = (i: number, patch: Partial<Coupon>) =>
    setRows((all) => all.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const dupes = new Set(
    rows
      .map((c) => normalizeCouponCode(c.code))
      .filter((c, i, a) => c && a.indexOf(c) !== i)
  );

  return (
    <>
      <Head
        title="Coupons"
        sub="Discount codes travellers can apply at booking. Validated on the server — the price is never decided in the browser."
      >
        <Btn tone="ghost" onClick={() => setRows((all) => [blank(), ...all])}>
          + New coupon
        </Btn>
        <Btn onClick={() => save("coupons", rows)}>Save all</Btn>
      </Head>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
          No coupons yet. Add one and it works at checkout immediately after saving.
        </p>
      )}

      <div className="space-y-4">
        {rows.map((c, i) => {
          const preview = applyCoupon({ ...c, code: c.code || "PREVIEW" }, { total: PREVIEW_TOTAL, today });
          const isDupe = dupes.has(normalizeCouponCode(c.code));
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Field
                    l="code"
                    v={c.code}
                    on={(v) => upd(i, { code: v.toUpperCase().replace(/\s+/g, "") })}
                  />
                  {isDupe && <p className="mt-1 text-[0.68rem] font-bold text-brand-bright">duplicate code</p>}
                </div>

                <label className={label}>
                  type
                  <select
                    value={c.kind}
                    onChange={(e) => upd(i, { kind: e.target.value as Coupon["kind"] })}
                    className={input}
                  >
                    <option value="percent">% off</option>
                    <option value="flat">₹ off</option>
                  </select>
                </label>

                <Field
                  l={c.kind === "percent" ? "percent off (1-100)" : "₹ off"}
                  v={c.value}
                  type="number"
                  on={(v) => upd(i, { value: Number(v) || 0 })}
                />

                <label className={label}>
                  status
                  <select
                    value={c.active ? "on" : "off"}
                    onChange={(e) => upd(i, { active: e.target.value === "on" })}
                    className={input}
                  >
                    <option value="on">active</option>
                    <option value="off">paused</option>
                  </select>
                </label>

                {c.kind === "percent" && (
                  <Field
                    l="max ₹ discount (blank = uncapped)"
                    v={c.maxDiscount ?? ""}
                    type="number"
                    on={(v) => upd(i, { maxDiscount: v ? Number(v) : undefined })}
                  />
                )}
                <Field
                  l="min booking ₹ (blank = any)"
                  v={c.minAmount ?? ""}
                  type="number"
                  on={(v) => upd(i, { minAmount: v ? Number(v) : undefined })}
                />
                <Field
                  l="expires (yyyy-mm-dd)"
                  v={c.expiresAt ?? ""}
                  type="date"
                  on={(v) => upd(i, { expiresAt: v || undefined })}
                />
                <Field
                  l="total uses allowed (blank = ∞)"
                  v={c.usageLimit ?? ""}
                  type="number"
                  on={(v) => upd(i, { usageLimit: v ? Number(v) : undefined })}
                />
              </div>

              {/* eligibility */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/35">
                  applies to
                </span>
                {CATEGORY_DEFS.map((cat) => {
                  const on = (c.categories ?? []).includes(cat.key as TripCategory);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        const set = new Set(c.categories ?? []);
                        if (on) set.delete(cat.key as TripCategory);
                        else set.add(cat.key as TripCategory);
                        const next = [...set];
                        upd(i, { categories: next.length ? next : undefined });
                      }}
                      className={`rounded-full px-3 py-1 text-[0.62rem] font-bold transition-colors ${
                        on ? "bg-gold text-ink" : "bg-white/8 text-white/50 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
                {!(c.categories ?? []).length && (
                  <span className="text-[0.68rem] text-white/35">— every trip</span>
                )}
              </div>

              {/* live preview + housekeeping */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                <p className="text-[0.72rem] text-white/45">
                  On a {inr(PREVIEW_TOTAL)} booking today:{" "}
                  {preview.ok ? (
                    <span className="font-bold text-success">
                      −{inr(preview.discount)} → {inr(preview.total)}
                    </span>
                  ) : (
                    <span className="font-bold text-brand-bright">won&apos;t apply ({preview.reason})</span>
                  )}
                  {c.usageLimit != null && (
                    <span className="ml-3 text-white/35">
                      used {c.usedCount ?? 0}/{c.usageLimit}
                    </span>
                  )}
                </p>
                <Btn
                  tone="ghost"
                  onClick={() => {
                    if (!confirm(`Delete coupon ${c.code || "(unnamed)"}?`)) return;
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
