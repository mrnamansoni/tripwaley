"use client";

/* SEND US THE BRIEF — the corporate page's lead capture.
 *
 * Whoever fills this is usually an HR or admin lead who will forward our reply
 * to a manager, so the left pane writes the brief back to them as a calendar
 * invite while they type: the thing they'll eventually send their team. The
 * WhatsApp button carries the same answers into a pre-written message.
 */

import { useState } from "react";
import { trackLead } from "@/lib/analytics";

const input =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink/65 focus:border-brand";
const label = "block text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink/65";

export default function CorporateQuoteForm({
  title,
  sub,
  whatsappLink,
  formats,
}: {
  title: string;
  sub: string;
  whatsappLink: string;
  /** trip-format names from the admin copy, offered as one-tap choices */
  formats: string[];
}) {
  const [f, setF] = useState({
    company: "",
    people: "",
    format: "",
    budget: "",
    destination: "",
    month: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const waText = encodeURIComponent(
    `Hi Tripwaley! We're planning a team trip.\n` +
      `• Company: ${f.company || "—"}\n` +
      `• People: ${f.people || "—"}\n` +
      `• Type: ${f.format || "—"}\n` +
      `• Destination: ${f.destination || "open to suggestions"}\n` +
      `• Budget per head: ${f.budget ? `₹${f.budget}` : "—"}\n` +
      `• Rough dates: ${f.month || "—"}` +
      (f.name ? `\n• Contact: ${f.name}` : "")
  );
  const waHref = `${whatsappLink}${whatsappLink.includes("?") ? "&" : "?"}text=${waText}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const ten = f.phone.replace(/[^\d]/g, "").slice(-10);
    if (!f.company.trim()) {
      setErr("Tell us which company this is for.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(ten)) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }

    setPhase("sending");
    try {
      const res = await fetch("/api/corporate-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, phone: ten }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Could not send that — please try WhatsApp.");
      }
      trackLead({ slug: "corporate-quote", name: `Corporate · ${f.company}`, price: Number(f.budget) || 0 });
      setPhase("done");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  const subject = `${f.format || "Team trip"}${f.destination ? ` · ${f.destination}` : ""}`;

  return (
    <section id="brief" className="scroll-mt-24 bg-blush py-[10vh]">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-card">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* the pitch, and the invite writing itself */}
            <div className="bg-ink p-7 sm:p-10">
              <p className="font-script text-2xl text-gold sm:text-3xl">no deposit to ask</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-white/60">{sub}</p>

              <div aria-hidden="true" className="mt-7 overflow-hidden rounded-2xl bg-white text-ink">
                <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink/65">invitation · draft</span>
                </div>
                <div className="space-y-1.5 px-4 py-4 text-[0.82rem]">
                  <p className="font-display text-base font-extrabold leading-snug">{subject}</p>
                  <p className="text-ink/65">
                    <span className="font-bold text-ink/80">When</span> {f.month || "pick the dates"}
                  </p>
                  <p className="text-ink/65">
                    <span className="font-bold text-ink/80">Guests</span>{" "}
                    {f.company ? `everyone at ${f.company}` : "the whole team"}
                    {f.people ? ` (${f.people})` : ""}
                  </p>
                  <p className="text-ink/65">
                    <span className="font-bold text-ink/80">Organiser</span> Tripwaley
                  </p>
                </div>
                <div className="flex gap-2 border-t border-line px-4 py-2.5 text-[0.7rem] font-bold">
                  <span className="rounded-full bg-success-ink px-3 py-1 text-white">Yes</span>
                  <span className="rounded-full border border-line px-3 py-1 text-ink/45">Maybe</span>
                  <span className="rounded-full border border-line px-3 py-1 text-ink/30 line-through">No</span>
                </div>
              </div>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-success-ink px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.3A10 10 0 1 0 12 2Z" />
                </svg>
                Send it on WhatsApp instead
              </a>
            </div>

            {/* the form */}
            <div className="p-7 sm:p-10">
              {phase === "done" ? (
                <div className="flex h-full flex-col items-start justify-center">
                  <span aria-hidden="true" className="font-display text-5xl">
                    📅
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">Brief received.</h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink/65">
                    We&apos;ll call {f.phone.replace(/[^\d]/g, "").slice(-10)} within one working day with routes for{" "}
                    {f.company}.
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
                  {formats.length > 0 && (
                    <fieldset>
                      <legend className={label}>what kind of trip</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formats.map((t) => {
                          const on = f.format === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setF((x) => ({ ...x, format: on ? "" : t }))}
                              className={`min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${
                                on ? "border-ink bg-ink text-cream" : "border-line text-ink/70 hover:border-ink"
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="kq-company">
                        company *
                      </label>
                      <input id="kq-company" className={input} value={f.company} onChange={set("company")} autoComplete="organization" required />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-people">
                        how many people
                      </label>
                      <input id="kq-people" className={input} value={f.people} onChange={set("people")} inputMode="numeric" placeholder="e.g. 35" />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-budget">
                        budget per head (₹)
                      </label>
                      <input id="kq-budget" className={input} value={f.budget} onChange={set("budget")} inputMode="numeric" placeholder="e.g. 15000" />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-destination">
                        destination
                      </label>
                      <input id="kq-destination" className={input} value={f.destination} onChange={set("destination")} placeholder="or leave it to us" />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-month">
                        rough dates
                      </label>
                      <input id="kq-month" className={input} value={f.month} onChange={set("month")} placeholder="e.g. first week of March" />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-name">
                        your name
                      </label>
                      <input id="kq-name" className={input} value={f.name} onChange={set("name")} autoComplete="name" />
                    </div>

                    <div>
                      <label className={label} htmlFor="kq-phone">
                        mobile *
                      </label>
                      <input id="kq-phone" className={input} value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="10-digit mobile" required />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="kq-email">
                        work email
                      </label>
                      <input id="kq-email" className={input} value={f.email} onChange={set("email")} type="email" inputMode="email" autoComplete="email" placeholder="for the proposal" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="kq-notes">
                        anything else
                      </label>
                      <textarea id="kq-notes" className={input} rows={3} value={f.notes} onChange={set("notes")} placeholder="Offices people travel from, a meeting day, dietary needs…" />
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
                    {phase === "sending" ? "Sending…" : "Send the brief →"}
                  </button>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-ink/65">
                    We use your number only to reply to this brief. No spam, ever.
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
