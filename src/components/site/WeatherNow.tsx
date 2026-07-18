"use client";

/* THE FORECAST — real weather at the destination (their L46 pick, made real).
   Live conditions from Open-Meteo (free, no key) with the animated sun /
   rain / snow treatments. Fails silent — no weather, no card. */

import { useEffect, useState } from "react";

interface Wx { temp: number; code: number }

const kind = (code: number): "sun" | "rain" | "snow" | "cloud" =>
  code === 0 || code === 1 ? "sun" : code >= 71 && code <= 86 ? "snow" : (code >= 51 && code <= 67) || code >= 80 ? "rain" : "cloud";

const COPY: Record<string, (t: number) => string> = {
  sun: (t) => `${t > 25 ? "Sunscreen weather" : "Golden and clear"} — the cameras will feast.`,
  rain: () => "Proper mountain rain — chai consumption: heroic.",
  snow: () => "Snowing at the top. Layer up, the passes are showing off.",
  cloud: () => "Moody skies — the dramatic kind, not the cancelled kind.",
};

export default function WeatherNow({ lat, lng, place }: { lat: number; lng: number; place: string }) {
  const [wx, setWx] = useState<Wx | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j?.current) setWx({ temp: Math.round(j.current.temperature_2m), code: j.current.weather_code });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [lat, lng]);

  if (!wx) return null;
  const k = kind(wx.code);

  const palette = {
    sun: "bg-[linear-gradient(160deg,#f7b733,#e8935a)]",
    rain: "bg-[linear-gradient(160deg,#39536b,#1f2f40)]",
    snow: "bg-[linear-gradient(160deg,#8fa8c9,#4a5d7d)]",
    cloud: "bg-[linear-gradient(160deg,#7d8a96,#4d5a66)]",
  }[k];

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-card-lg ${palette}`}>
      {k === "sun" && (
        <div aria-hidden="true" className="absolute -right-5 -top-5 h-24 w-24">
          <div className="absolute inset-4 rounded-full bg-[#fff3d6]" />
          <div className="absolute inset-0 animate-[l13spin_14s_linear_infinite]">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="absolute left-1/2 top-1/2 h-7 w-1 origin-top rounded bg-[#fff3d6]/80" style={{ transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateY(24px)` }} />
            ))}
          </div>
        </div>
      )}
      {k === "rain" && (
        <div aria-hidden="true" className="absolute inset-0 opacity-50" style={{ backgroundImage: "repeating-linear-gradient(105deg, transparent 0 16px, rgba(190,220,255,0.5) 16px 17px, transparent 17px 34px)", animation: "l46rain 0.7s linear infinite" }} />
      )}
      {k === "snow" && (
        <div aria-hidden="true" className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-white/85" style={{ left: `${(i * 37) % 100}%`, animation: `l46snow ${3 + (i % 4)}s linear ${(i % 5) * 0.7}s infinite` }} />
          ))}
        </div>
      )}
      <p className="relative text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/80">{place} · live right now</p>
      <p className="relative mt-3 font-display text-5xl font-extrabold">{wx.temp}°</p>
      <p className="relative mt-1 text-sm font-semibold text-white/85">{COPY[k](wx.temp)}</p>
    </div>
  );
}
