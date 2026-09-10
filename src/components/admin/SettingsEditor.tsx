"use client";

/* Site-wide settings — contact + brand, announcement bar, the timed lead
   popup, SEO metadata and social links. All persisted under catalog.settings;
   nested blocks are filled from sensible defaults when missing. */

import { useState } from "react";
import { useAdmin, Btn, Head, Field, Area, input, label } from "./ui";
import MediaPicker from "./MediaPicker";
import type { AnnouncementBar, GrievanceOfficer, LeadPopup, Seo, Socials, Settings, VideoTestimonial } from "@/lib/types";
import { DEFAULT_GRIEVANCE, DEFAULT_VIDEO_TESTIMONIAL, DEFAULT_HOLD_PERCENT, DEFAULT_GST_PERCENT } from "@/lib/types";
import { holdQuote, formatPaise } from "@/lib/money";

/* The ladder is three percentages that interact, and getting them wrong is a
   money bug on every booking. So show what they actually do to a real amount
   rather than asking the admin to hold the arithmetic in their head. */
function LadderPreview({ holdPercent, gstPercent, advancePercent }: { holdPercent: number; gstPercent: number; advancePercent: number }) {
  const SAMPLE = 18000;
  const q = holdQuote({ total: SAMPLE, holdPercent, gstPercent, advancePercent });
  const rows: [string, string][] = [
    ["charged on the website", formatPaise(q.holdTotalPaise)],
    [`↳ ${q.holdPercent}% hold`, formatPaise(q.holdBasePaise)],
    [`↳ ${q.gstPercent}% GST on the hold`, formatPaise(q.holdGstPaise)],
    ["your team collects later", formatPaise(q.advanceBalancePaise)],
    ["due at departure", formatPaise(q.departureBalancePaise)],
  ];
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">
        on a {formatPaise(SAMPLE * 100)} booking
      </p>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className={`flex items-baseline justify-between gap-4 ${k.startsWith("↳") ? "pl-3 text-white/45" : "text-white/80"}`}>
            <dt className="text-[0.8rem]">{k}</dt>
            <dd className="font-mono text-[0.8rem] font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {q.advanceBalancePaise < 0 && (
        <p className="mt-3 text-[0.78rem] font-semibold text-amber-300">
          Hold % is above advance % — the hold counts toward the advance, so this leaves
          your team collecting a negative amount. Saving will be refused.
        </p>
      )}
    </div>
  );
}

const DEF_BAR: AnnouncementBar = { enabled: false, text: "Monsoon batches are filling fast — hold a seat free for 24h.", href: "/trips", emoji: "🎒" };
const DEF_POPUP: LeadPopup = { enabled: false, delaySeconds: 15, title: "Wait — grab your seat", subtitle: "Drop your number and we'll send this week's departures + a first-timer discount.", incentive: "₹500 off your first batch", cta: "Send me departures", image: "/images/group-mountains.jpg" };
const DEF_SEO: Seo = { title: "", description: "", ogImage: "/images/ladakh.jpg" };
const DEF_SOCIALS: Socials = { instagram: "", youtube: "", facebook: "" };

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const toggle = "flex items-center gap-2 text-xs font-bold text-white/70";

export default function SettingsEditor() {
  const { data, save } = useAdmin();
  const [s, setS] = useState<Settings>(() => ({
    ...data.catalog.settings,
    announcementBar: data.catalog.settings.announcementBar ?? DEF_BAR,
    leadPopup: data.catalog.settings.leadPopup ?? DEF_POPUP,
    seo: data.catalog.settings.seo ?? DEF_SEO,
    socials: data.catalog.settings.socials ?? DEF_SOCIALS,
    videoTestimonial: data.catalog.settings.videoTestimonial ?? DEFAULT_VIDEO_TESTIMONIAL,
    grievance: data.catalog.settings.grievance ?? DEFAULT_GRIEVANCE,
  }));

  const bar = s.announcementBar!;
  const popup = s.leadPopup!;
  const seo = s.seo!;
  const socials = s.socials!;
  const vt = s.videoTestimonial!;
  const gr = s.grievance!;
  const setBar = (p: Partial<AnnouncementBar>) => setS((x) => ({ ...x, announcementBar: { ...bar, ...p } }));
  const setPopup = (p: Partial<LeadPopup>) => setS((x) => ({ ...x, leadPopup: { ...popup, ...p } }));
  const setSeo = (p: Partial<Seo>) => setS((x) => ({ ...x, seo: { ...seo, ...p } }));
  const setSocials = (p: Partial<Socials>) => setS((x) => ({ ...x, socials: { ...socials, ...p } }));
  const setVt = (p: Partial<VideoTestimonial>) => setS((x) => ({ ...x, videoTestimonial: { ...vt, ...p } }));
  const setGr = (p: Partial<GrievanceOfficer>) => setS((x) => ({ ...x, grievance: { ...gr, ...p } }));

  return (
    <>
      <Head title="Settings" sub="Contact, announcement bar, lead popup, SEO and socials — all live on save.">
        <Btn onClick={() => save("settings", { ...s, whatsappLink: `https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}` })}>Save settings</Btn>
      </Head>

      <div className="max-w-4xl space-y-8">
        {/* brand + contact */}
        <section>
          <p className={label}>Brand &amp; contact</p>
          <div className={`mt-3 grid gap-4 sm:grid-cols-2 ${card}`}>
            <Field l="brand" v={s.brand} on={(v) => setS({ ...s, brand: v })} />
            <Field l="whatsapp number" v={s.whatsapp} on={(v) => setS({ ...s, whatsapp: v })} />
            <Field l="contact email" v={s.email ?? ""} on={(v) => setS({ ...s, email: v })} />
            <label className={label}>default city
              <select value={s.defaultCity} onChange={(e) => setS({ ...s, defaultCity: e.target.value })} className={input}>
                {data.catalog.cities.filter((c) => c.priced).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <Field l="n8n / CRM webhook url" v={s.n8nWebhook ?? ""} on={(v) => setS({ ...s, n8nWebhook: v })} />
            <div className="sm:col-span-2"><Field l="address" v={s.address ?? ""} on={(v) => setS({ ...s, address: v })} /></div>
            <div className="sm:col-span-2"><Area l="refund policy line" v={s.refundPolicy} on={(v) => setS({ ...s, refundPolicy: v })} rows={2} /></div>
            <div className="sm:col-span-2"><Area l="announcement (footer note)" v={s.announcement} on={(v) => setS({ ...s, announcement: v })} rows={2} /></div>
          </div>
        </section>

        {/* booking ladder — the three stages money arrives in */}
        <section>
          <p className={label}>Booking ladder</p>
          <div className={`mt-3 ${card}`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field l="hold % (charged on website)" v={s.holdPercent ?? DEFAULT_HOLD_PERCENT} type="number"
                on={(v) => setS({ ...s, holdPercent: Number(v) || 0 })} />
              <Field l="GST % (on the hold fee)" v={s.gstPercent ?? DEFAULT_GST_PERCENT} type="number"
                on={(v) => setS({ ...s, gstPercent: Number(v) || 0 })} />
              <Field l="advance % (confirms booking)" v={s.advancePercent} type="number"
                on={(v) => setS({ ...s, advancePercent: Number(v) || 0 })} />
            </div>
            <LadderPreview
              holdPercent={s.holdPercent ?? DEFAULT_HOLD_PERCENT}
              gstPercent={s.gstPercent ?? DEFAULT_GST_PERCENT}
              advancePercent={s.advancePercent}
            />
          </div>
        </section>

        {/* socials */}
        <section>
          <p className={label}>Social links</p>
          <div className={`mt-3 grid gap-4 sm:grid-cols-3 ${card}`}>
            <Field l="instagram url" v={socials.instagram || s.instagram} on={(v) => setSocials({ instagram: v })} />
            <Field l="youtube url" v={socials.youtube} on={(v) => setSocials({ youtube: v })} />
            <Field l="facebook url" v={socials.facebook} on={(v) => setSocials({ facebook: v })} />
          </div>
        </section>

        {/* announcement bar */}
        <section>
          <p className={label}>Announcement / urgency bar (top of every page)</p>
          <div className={`mt-3 space-y-4 ${card}`}>
            <label className={toggle}>
              <input type="checkbox" checked={bar.enabled} onChange={(e) => setBar({ enabled: e.target.checked })} className="h-4 w-4 accent-gold" />
              Show the bar
            </label>
            <div className="grid gap-4 sm:grid-cols-[5rem_1fr_1fr]">
              <Field l="emoji" v={bar.emoji} on={(v) => setBar({ emoji: v })} />
              <Field l="text" v={bar.text} on={(v) => setBar({ text: v })} />
              <Field l="link (optional)" v={bar.href} on={(v) => setBar({ href: v })} />
            </div>
          </div>
        </section>

        {/* lead popup */}
        <section>
          <p className={label}>Timed lead-capture popup</p>
          <div className={`mt-3 space-y-4 ${card}`}>
            <div className="flex flex-wrap items-center gap-6">
              <label className={toggle}>
                <input type="checkbox" checked={popup.enabled} onChange={(e) => setPopup({ enabled: e.target.checked })} className="h-4 w-4 accent-gold" />
                Show the popup
              </label>
              <label className={label}>after (seconds)
                <input type="number" value={popup.delaySeconds} onChange={(e) => setPopup({ delaySeconds: Math.max(1, Number(e.target.value) || 15) })} className={`${input} w-28`} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field l="title" v={popup.title} on={(v) => setPopup({ title: v })} />
              <Field l="button text" v={popup.cta} on={(v) => setPopup({ cta: v })} />
              <Field l="incentive chip" v={popup.incentive} on={(v) => setPopup({ incentive: v })} />
              <div className="sm:col-span-2"><Area l="subtitle" v={popup.subtitle} on={(v) => setPopup({ subtitle: v })} rows={2} /></div>
            </div>
            <MediaPicker label="popup image" value={popup.image} onChange={(p) => setPopup({ image: p })} />
          </div>
        </section>

        {/* grievance officer — statutory, and the usual gateway rejection */}
        <section className="rounded-2xl border-2 border-brand/40 bg-brand/[0.06] p-5">
          <p className={label}>grievance officer — required by law</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Rule 5(9) of the IT (SPDI) Rules, 2011 requires these details to be <b>published</b> on the site.
            A payment gateway checks for them by name, and a missing Grievance Officer is the single most
            common reason a privacy policy is rejected. They appear on /privacy — fill every field.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field l="officer name" v={gr.name} on={(v) => setGr({ name: v })} />
            <Field l="designation" v={gr.designation} on={(v) => setGr({ designation: v })} />
            <Field l="email" v={gr.email} on={(v) => setGr({ email: v })} />
            <Field l="phone (with +91)" v={gr.phone} on={(v) => setGr({ phone: v })} />
            <div className="sm:col-span-2">
              <Field l="contactable hours" v={gr.hours} on={(v) => setGr({ hours: v })} />
            </div>
          </div>
        </section>

        {/* legal identity — printed on the policy pages */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className={label}>legal identity</p>
          <p className="mt-1 text-xs text-white/40">
            Shown on /terms, /privacy, /refund-policy and /contact. A payment gateway checks these during
            onboarding — fill them in before submitting your application. Blank fields are simply hidden.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field l="registered entity name" v={s.legalName ?? ""} on={(v) => setS({ ...s, legalName: v })} />
            <Field l="GSTIN (optional)" v={s.gstin ?? ""} on={(v) => setS({ ...s, gstin: v })} />
            <Field l="Udyam / MSME number (optional)" v={s.udyam ?? ""} on={(v) => setS({ ...s, udyam: v })} />
            <div className="sm:col-span-2">
              <Field
                l="legal form — must match your KYC (e.g. a sole proprietorship registered as an MSME)"
                v={s.entityType ?? ""}
                on={(v) => setS({ ...s, entityType: v })}
              />
            </div>
            <div className="sm:col-span-2">
              <Field l="support hours, e.g. Mon–Sat, 10am–7pm IST" v={s.supportHours ?? ""} on={(v) => setS({ ...s, supportHours: v })} />
            </div>
          </div>
        </section>

        {/* bank details — printed on the invoice PDF only */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className={label}>bank details — invoice PDF</p>
          <p className="mt-1 text-xs text-white/40">
            Printed in the &ldquo;Pay To&rdquo; block on the last page of a customer&apos;s invoice.
            Leave any one blank and the whole block is hidden. The holder name is what a customer
            checks before transferring a balance — if it doesn&apos;t look like Tripwaley, expect
            them to call before they pay.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field l="bank account number" v={s.bankAccount ?? ""} on={(v) => setS({ ...s, bankAccount: v })} />
            <Field l="IFSC code" v={s.bankIfsc ?? ""} on={(v) => setS({ ...s, bankIfsc: v })} />
            <div className="sm:col-span-2">
              <Field l="account holder's name" v={s.bankHolder ?? ""} on={(v) => setS({ ...s, bankHolder: v })} />
            </div>
          </div>
        </section>

        {/* analytics & ads */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className={label}>analytics &amp; ads</p>
          <p className="mt-1 text-xs text-white/40">
            Loaded site-wide. Clear a field to switch that tag off completely — nothing is injected
            when it&apos;s empty.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field l="google analytics id (G-…)" v={s.gaId ?? ""} on={(v) => setS({ ...s, gaId: v })} />
            <Field l="meta pixel id" v={s.metaPixelId ?? ""} on={(v) => setS({ ...s, metaPixelId: v })} />
          </div>
        </section>

        {/* SEO */}
        <section>
          <p className={label}>SEO &amp; sharing</p>
          <div className={`mt-3 space-y-4 ${card}`}>
            <Field l="meta title (blank = default)" v={seo.title} on={(v) => setSeo({ title: v })} />
            <Area l="meta description" v={seo.description} on={(v) => setSeo({ description: v })} rows={2} />
            {/* OG previews must be a still — social platforms never play video */}
            <MediaPicker label="social share image (OG)" value={seo.ogImage} onChange={(p) => setSeo({ ogImage: p })} aspect="aspect-[16/9]" allowVideo={false} />
          </div>
        </section>

        {/* video testimonial (Destinations page cinema reel) */}
        <section>
          <p className={label}>Video testimonial — the reel on /destinations</p>
          <div className={`mt-3 space-y-4 ${card}`}>
            <label className={toggle}>
              <input type="checkbox" checked={vt.enabled} onChange={(e) => setVt({ enabled: e.target.checked })} className="h-4 w-4 accent-gold" />
              Show the reel
            </label>
            <Field
              l="video url (mp4 / webm — blank plays the poster as a silent cut)"
              v={vt.videoUrl}
              on={(v) => setVt({ videoUrl: v })}
            />
            <MediaPicker label="poster frame" value={vt.poster} onChange={(p) => setVt({ poster: p })} aspect="aspect-video" />
            <Area l="quote (revealed word-by-word on scroll)" v={vt.quote} on={(v) => setVt({ quote: v })} rows={3} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field l="traveller name" v={vt.name} on={(v) => setVt({ name: v })} />
              <Field l="trip / batch" v={vt.trip} on={(v) => setVt({ trip: v })} />
              <Field l="home city" v={vt.location} on={(v) => setVt({ location: v })} />
            </div>
            <p className="text-[0.68rem] leading-relaxed text-white/40">
              Drop an mp4 in <code className="text-white/60">/public/videos/</code> and reference it as
              <code className="text-white/60"> /videos/your-clip.mp4</code>, or paste a hosted URL. A phone-shot 15–30s clip is perfect.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
