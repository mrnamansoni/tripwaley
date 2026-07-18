import type { Metadata } from "next";

import L01MaskZoom from "@/components/lab2/L01MaskZoom";
import L02Globe from "@/components/lab2/L02Globe";
import L03Fleet from "@/components/lab2/L03Fleet";
import L04FilmScrub from "@/components/lab2/L04FilmScrub";
import L05LiquidCross from "@/components/lab2/L05LiquidCross";
import L06KineticWall from "@/components/lab2/L06KineticWall";
import L07CloudDive from "@/components/lab2/L07CloudDive";
import L08SlatReveal from "@/components/lab2/L08SlatReveal";
import L09Coverflow from "@/components/lab2/L09Coverflow";
import L10ExpandPanels from "@/components/lab2/L10ExpandPanels";
import L11StackDeck from "@/components/lab2/L11StackDeck";
import L12TiltGlass from "@/components/lab2/L12TiltGlass";
import L13OrbitRing from "@/components/lab2/L13OrbitRing";
import L14RouteRibbon from "@/components/lab2/L14RouteRibbon";
import L15DayNight from "@/components/lab2/L15DayNight";
import L16DragAtlas from "@/components/lab2/L16DragAtlas";
import L17TimelineDraw from "@/components/lab2/L17TimelineDraw";
import L18DayRail from "@/components/lab2/L18DayRail";
import L19AltitudeChart from "@/components/lab2/L19AltitudeChart";
import L20FlipCalendar from "@/components/lab2/L20FlipCalendar";
import L21ChatItinerary from "@/components/lab2/L21ChatItinerary";
import L22PackList from "@/components/lab2/L22PackList";
import L23Scrolly from "@/components/lab2/L23Scrolly";
import L24TrainTicker from "@/components/lab2/L24TrainTicker";
import L25MagneticCta from "@/components/lab2/L25MagneticCta";
import L26Takeover from "@/components/lab2/L26Takeover";
import L27SeatCountdown from "@/components/lab2/L27SeatCountdown";
import L28MarqueeCta from "@/components/lab2/L28MarqueeCta";
import L29TicketPrinter from "@/components/lab2/L29TicketPrinter";
import L30LuggagePit from "@/components/lab2/L30LuggagePit";
import L31ParallaxMasonry from "@/components/lab2/L31ParallaxMasonry";
import L32HeapToGrid from "@/components/lab2/L32HeapToGrid";
import L33TestimonialDrum from "@/components/lab2/L33TestimonialDrum";
import L34LiveFeed from "@/components/lab2/L34LiveFeed";
import L35StarMap from "@/components/lab2/L35StarMap";
import L36AmbientWall from "@/components/lab2/L36AmbientWall";
import L37CurtainFooter from "@/components/lab2/L37CurtainFooter";
import L38TopoFooter from "@/components/lab2/L38TopoFooter";
import L39GlobeFooter from "@/components/lab2/L39GlobeFooter";
import L40HorizonFooter from "@/components/lab2/L40HorizonFooter";
import { L41CursorSystem, L42PageWipe, L43SplitFlapText, L44Odometer, L45ProgressPlane } from "@/components/lab2/MicroSetA";
import { L46WeatherCards, L47PriceSlider, L48Faq, L49Preloader, L50LangPill } from "@/components/lab2/MicroSetB";

export const metadata: Metadata = {
  title: "Lab 2 — the motion library · 50 pieces | Tripwaley",
  robots: { index: false, follow: false },
};

type Item = { n: string; name: string; use: string; recipe: string; Comp: React.ComponentType };
type Cat = { id: string; label: string; blurb: string; items: Item[] };

const CATS: Cat[] = [
  {
    id: "heroes",
    label: "Heroes & Openers",
    blurb: "The first five seconds. Scroll-scrubbed, cinematic, unmistakable.",
    items: [
      { n: "L01", name: "The Title Drop", use: "hero", recipe: "GTA-style — camera flies through INDIA cut out of the page", Comp: L01MaskZoom },
      { n: "L02", name: "Orbit", use: "hero", recipe: "WebGL dot-planet, India in red, gold flight arcs with racing pips", Comp: L02Globe },
      { n: "L03", name: "The Hangar", use: "hero / brand", recipe: "Glossy 3D jet, studio lights, contact shadow, scroll turntable", Comp: L03Fleet },
      { n: "L04", name: "One Take", use: "hero", recipe: "Scroll is the playhead — letterboxed film scrub with timecode", Comp: L04FilmScrub },
      { n: "L05", name: "State Change", use: "hero / transition", recipe: "Liquid shader melt: Kashmir dissolves into Andaman", Comp: L05LiquidCross },
      { n: "L06", name: "Momentum", use: "hero / break", recipe: "Monumental type lanes that lean with scroll velocity", Comp: L06KineticWall },
      { n: "L07", name: "Descent", use: "hero", recipe: "Camera falls through four decks of volumetric cloud into sunset", Comp: L07CloudDive },
      { n: "L08", name: "The Blinds", use: "hero", recipe: "Photo sliced into 7 slats gliding open on alternating tracks", Comp: L08SlatReveal },
    ],
  },
  {
    id: "destinations",
    label: "Destination Showcases",
    blurb: "Ways to make people pick a place — or be picked by one.",
    items: [
      { n: "L09", name: "The Deck", use: "destinations", recipe: "True 3D coverflow with live reflections, scrubbed by scroll", Comp: L09Coverflow },
      { n: "L10", name: "The Accordion", use: "destinations", recipe: "21st.dev expanding panels, finished with cascade + chips", Comp: L10ExpandPanels },
      { n: "L11", name: "The Pile-Up", use: "destinations", recipe: "Sticky cards stack; each arrival presses the last one deeper", Comp: L11StackDeck },
      { n: "L12", name: "Vitrine", use: "destinations / stays", recipe: "3D glass cases — photo, label, price float at separate depths", Comp: L12TiltGlass },
      { n: "L13", name: "The Zodiac", use: "destinations", recipe: "Photos orbit spinning circular type; hover holds the sky still", Comp: L13OrbitRing },
      { n: "L14", name: "The Ribbon", use: "route section", recipe: "Delhi→Leh draws itself; a plane rides the tip of the ink", Comp: L14RouteRibbon },
      { n: "L15", name: "Two Shifts", use: "destinations", recipe: "Day/night of the same trip behind a draggable brass seam", Comp: L15DayNight },
      { n: "L16", name: "The Atlas Table", use: "destinations", recipe: "Grab-and-throw pannable photo map with momentum", Comp: L16DragAtlas },
    ],
  },
  {
    id: "itinerary",
    label: "Itinerary Storytelling",
    blurb: "Day-by-day sections that read like stories, not spreadsheets.",
    items: [
      { n: "L17", name: "The Spine", use: "itinerary", recipe: "Gold line pours down; day cards swing in as ink reaches them", Comp: L17TimelineDraw },
      { n: "L18", name: "The Rail", use: "itinerary", recipe: "Pinned horizontal days, ghost counter, progress rail", Comp: L18DayRail },
      { n: "L19", name: "The Profile", use: "itinerary", recipe: "Altitude chart draws with scroll · live altimeter · camp flags", Comp: L19AltitudeChart },
      { n: "L20", name: "The Desk Calendar", use: "itinerary", recipe: "3D page-flips — day number front, that day's photo behind", Comp: L20FlipCalendar },
      { n: "L21", name: "Captain's Feed", use: "itinerary", recipe: "The trip as live captain updates, pin drops included", Comp: L21ChatItinerary },
      { n: "L22", name: "The Manifest", use: "prep section", recipe: "Packing list checks itself; the last item gets stamped REJECTED", Comp: L22PackList },
      { n: "L23", name: "The Long Read", use: "story section", recipe: "NYT scrollytelling — pinned media, drifting chapters", Comp: L23Scrolly },
      { n: "L24", name: "Stations", use: "journey section", recipe: "Station signs stream past a platform marker; km counter spins", Comp: L24TrainTicker },
    ],
  },
  {
    id: "ctas",
    label: "CTAs",
    blurb: "Six ways to ask for the booking — from charming to unignorable.",
    items: [
      { n: "L25", name: "The Magnet", use: "cta", recipe: "Magnetic pull + gooey blob + confetti burst on click", Comp: L25MagneticCta },
      { n: "L26", name: "The Takeover", use: "cta", recipe: "A pill button that swells to swallow the whole viewport", Comp: L26Takeover },
      { n: "L27", name: "Final Boarding", use: "cta", recipe: "Flip-clock countdown + seat map with the last 3 seats pulsing", Comp: L27SeatCountdown },
      { n: "L28", name: "The Chant", use: "cta", recipe: "Marquee lanes chanting; hover snaps a lane red and still", Comp: L28MarqueeCta },
      { n: "L29", name: "The Printer", use: "cta", recipe: "Scroll prints a boarding pass; CONFIRMED stamp slams at the end", Comp: L29TicketPrinter },
      { n: "L30", name: "Baggage Claim", use: "cta", recipe: "Destination tags fall with real physics — grab and throw them", Comp: L30LuggagePit },
    ],
  },
  {
    id: "memory",
    label: "Memory & Social Proof",
    blurb: "The 'it actually happened' sections — photos, reviews, live wire.",
    items: [
      { n: "L31", name: "The Album", use: "memories", recipe: "Three photo lanes scrolling at different speeds", Comp: L31ParallaxMasonry },
      { n: "L32", name: "Tidy / Untidy", use: "memories", recipe: "Polaroid heap ⇄ archive grid, FLIP-morphed by scroll or button", Comp: L32HeapToGrid },
      { n: "L33", name: "The Drum", use: "reviews", recipe: "Testimonials on a rotating 3D drum, scroll turns the axle", Comp: L33TestimonialDrum },
      { n: "L34", name: "The Wire", use: "social proof", recipe: "Live booking feed — entries spring in every few seconds", Comp: L34LiveFeed },
      { n: "L35", name: "Reviews, Constellated", use: "reviews", recipe: "Five-star reviews as stars; constellation draws its own lines", Comp: L35StarMap },
      { n: "L36", name: "The Screening Room", use: "memories", recipe: "Six frames breathing with Ken Burns; hover wakes one, dims the room", Comp: L36AmbientWall },
    ],
  },
  {
    id: "footers",
    label: "Footers",
    blurb: "Last impressions. Four endings, none of them boring.",
    items: [
      { n: "L37", name: "The Curtain", use: "footer", recipe: "The page lifts away, revealing the footer underneath all along", Comp: L37CurtainFooter },
      { n: "L38", name: "Base Camp", use: "footer", recipe: "Survey-map contours drifting like weather, summit pin pinging", Comp: L38TopoFooter },
      { n: "L39", name: "Night Shift", use: "footer", recipe: "Canvas dot-globe spinning beside live office clocks", Comp: L39GlobeFooter },
      { n: "L40", name: "Last Exit", use: "footer", recipe: "Perspective highway to the horizon, lane dashes streaming", Comp: L40HorizonFooter },
    ],
  },
  {
    id: "micro",
    label: "Micro-interactions",
    blurb: "The small parts that make a site feel hand-built.",
    items: [
      { n: "L41", name: "The Companion", use: "sitewide", recipe: "Custom cursor: dot + trailing ring that announces view / drag / book", Comp: L41CursorSystem },
      { n: "L42", name: "The Shutter", use: "page transitions", recipe: "Brand slab wipes through with the wordmark between pages", Comp: L42PageWipe },
      { n: "L43", name: "Departure-Board Type", use: "headings", recipe: "Headlines that scramble and re-file like a split-flap board", Comp: L43SplitFlapText },
      { n: "L44", name: "The Odometer", use: "stats band", recipe: "Counters roll up in-view with Indian-format digits", Comp: L44Odometer },
      { n: "L45", name: "Progress, Airborne", use: "scroll indicator", recipe: "A plane flies your reading progress along a dotted route", Comp: L45ProgressPlane },
      { n: "L46", name: "The Forecast", use: "destination meta", recipe: "Weather cards that animate their own sun, rain and snow", Comp: L46WeatherCards },
      { n: "L47", name: "The Dial", use: "filters / booking", recipe: "Budget slider with tick marks, gradient fill and a mood label", Comp: L47PriceSlider },
      { n: "L48", name: "Asked & Answered", use: "faq", recipe: "Accordion with rotating plus, sprung heights, honest copy", Comp: L48Faq },
      { n: "L49", name: "The Warm-Up", use: "preloader", recipe: "Wordmark draws itself, counter runs, curtains split open", Comp: L49Preloader },
      { n: "L50", name: "The Concierge Pill", use: "header utility", recipe: "Language & currency pill that morphs open like glass", Comp: L50LangPill },
    ],
  },
];

function Divider({ item, cat }: { item: Item; cat: Cat }) {
  return (
    <div id={item.n.toLowerCase()} className="flex items-center gap-4 border-y border-dashed border-brand/30 bg-gold/10 px-5 py-3 sm:px-8">
      <span className="font-display text-xl font-extrabold text-brand">{item.n}</span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold uppercase tracking-wider text-ink">
          {item.name}
          <span className="ml-3 rounded-full bg-brand/10 px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-widest text-brand">{item.use}</span>
        </p>
        <p className="truncate text-xs text-ink/55">{item.recipe}</p>
      </div>
      <span className="ml-auto hidden shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/35 sm:block">{cat.label}</span>
    </div>
  );
}

export default function Lab2() {
  return (
    <main className="bg-cream">
      <header className="border-b border-line bg-cream px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-xl font-extrabold">
            <span className="font-script text-2xl text-brand">trip</span>waley <span className="text-brand">/ lab 2 — the motion library</span>
          </p>
          <p className="mt-1 max-w-3xl text-xs text-ink/55">
            50 production-ready motion pieces for a travel site — heroes, destination showcases, itinerary storytelling, CTAs,
            memory walls, footers and micro-interactions. Every piece is scroll-driven, cursor-aware or alive on its own.
          </p>
          <nav aria-label="Jump to category" className="mt-4 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <a
                key={c.id}
                href={`#${c.items[0].n.toLowerCase()}`}
                className="rounded-full border border-line bg-card px-4 py-2 text-xs font-bold text-ink/70 transition-colors hover:border-brand hover:text-brand"
              >
                {c.label} · {c.items.length}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {CATS.map((cat) => (
        <div key={cat.id}>
          <div className="bg-ink px-5 py-10 text-center sm:px-8">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.5em] text-gold">{cat.label}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/55">{cat.blurb}</p>
          </div>
          {cat.items.map((item) => (
            <section key={item.n} aria-label={`${item.n}: ${item.name}`}>
              <Divider item={item} cat={cat} />
              <item.Comp />
            </section>
          ))}
        </div>
      ))}

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-ink/55 sm:px-8">
        Fifty pieces. Name the numbers you want on the real site — we assemble the winners.
      </footer>
    </main>
  );
}
