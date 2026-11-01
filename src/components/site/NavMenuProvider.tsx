"use client";

/* What the navbar's dropdowns list — built once on the server in the root
   layout from the live catalog (like the search index), so every menu shows
   only places and months that really have trips, and the navbar itself stays
   a plain client component that needs no props on any page. */

import { createContext, useContext, type ReactNode } from "react";

export interface NavMenu {
  /** destinations with at least one live trip, in taxonomy order */
  destinations: { slug: string; name: string; state: string; trips: number }[];
  /** the next months that have departures, soonest first */
  months: { ym: string; label: string; departures: number }[];
  /** the soonest real departure, for the Trips menu's promo card */
  next?: { slug: string; name: string; dateLabel: string; priceFrom?: number; media?: string };
}

const Ctx = createContext<NavMenu>({ destinations: [], months: [] });
export const useNavMenu = () => useContext(Ctx);

export function NavMenuProvider({ menu, children }: { menu: NavMenu; children: ReactNode }) {
  return <Ctx.Provider value={menu}>{children}</Ctx.Provider>;
}
