import type { ReactNode } from "react";
import SiteMedia from "@/components/site/SiteMedia";
import { aboutFor, type TeamTree } from "@/lib/team";

/* THE PALTAN CASE FILE — shared pieces.

   /team presents the core team as an investigation: "kaun hain ye log?"
   Everyone is a polaroid pinned to a dark board, tied to the founder with red
   thread; each person's case note says who they are, with their line on a
   sticky note. The pieces here are plain markup so both the scroll-driven
   board (CaseBoard, client) and the stacked file (CaseList, server) use the
   same polaroid, pin, label tape and note. */

export interface CaseAssociate {
  id: string;
  name: string;
  role: string;
  photo: string;
  punchline: string;
  runsOn?: string;
}

export interface CaseSubject extends CaseAssociate {
  /** "the person who…" — the admin's line or the role's default */
  about: string;
  /** people below this head, at any depth */
  crew: CaseAssociate[];
}

const associate = (m: TeamTree["lead"]): CaseAssociate => ({
  id: m.id,
  name: m.name,
  role: m.role,
  photo: m.photo,
  punchline: m.punchline,
  runsOn: m.runsOn || undefined,
});

/** founder first, then the heads in admin order, each carrying their crew */
export function caseSubjects(tree: TeamTree): CaseSubject[] {
  return [
    { ...associate(tree.lead), about: aboutFor(tree.lead), crew: [] },
    ...tree.branches.map((b) => ({ ...associate(b.member), about: aboutFor(b.member), crew: b.crew.map(associate) })),
  ];
}

/* a small, stable tilt per person, so the board looks pinned by hand and
   stays the same on every visit */
export function tilt(id: string, max = 4): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (((h >>> 0) % 1000) / 1000 * 2 - 1) * max;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function Pin({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`pushpin ${className}`} />;
}

/* label-maker tape: the name, punched into red plastic */
export function NameTape({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`dymo ${className}`}>{name}</span>;
}

/** The polaroid. It hangs from its pin, so it tilts round the top edge. */
export function Polaroid({
  s,
  sizes,
  className = "",
  faceProps,
}: {
  s: CaseAssociate;
  sizes: string;
  className?: string;
  faceProps?: Record<string, string>;
}) {
  return (
    <span className={`polaroid ${className}`} style={{ rotate: `${tilt(s.id)}deg` }}>
      <span className="relative block aspect-[4/5] overflow-hidden bg-ink" {...faceProps}>
        {s.photo ? (
          <SiteMedia src={s.photo} alt={`${s.name}, ${s.role}`} fill sizes={sizes} className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-[2.5em] font-extrabold text-gold">
            {initials(s.name)}
          </span>
        )}
      </span>
    </span>
  );
}

/** the gold sticky note carrying their catchy line */
export function Sticky({ s, className = "" }: { s: CaseAssociate; className?: string }) {
  if (!s.punchline && !s.runsOn) return null;
  return (
    <figure className={`sticky-note ${className}`} style={{ rotate: `${tilt(s.id + "n", 3)}deg` }}>
      {s.punchline && (
        <blockquote className="font-script text-[1.5rem] leading-[1.1] text-ink">&ldquo;{s.punchline}&rdquo;</blockquote>
      )}
      {s.runsOn && (
        <figcaption className="mt-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-ink/70">runs on {s.runsOn}</figcaption>
      )}
    </figure>
  );
}

/** the people under a head, filed as their known associates */
export function Associates({ crew }: { crew: CaseAssociate[] }) {
  if (!crew.length) return null;
  return (
    <div className="mt-5 border-t border-dashed border-ink/25 pt-4">
      <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-ink/70">Known associates</p>
      <ul className="mt-3 space-y-3">
        {crew.map((c) => (
          <li key={c.id} className="flex items-start gap-3">
            <span className="relative mt-0.5 block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink">
              {c.photo ? (
                <SiteMedia src={c.photo} alt={c.name} fill sizes="44px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-extrabold text-gold">{initials(c.name)}</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-ink">
                {c.name} <span className="font-normal text-ink/70">· {c.role}</span>
              </p>
              {c.punchline && <p className="mt-0.5 text-sm leading-snug text-ink/75">{c.punchline}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The case note: who they are, highlighted, with their line stuck on top. */
export function CaseNote({ s, index, total, hlProps }: { s: CaseSubject; index: number; total: number; hlProps?: Record<string, string> }) {
  return (
    <div className="case-paper">
      <h3 className="font-display text-[clamp(2rem,3.4vw,3.25rem)] font-extrabold leading-[0.95] tracking-[-0.025em] text-ink [text-wrap:balance]">
        {s.name}
      </h3>
      <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-ink/70">
        {s.role} <span className="text-brand">·</span> subject {index + 1} of {total}
      </p>
      {s.about && (
        <p className="mt-4 text-[1rem] leading-relaxed text-ink">
          <span className="hl" {...hlProps}>
            {s.about}
          </span>
        </p>
      )}
      <Sticky s={s} className="mt-5" />
      <Associates crew={s.crew} />
    </div>
  );
}

/** the rubber stamp across the file */
export function Stamp({ children, className = "", ...rest }: { children: ReactNode; className?: string } & Record<string, unknown>) {
  return (
    <span className={`case-stamp ${className}`} {...rest}>
      {children}
    </span>
  );
}
