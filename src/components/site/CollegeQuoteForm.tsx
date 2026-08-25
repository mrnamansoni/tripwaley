"use client";

/* GET A QUOTE — the college page's lead capture.
 *
 * A coordinator is usually filling this on a phone between lectures, so it
 * asks for the four things a quote genuinely needs (college, batch size,
 * budget, number) and treats everything else as optional. The WhatsApp
 * button beside it carries the same answers into a pre-written message for
 * anyone who would rather not fill a form at all.
 */

import { useState } from "react";
import { trackLead } from "@/lib/analytics";

const input =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brand";
const label = "block text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink/45";

export default function CollegeQuoteForm({
  title,
  sub,
  whatsappLink,
}: {
  title: string;
  sub: string;
  whatsappLink: string;
}) {
  const [f, setF] = useState({
    college: "",
    name: "",
    phone: "",
    email: "",
    students: "",
    budget: "",
    destination: "",
    month: "",
    notes: "",
  });
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const waText = encodeURIComponent(
    `Hi Tripwaley! We'd like a quote for a college trip.\n` +
      `• College: ${f.college || "—"}\n` +
      `• Students: ${f.students || "—"}\n` +
      `• Destination: ${f.destination || "open to suggestions"}\n` +
      `• Budget per student: ${f.budget ? `₹${f.budget}` : "—"}\n` +
      `• Rough dates: ${f.month || "—"}` +
      (f.name ? `\n• Contact: ${f.name}` : "")
  );
  const waHref = `${whatsappLink}${whatsappLink.includes("?") ? "&" : "?"}text=${waText}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const ten = f.phone.replace(/[^\d]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(ten)) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!f.college.trim()) {
      setErr("Tell us which college this is for.");
      return;
    }

    setPhase("sending");
    try {
      const res = await fetch("/api/college-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, phone: ten }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Could not send that — please try WhatsApp.");
      }
      trackLead({ slug: "college-quote", name: `College · ${f.college}`, price: Number(f.budget) || 0 });
      setPhase("done");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  return (
    <section id="quote" className="bg-blush py-[10vh]">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-card">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* the pitch */}
            <div className="bg-ink p-7 sm:p-10">
              <p className="font-script text-2xl text-gold sm:text-3xl">no obligation, no deposit</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-white/60">{sub}</p>

              <ul className="mt-7 space-y-3">
                {[
                  "Three costed routes, priced at your exact batch size",
                  "Back within one working day",
                  "Consent forms and parent paperwork included",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[0.9rem] leading-relaxed text-white/70">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-gold">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-success px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Z" />
                </svg>
                Ask on WhatsApp instead
              </a>
            </div>

            {/* the form */}
            <div className="p-7 sm:p-10">
              {phase === "done" ? (
                <div className="flex h-full flex-col items-start justify-center">
                  <span aria-hidden="true" className="font-display text-5xl">
                    🎒
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">Got it — we&apos;re on it.</h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink/65">
                    Our college desk will call {f.phone.replace(/[^\d]/g, "").slice(-10)} within one working day
                    with three costed routes for {f.college}.
                  </p>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-11 items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink/75 transition-colors hover:border-brand hover:text-brand"
                  >
                    Message us now instead →
                  </a>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="cq-college">
                        college / university *
                      </label>
                      <input id="cq-college" className={input} value={f.college} onChange={set("college")} placeholder="e.g. IIT Roorkee" required />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-students">
                        number of students *
                      </label>
                      <input id="cq-students" className={input} value={f.students} onChange={set("students")} inputMode="numeric" placeholder="e.g. 60" required />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-budget">
                        budget per student (₹)
                      </label>
                      <input id="cq-budget" className={input} value={f.budget} onChange={set("budget")} inputMode="numeric" placeholder="e.g. 9000" />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-destination">
                        destination
                      </label>
                      <input id="cq-destination" className={input} value={f.destination} onChange={set("destination")} placeholder="or leave it to us" />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-month">
                        rough dates
                      </label>
                      <input id="cq-month" className={input} value={f.month} onChange={set("month")} placeholder="e.g. late March" />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-name">
                        your name
                      </label>
                      <input id="cq-name" className={input} value={f.name} onChange={set("name")} placeholder="coordinator" />
                    </div>

                    <div>
                      <label className={label} htmlFor="cq-phone">
                        mobile *
                      </label>
                      <input id="cq-phone" className={input} value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="10-digit mobile" required />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="cq-email">
                        email
                      </label>
                      <input id="cq-email" className={input} value={f.email} onChange={set("email")} inputMode="email" placeholder="for the quote PDF" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="cq-notes">
                        anything else
                      </label>
                      <textarea id="cq-notes" className={input} rows={3} value={f.notes} onChange={set("notes")} placeholder="Faculty count, dietary needs, fixed dates…" />
                    </div>
                  </div>

                  {err && (
                    <p role="alert" className="mt-4 rounded-xl bg-brand/10 px-4 py-3 text-sm font-bold text-brand">
                      {err}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={phase === "sending"}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-extrabold text-white shadow-red transition-colors hover:bg-brand-bright disabled:opacity-60 sm:w-auto"
                  >
                    {phase === "sending" ? "Sending…" : "Get our quote →"}
                  </button>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-ink/45">
                    We use your number only to send this quote. No spam, ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
