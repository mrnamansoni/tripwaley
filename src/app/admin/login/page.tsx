"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(j.error ?? "login failed");
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
        <p className="font-script text-3xl text-gold">tripwaley</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Mission control</h1>
        <p className="mt-1 text-xs text-white/45">Authorized crew only. Attempts are rate-limited.</p>

        <label htmlFor="pw" className="mt-7 block text-[0.62rem] font-bold uppercase tracking-[0.3em] text-white/45">
          Password
        </label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition-colors focus:border-gold"
        />
        {error && <p className="mt-3 text-sm font-semibold text-brand-bright">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 w-full rounded-xl bg-gold py-3.5 font-bold text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter the cockpit →"}
        </button>
      </form>
    </main>
  );
}
