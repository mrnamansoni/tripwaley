/* THE PALTAN ORBIT — the /team org chart, built from a flat admin list.

   The admin enters people one row at a time with an optional "reports to".
   The page draws two rings: one person in the centre, the people who report
   to them on the inner orbit, and everyone further down grouped under their
   inner-orbit ancestor. Pure and dependency-free so scripts/test-team-tree.mjs
   can run it directly. */

import type { TeamMember } from "./types";

export interface TeamBranch {
  member: TeamMember;
  /** everyone below this inner-orbit person, at any depth, in admin order */
  crew: TeamMember[];
}

export interface TeamTree {
  lead: TeamMember;
  branches: TeamBranch[];
}

const visible = (m: TeamMember) => m.published && !!m.name.trim();

/** The chart for the live rows, or null when nobody is live yet. Never drops a
 *  visible person: a missing manager, a hidden manager or a reporting loop
 *  just moves them up to the inner orbit. */
export function buildTeamTree(rows: TeamMember[]): TeamTree | null {
  const live = rows.filter(visible);
  if (!live.length) return null;
  const byId = new Map(live.map((m) => [m.id, m]));
  const parentOf = (m: TeamMember) => (m.reportsTo && m.reportsTo !== m.id ? byId.get(m.reportsTo) : undefined);

  const lead = live.find((m) => !parentOf(m)) ?? live[0];

  /* walk up until the next step is the lead; that person is the branch. A
     dead end tops out at whoever is highest; a loop puts the person on the
     inner orbit themselves, so nobody in it disappears. */
  const branchOf = (m: TeamMember): TeamMember => {
    const seen = new Set<string>([m.id]);
    let cur = m;
    for (;;) {
      const up = parentOf(cur);
      if (up && seen.has(up.id)) return m;
      if (!up || up.id === lead.id) return cur;
      seen.add(up.id);
      cur = up;
    }
  };

  const branches = new Map<string, TeamBranch>();
  const order: string[] = [];
  const crewOf = new Map<string, TeamMember[]>();
  for (const m of live) {
    if (m.id === lead.id) continue;
    const head = branchOf(m);
    if (head.id === m.id) {
      branches.set(m.id, { member: m, crew: [] });
      order.push(m.id);
    } else {
      crewOf.set(head.id, [...(crewOf.get(head.id) ?? []), m]);
    }
  }
  for (const [id, crew] of crewOf) {
    const b = branches.get(id);
    if (b) b.crew = crew;
  }
  return { lead, branches: order.map((id) => branches.get(id)!) };
}

export const PUNCHLINE_MAX = 180;
export const ABOUT_MAX = 200;

/* The "the person who…" line each role gets until the admin writes their own.
   The founder, co-founder and tech lines are the owner's words; the rest are
   written in the same voice. First match wins, so co-founder sits above
   founder and the specific departments above the catch-all "lead". */
const ROLE_LINES: [RegExp, string][] = [
  [/\bco[\s-]?founder/, "The person who believed in the founder, and built every step of it alongside them."],
  [/\bfounder/, "The person behind the foundation of this premium travel brand."],
  [/\b(tech|technology|cto|engineering|developer)\b/, "The person who keeps every traveller connected with our team, wherever the road goes."],
  [/\b(hr|human resources?|people|talent|hiring)\b/, "The person who finds the people who make every trip feel like home."],
  [/\bsales\b/, "The person who turns \u201clet\u2019s plan something\u201d into a seat on the bus."],
  [/\b(operations|ops)\b/, "The person who makes sure every bus, stay and chai stop happens on time."],
  [/\b(marketing|growth|brand)\b/, "The person who makes sure the right people find their next trip."],
  [/\b(finance|accounts?)\b/, "The person who keeps every rupee accounted for."],
  [/\b(content|creative|social|design)\b/, "The person who turns every batch into stories you can\u2019t stop watching."],
  [/\b(customer|support|care)\b/, "The person who answers before you\u2019ve finished asking."],
  [/\bcaptain\b/, "The person who runs the trip on the ground, from first pickup to last goodbye."],
  [/\blead\b/, "The person who keeps the whole team moving in the same direction."],
];

export function roleLine(role: string): string | undefined {
  const r = role.toLowerCase();
  return ROLE_LINES.find(([re]) => re.test(r))?.[1];
}

/** What the page says a person does: the admin's line, else their role's. */
export const aboutFor = (m: TeamMember): string => m.about?.trim() || roleLine(m.role) || "";

/** Why the admin's list can't be saved, or null. Hidden rows may be blank
 *  "chairs" waiting for a name; a live row needs a name and a role. */
export function teamError(rows: TeamMember[]): string | null {
  const ids = new Set<string>();
  for (const [i, m] of rows.entries()) {
    const at = m.name?.trim() || `row ${i + 1}`;
    if (typeof m.id !== "string" || !m.id.trim()) return `${at}: missing id`;
    if (ids.has(m.id)) return `${at}: duplicate id ${m.id}`;
    ids.add(m.id);
    for (const k of ["name", "role", "photo", "punchline"] as const) {
      if (typeof m[k] !== "string") return `${at}: invalid ${k}`;
    }
    for (const k of ["runsOn", "reportsTo", "about"] as const) {
      if (m[k] != null && typeof m[k] !== "string") return `${at}: invalid ${k}`;
    }
    if (typeof m.published !== "boolean") return `${at}: published must be true or false`;
    if (m.published && !m.name.trim()) return `${at}: a live person needs a name`;
    if (m.published && !m.role.trim()) return `${at}: a live person needs a role`;
    if (m.punchline.length > PUNCHLINE_MAX) return `${at}: keep the punchline under ${PUNCHLINE_MAX} characters`;
    if (m.about && m.about.length > ABOUT_MAX) return `${at}: keep the about line under ${ABOUT_MAX} characters`;
    if (m.reportsTo && m.reportsTo === m.id) return `${at}: can't report to themselves`;
  }
  const byId = new Map(rows.map((m) => [m.id, m]));
  for (const m of rows) {
    if (m.reportsTo && !byId.has(m.reportsTo)) return `${m.name || m.id}: reports to someone who isn't on the list`;
    const seen = new Set<string>([m.id]);
    let up = m.reportsTo ? byId.get(m.reportsTo) : undefined;
    while (up) {
      if (seen.has(up.id)) return `${m.name || m.id}: the reports-to chain goes round in a loop`;
      seen.add(up.id);
      up = up.reportsTo ? byId.get(up.reportsTo) : undefined;
    }
  }
  return null;
}
