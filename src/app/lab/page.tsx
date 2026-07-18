import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Hero01EditorialKinetic from "@/components/lab/Hero01EditorialKinetic";
import Hero02PostcardFan from "@/components/lab/Hero02PostcardFan";
import Hero03ZoomType from "@/components/lab/Hero03ZoomType";
import Hero04SplitEditorial from "@/components/lab/Hero04SplitEditorial";
import Hero05Contours from "@/components/lab/Hero05Contours";
import Hero06FlightNetwork from "@/components/lab/Hero06FlightNetwork";
import Hero07FilmStrip from "@/components/lab/Hero07FilmStrip";
import Hero08LiquidShader from "@/components/lab/Hero08LiquidShader";
import Hero09DeparturesBoard from "@/components/lab/Hero09DeparturesBoard";
import Hero10Portal from "@/components/lab/Hero10Portal";
import Hero11PhotoTunnel from "@/components/lab/Hero11PhotoTunnel";
import Hero12Planet from "@/components/lab/Hero12Planet";
import Hero13PaperDiorama from "@/components/lab/Hero13PaperDiorama";
import Hero14OrbitGallery from "@/components/lab/Hero14OrbitGallery";
import Hero15Wireframe from "@/components/lab/Hero15Wireframe";
import Hero16FloatingIslands from "@/components/lab/Hero16FloatingIslands";
import Hero17BalloonAscent from "@/components/lab/Hero17BalloonAscent";
import Hero18ParticleMorph from "@/components/lab/Hero18ParticleMorph";
import Hero19TrainWindow from "@/components/lab/Hero19TrainWindow";
import Hero20Constellation from "@/components/lab/Hero20Constellation";
import Hero21Maison from "@/components/lab/Hero21Maison";
import Hero22Spotlight from "@/components/lab/Hero22Spotlight";
import Hero23Lens from "@/components/lab/Hero23Lens";
import Hero24Menu from "@/components/lab/Hero24Menu";
import Hero25Silk from "@/components/lab/Hero25Silk";
import Hero26BehindRidge from "@/components/lab/Hero26BehindRidge";
import Hero27GoldTicket from "@/components/lab/Hero27GoldTicket";
import Hero28Aurora from "@/components/lab/Hero28Aurora";
import Hero29Gallery from "@/components/lab/Hero29Gallery";
import Hero30Cinema from "@/components/lab/Hero30Cinema";
import Hero31Monogram from "@/components/lab/Hero31Monogram";
import Hero32Concierge from "@/components/lab/Hero32Concierge";
import Hero33GroupChat from "@/components/lab/Hero33GroupChat";
import Hero34CursorTrail from "@/components/lab/Hero34CursorTrail";
import Hero35FoggedWindow from "@/components/lab/Hero35FoggedWindow";
import Hero36SplitFlap from "@/components/lab/Hero36SplitFlap";
import Hero37TypeReveal from "@/components/lab/Hero37TypeReveal";
import Hero38Compass from "@/components/lab/Hero38Compass";
import Hero39Polaroids from "@/components/lab/Hero39Polaroids";
import Hero40Stubs from "@/components/lab/Hero40Stubs";
import Hero41Metaball from "@/components/lab/Hero41Metaball";
import Hero42InfiniteWall from "@/components/lab/Hero42InfiniteWall";

/* opulent high-contrast serif for the luxury batch (21–32) */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hero Lab — 10 concepts | Tripwaley",
  robots: { index: false, follow: false },
};

const HEROES: { n: string; name: string; recipe: string; Comp: React.ComponentType }[] = [
  { n: "01", name: "Editorial Kinetic", recipe: "Swiss type · scroll-speed layers · passport stamp", Comp: Hero01EditorialKinetic },
  { n: "02", name: "Postcard Fan", recipe: "Scrapbook polaroids · cursor tilt · handwritten notes", Comp: Hero02PostcardFan },
  { n: "03", name: "Zoom-Through Type", recipe: "Pinned · camera flies through the word ESCAPE", Comp: Hero03ZoomType },
  { n: "04", name: "Split Editorial", recipe: "Magazine split · clip-path wipes · auto-cycling stops", Comp: Hero04SplitEditorial },
  { n: "05", name: "Contour Expedition", recipe: "Dark topo chart · self-drawing contours · altitude ticker", Comp: Hero05Contours },
  { n: "06", name: "Flight Network", recipe: "Canvas · India in dots · live arcs · cursor gravity", Comp: Hero06FlightNetwork },
  { n: "07", name: "Film Strip", recipe: "Cinematic marquee · velocity skew · title card", Comp: Hero07FilmStrip },
  { n: "08", name: "Liquid Panorama", recipe: "WebGL shader · flowing distortion · cursor ripples", Comp: Hero08LiquidShader },
  { n: "09", name: "Departures Board", recipe: "Split-flap airport board · live clock · flipping rows", Comp: Hero09DeparturesBoard },
  { n: "10", name: "The Portal", recipe: "Pinned · circular window swells into a full world", Comp: Hero10Portal },
  { n: "11", name: "The Memory Tunnel", recipe: "WebGL · fly through a corridor of floating photos", Comp: Hero11PhotoTunnel },
  { n: "12", name: "Homeground", recipe: "WebGL · low-poly planet, scroll spins & dives to surface", Comp: Hero12Planet },
  { n: "13", name: "Paper Theatre", recipe: "WebGL · dolly through layered paper-cutout diorama", Comp: Hero13PaperDiorama },
  { n: "14", name: "The Carousel", recipe: "WebGL · you stand inside a spinning ring of destinations", Comp: Hero14OrbitGallery },
  { n: "15", name: "The Survey", recipe: "WebGL · wireframe terrain rises, route draws, drone sweep", Comp: Hero15Wireframe },
  { n: "16", name: "The Drop", recipe: "WebGL · vertical descent past three floating islands", Comp: Hero16FloatingIslands },
  { n: "17", name: "Altitude Therapy", recipe: "WebGL · balloon ride, scroll is the burner, live altimeter", Comp: Hero17BalloonAscent },
  { n: "18", name: "Made of Moments", recipe: "WebGL · 11k particles morph Taj → Dal Lake", Comp: Hero18ParticleMorph },
  { n: "19", name: "Window Seat", recipe: "WebGL · train window, parallax scenery, km ticker", Comp: Hero19TrainWindow },
  { n: "20", name: "Written in the Stars", recipe: "WebGL · night camp, gaze tilts to a constellation route", Comp: Hero20Constellation },
  { n: "21", name: "The Maison", recipe: "Aman-school quiet luxury · Ken Burns · serif restraint", Comp: Hero21Maison },
  { n: "22", name: "After Dark", recipe: "Spotlight beam · cursor-lit dot grid · shimmer + shine borders", Comp: Hero22Spotlight },
  { n: "23", name: "The Lens", recipe: "Cursor is a lens — type gives way to the photo beneath", Comp: Hero23Lens },
  { n: "24", name: "The Tasting Menu", recipe: "Hover a journey, the room floods with it · serif carte", Comp: Hero24Menu },
  { n: "25", name: "Banarasi", recipe: "WebGL crimson silk · gold thread · cursor runs across it", Comp: Hero25Silk },
  { n: "26", name: "Behind the Range", recipe: "Headline rises from BEHIND the Himalayan ridge", Comp: Hero26BehindRidge },
  { n: "27", name: "First Class", recipe: "Gold-foil boarding pass · 3D tilt · holographic glare", Comp: Hero27GoldTicket },
  { n: "28", name: "The Suite", recipe: "Aurora light fields behind frosted glass · shimmer serif", Comp: Hero28Aurora },
  { n: "29", name: "The Private View", recipe: "Gallery frames under picture lights · museum placards", Comp: Hero29Gallery },
  { n: "30", name: "35mm", recipe: "Letterboxed arthouse cuts · film grain · live timecode", Comp: Hero30Cinema },
  { n: "31", name: "Gold Dust", recipe: "Monogram poured in particles · breath-scatter physics", Comp: Hero31Monogram },
  { n: "32", name: "The Concierge", recipe: "Belmond booking split · hairline fields · gold reserve", Comp: Hero32Concierge },
  { n: "33", name: "The Group Chat", recipe: "Live WhatsApp thread replays — typing, voice notes, I'M IN", Comp: Hero33GroupChat },
  { n: "34", name: "Everywhere You Look", recipe: "Photos bloom along your cursor's wake and melt away", Comp: Hero34CursorTrail },
  { n: "35", name: "First Rain", recipe: "Wipe the fogged monsoon window to reveal Meghalaya", Comp: Hero35FoggedWindow },
  { n: "36", name: "Solari", recipe: "Full-screen split-flap board mechanically flipping departures", Comp: Hero36SplitFlap },
  { n: "37", name: "Cutout", recipe: "Footage plays inside the word WANDER, then bursts full-bleed", Comp: Hero37TypeReveal },
  { n: "38", name: "True North", recipe: "A field of compass needles all swing to your cursor", Comp: Hero38Compass },
  { n: "39", name: "Shoebox", recipe: "Fling real polaroids around with momentum physics", Comp: Hero39Polaroids },
  { n: "40", name: "The Ticket Rack", recipe: "Pinned horizontal rack of perforated boarding-pass stubs", Comp: Hero40Stubs },
  { n: "41", name: "Ink & Gold", recipe: "Shader metaballs — crimson & liquid gold chase the cursor", Comp: Hero41Metaball },
  { n: "42", name: "The Wall", recipe: "Infinite photo wall rushes in, one frame swallows the screen", Comp: Hero42InfiniteWall },
];

function LabDivider({ n, name, recipe }: { n: string; name: string; recipe: string }) {
  return (
    <div id={`hero-${n}`} className="flex items-center gap-4 border-y border-dashed border-brand/30 bg-gold/10 px-5 py-3 sm:px-8">
      <span className="font-display text-2xl font-extrabold text-brand">{n}</span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">{name}</p>
        <p className="truncate text-xs text-ink/55">{recipe}</p>
      </div>
    </div>
  );
}

export default function HeroLab() {
  return (
    <main className={`bg-cream ${fraunces.variable}`}>
      {/* lab header */}
      <header className="border-b border-line bg-cream px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl font-extrabold">
              <span className="font-script text-2xl text-brand">trip</span>waley{" "}
              <span className="text-brand">/ hero lab</span>
            </p>
            <p className="text-xs text-ink/55">
              42 concepts, stacked. 01–10 mixed · 11–20 full 3D · 21–32 luxury ·{" "}
              <strong className="text-brand">33–42 the story batch</strong> — interactive, tactile, brand-native. Pick a direction — we productionize the winner.
            </p>
          </div>
          <nav aria-label="Jump to hero" className="flex flex-wrap gap-1.5">
            {HEROES.map((h) => (
              <a
                key={h.n}
                href={`#hero-${h.n}`}
                title={h.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-xs font-bold text-ink/70 transition-colors hover:border-brand hover:text-brand"
              >
                {h.n}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {HEROES.map(({ n, name, recipe, Comp }) => (
        <section key={n} aria-label={`Hero concept ${n}: ${name}`}>
          <LabDivider n={n} name={name} recipe={recipe} />
          <Comp />
        </section>
      ))}

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-ink/55 sm:px-8">
        That&apos;s all ten. Tell us the number (or the mix — &ldquo;03&apos;s zoom with 09&apos;s board&rdquo; works too).
      </footer>
    </main>
  );
}
