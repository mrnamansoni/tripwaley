"use client";

/* TEAM — the paltan: Tripwaley's core members, the case file on /team.
 *
 * One row per person. Whoever reports to nobody is pinned in the centre of the
 * board; the people who report to them are tied to it with red thread; anyone
 * further down shows up as a "known associate" of their head. Nothing is
 * seeded — the case file stays hidden until someone is live — but "Add the
 * usual chairs" drops in blank, hidden rows for the core roles so only the
 * names are left to type. Each role already has a "the person who…" line;
 * write your own to replace it.
 */

import { useState } from "react";
import { useAdmin, Field, Area, Btn, Head, input, label } from "./ui";
import MediaPicker from "./MediaPicker";
import { ABOUT_MAX, PUNCHLINE_MAX, roleLine } from "@/lib/team";
import type { TeamMember } from "@/lib/types";

const newId = () => `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const blank = (role = "", reportsTo?: string): TeamMember => ({
  id: newId(),
  name: "",
  role,
  photo: "",
  punchline: "",
  reportsTo,
  published: false,
});

function usualChairs(): TeamMember[] {
  const founder = blank("Founder");
  return [
    founder,
    ...["Co-founder", "Tech Head", "Sales Head", "HR Head", "Team Lead"].map((r) => blank(r, founder.id)),
  ];
}

export default function TeamEditor() {
  const { data, save } = useAdmin();
  const [rows, setRows] = useState<TeamMember[]>(() => data.catalog.team ?? []);

  const upd = (i: number, patch: Partial<TeamMember>) =>
    setRows((all) => all.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((all) => {
      const j = i + dir;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const who = (m: TeamMember) => [m.name.trim() || "(no name yet)", m.role.trim()].filter(Boolean).join(" — ");
  const liveCount = rows.filter((m) => m.published && m.name.trim()).length;

  return (
    <>
      <Head
        title="Team"
        sub="The case file on /team. Whoever reports to nobody is pinned in the centre; their direct reports are tied to them with red thread, in this order; anyone below a head appears as one of their known associates."
      >
        <Btn tone="ghost" onClick={() => setRows((all) => [...all, blank()])}>
          + New person
        </Btn>
        <Btn onClick={() => save("team", rows)}>Save all</Btn>
      </Head>

      <p className="mb-4 text-sm text-white/55">
        {liveCount ? `${liveCount} live on /team.` : "Nobody live yet — /team hides the case file until someone is."}
      </p>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
          <p>No one on the team list yet.</p>
          <div className="mt-4 flex justify-center">
            <Btn tone="ghost" onClick={() => setRows(usualChairs())}>
              Add the usual chairs (Founder, Co-founder, Tech, Sales, HR, Team Lead)
            </Btn>
          </div>
          <p className="mt-3 text-[0.72rem]">They start hidden with blank names — fill them in, add photos, set live, save.</p>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((m, i) => {
          const tooLong = m.punchline.length > PUNCHLINE_MAX;
          const defaultAbout = roleLine(m.role);
          const aboutLen = (m.about ?? "").length;
          return (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-4 lg:grid-cols-[11rem_1fr]">
                <div>
                  <MediaPicker
                    label="photo (square works best)"
                    value={m.photo}
                    onChange={(v) => upd(i, { photo: v })}
                    aspect="aspect-square"
                    allowVideo={false}
                  />
                  {!m.photo && <p className="mt-1.5 text-[0.7rem] text-white/45">No photo → their initials show instead.</p>}
                </div>

                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Field l="name" v={m.name} on={(v) => upd(i, { name: v })} />
                  <Field l="role, e.g. Sales Head" v={m.role} on={(v) => upd(i, { role: v })} />
                  <div className="sm:col-span-2">
                    <Area l={`catchy line — on their sticky note (${m.punchline.length}/${PUNCHLINE_MAX})`} v={m.punchline} on={(v) => upd(i, { punchline: v })} rows={2} />
                    {tooLong && <p className="mt-1 text-[0.7rem] font-bold text-brand">Too long — trim it to {PUNCHLINE_MAX} characters.</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <Area l={`who they are — "the person who…" (${aboutLen}/${ABOUT_MAX})`} v={m.about ?? ""} on={(v) => upd(i, { about: v || undefined })} rows={2} />
                    <p className="mt-1 text-[0.7rem] text-white/55">
                      {m.about?.trim()
                        ? aboutLen > ABOUT_MAX
                          ? `Too long — trim it to ${ABOUT_MAX} characters.`
                          : "Your line replaces the role's default."
                        : defaultAbout
                          ? `Blank uses: ${defaultAbout}`
                          : "No default line for this role — write one, or it shows without."}
                    </p>
                  </div>
                  <Field l="runs on, e.g. 3 cutting chais a day (optional)" v={m.runsOn ?? ""} on={(v) => upd(i, { runsOn: v || undefined })} />
                  <label className={label}>
                    reports to
                    <select value={m.reportsTo ?? ""} onChange={(e) => upd(i, { reportsTo: e.target.value || undefined })} className={input}>
                      <option value="">nobody — the centre of the chart</option>
                      {rows
                        .filter((o) => o.id !== m.id)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {who(o)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className={label}>
                    status
                    <select
                      value={m.published ? "live" : "hidden"}
                      onChange={(e) => upd(i, { published: e.target.value === "live" })}
                      className={input}
                    >
                      <option value="live">live — on /team</option>
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
                    if (!confirm(`Remove ${who(m)} from the team? Anyone reporting to them moves up a level.`)) return;
                    // their reports would otherwise point at a missing id and fail validation
                    setRows((all) =>
                      all
                        .filter((_, j) => j !== i)
                        .map((o) => (o.reportsTo === m.id ? { ...o, reportsTo: m.reportsTo } : o))
                    );
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
