"use client";

/* PHONEPE CREDENTIALS.
 *
 * Set the gateway keys without a redeploy. Two rules shape this form:
 *
 *   • The secret and the webhook password are WRITE-ONLY. The server reports
 *     only whether they are set, never their value, so nothing can read a
 *     credential back out of the panel. Leaving a secret field blank keeps the
 *     stored one — it does not clear it.
 *   • Environment variables WIN. If Dokploy supplies a value, the matching
 *     field is locked and labelled, because a panel that silently loses to the
 *     environment is worse than one that says so.
 */

import { useEffect, useState } from "react";
import { Btn, input, label } from "./ui";

interface Summary {
  clientId: string;
  clientVersion: string;
  env: "sandbox" | "production";
  webhookUser: string;
  hasSecret: boolean;
  hasWebhookPass: boolean;
  configured: boolean;
  lockedByEnv: Record<string, boolean>;
}

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

export default function GatewaySettings({ onSaved }: { onSaved?: () => void }) {
  const [sum, setSum] = useState<Summary | null>(null);
  const [form, setForm] = useState({ clientId: "", clientVersion: "1", env: "sandbox", webhookUser: "", clientSecret: "", webhookPass: "" });
  const [busy, setBusy] = useState<"" | "save" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/gateway", { cache: "no-store" });
        const j: Summary = await r.json();
        if (dead) return;
        setSum(j);
        setForm((f) => ({
          ...f,
          clientId: j.clientId,
          clientVersion: j.clientVersion || "1",
          env: j.env,
          webhookUser: j.webhookUser,
          clientSecret: "",
          webhookPass: "",
        }));
        if (!j.configured) setOpen(true); // nothing set yet — start expanded
      } catch {
        if (!dead) setMsg({ ok: false, text: "Couldn't load gateway settings." });
      }
    })();
    return () => { dead = true; };
  }, [reload]);

  const locked = (k: string) => Boolean(sum?.lockedByEnv?.[k]);

  const save = async () => {
    setBusy("save"); setMsg(null);
    try {
      const r = await fetch("/api/admin/gateway", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "save failed");
      setMsg({ ok: true, text: "Saved. Test the connection to confirm the keys work." });
      setReload((n) => n + 1);
      onSaved?.();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    } finally { setBusy(""); }
  };

  const test = async () => {
    setBusy("test"); setMsg(null);
    try {
      const r = await fetch("/api/admin/gateway", { method: "POST" });
      const j = await r.json();
      setMsg({ ok: Boolean(j.ok), text: j.ok ? j.message : j.error });
    } catch {
      setMsg({ ok: false, text: "Couldn't run the test." });
    } finally { setBusy(""); }
  };

  if (!sum) return <div className={`mb-6 ${card} text-sm text-white/40`}>Loading gateway settings…</div>;

  return (
    <div className={`mb-6 ${card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={label}>PhonePe credentials</p>
          <p className="mt-1 text-sm text-white/55">
            {sum.configured ? (
              <>
                <span className="font-bold text-success">Connected</span> · {sum.env}
                {sum.env === "sandbox" && " (test payments only — no real money)"}
              </>
            ) : (
              <span className="font-bold text-gold">Not set — no Pay button is shown on the site</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Btn tone="ghost" onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "Edit keys"}</Btn>
          <Btn onClick={test} disabled={busy !== ""}>{busy === "test" ? "testing…" : "Test connection"}</Btn>
        </div>
      </div>

      {msg && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-success/15 text-success" : "bg-brand/15 text-brand-bright"}`}>
          {msg.text}
        </p>
      )}

      {open && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Locked l="client id" k="clientId" locked={locked("clientId")}>
              <input value={form.clientId} disabled={locked("clientId")} className={input}
                placeholder="M22XXXXXXXXXX_2609031441"
                onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
            </Locked>

            <Locked l="client version" k="clientVersion" locked={locked("clientVersion")}>
              <input value={form.clientVersion} disabled={locked("clientVersion")} className={input}
                inputMode="numeric" placeholder="1"
                onChange={(e) => setForm({ ...form, clientVersion: e.target.value })} />
            </Locked>

            <Locked l={`client secret${sum.hasSecret ? " — set" : ""}`} k="clientSecret" locked={locked("clientSecret")}>
              <input type="password" value={form.clientSecret} disabled={locked("clientSecret")} className={input}
                autoComplete="new-password"
                placeholder={sum.hasSecret ? "•••••••• (leave blank to keep)" : "paste the secret"}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} />
            </Locked>

            <Locked l="environment" k="env" locked={locked("env")}>
              <select value={form.env} disabled={locked("env")} className={input}
                onChange={(e) => setForm({ ...form, env: e.target.value })}>
                <option value="sandbox">sandbox — test payments</option>
                <option value="production">production — real money</option>
              </select>
            </Locked>

            <Locked l="webhook username" k="webhookUser" locked={locked("webhookUser")}>
              <input value={form.webhookUser} disabled={locked("webhookUser")} className={input}
                onChange={(e) => setForm({ ...form, webhookUser: e.target.value })} />
            </Locked>

            <Locked l={`webhook password${sum.hasWebhookPass ? " — set" : ""}`} k="webhookPass" locked={locked("webhookPass")}>
              <input type="password" value={form.webhookPass} disabled={locked("webhookPass")} className={input}
                autoComplete="new-password"
                placeholder={sum.hasWebhookPass ? "•••••••• (leave blank to keep)" : "same as on the PhonePe dashboard"}
                onChange={(e) => setForm({ ...form, webhookPass: e.target.value })} />
            </Locked>
          </div>

          <p className="mt-4 text-[0.7rem] leading-relaxed text-white/40">
            From PhonePe Business → Developer Settings → API Keys. The webhook username and password are the
            ones you set under the Webhooks tab, alongside the URL{" "}
            <span className="font-mono text-white/60">/api/pay/webhook</span>. Secrets are stored on the server
            and never sent back to this screen — blank means &ldquo;keep what&rsquo;s saved&rdquo;.
          </p>

          <div className="mt-4 flex gap-2">
            <Btn onClick={save} disabled={busy !== ""}>{busy === "save" ? "saving…" : "Save credentials"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Locked({ l, locked, children }: { l: string; k: string; locked: boolean; children: React.ReactNode }) {
  return (
    <label className={label}>
      {l}
      {locked && <span className="ml-2 text-[0.55rem] normal-case tracking-normal text-gold">set by environment</span>}
      <div className={locked ? "opacity-50" : ""}>{children}</div>
    </label>
  );
}
