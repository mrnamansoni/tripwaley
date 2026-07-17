"use client";

/* Section-copy editor — every editable headline/eyebrow on the homepage &
   key sections, grouped by where it appears. Reads defaults from CONTENT_DEFS,
   overlays saved overrides from catalog.content. Blank = falls back to the
   default automatically. */

import { useMemo, useState } from "react";
import { useAdmin, Btn, Head, input, label } from "./ui";
import { CONTENT_DEFS } from "@/lib/types";

export default function ContentEditor() {
  const { data, save } = useAdmin();
  const saved = data.catalog.content ?? {};
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(CONTENT_DEFS.map((d) => [d.key, saved[d.key] ?? d.default]))
  );

  const dirty = useMemo(
    () => CONTENT_DEFS.some((d) => (draft[d.key] ?? "") !== (saved[d.key] ?? d.default)),
    [draft, saved]
  );

  const groups = useMemo(() => {
    const g: Record<string, typeof CONTENT_DEFS> = {};
    for (const d of CONTENT_DEFS) (g[d.group] ??= []).push(d);
    return g;
  }, []);

  const resetOne = (key: string, def: string) => setDraft((d) => ({ ...d, [key]: def }));

  return (
    <>
      <Head title="Content" sub="Edit the words on the site. Blank a field to restore its default.">
        <Btn disabled={!dirty} onClick={() => save("content", draft)}>Save content</Btn>
      </Head>

      {Object.entries(groups).map(([group, defs]) => (
        <section key={group} className="mb-8">
          <p className={label}>{group}</p>
          <div className="mt-3 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            {defs.map((def) => (
              <div key={def.key}>
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/45">{def.label}</span>
                  {(draft[def.key] ?? "") !== def.default && (
                    <button type="button" onClick={() => resetOne(def.key, def.default)} className="text-[0.58rem] font-bold uppercase tracking-wider text-white/35 hover:text-gold">
                      reset to default
                    </button>
                  )}
                </div>
                {def.kind === "multiline" ? (
                  <textarea
                    value={draft[def.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [def.key]: e.target.value }))}
                    rows={2}
                    className={input}
                  />
                ) : (
                  <input
                    value={draft[def.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [def.key]: e.target.value }))}
                    className={input}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
