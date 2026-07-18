import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import CityProvider from "@/components/site/CityProvider";
import CurtainFooter from "@/components/site/CurtainFooter";
import { WeatherStrip, SeasonsBand, CtaBand } from "@/components/site/PageExtras";
import VideoReel from "@/components/site/VideoReel";
import ZodiacRing from "@/components/site/ZodiacRing";
import DayNightSeam from "@/components/site/DayNightSeam";
import AlbumWall from "@/components/site/AlbumWall";
import { getCities, getSettings, getLivePackages, getVideoTestimonial, sectionOn, slotOne, text, fromPrice, inr, nightsLabel, slot } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Destinations — where the batches go | Tripwaley",
  description: "Himachal, Uttarakhand, Kashmir, Rajasthan, Goa — every region Tripwaley runs group departures to, with live packages and prices.",
};

/* group live packages into destination regions */
const REGIONS: { slug: string; name: string; tag: string; test: RegExp; image: string }[] = [
  { slug: "himachal", name: "Himachal", tag: "passes, parvati & pine", test: /manali|kasol|himachal|shimla|jibhi|tirthan|mcleod|triund|bir|spiti|parvati/i, image: "/images/himalaya-sunrise.jpg" },
  { slug: "uttarakhand", name: "Uttarakhand", tag: "treks, temples & tungnath", test: /kedarkantha|chopta|rishikesh|uttrakhand|kedarnath|flower|haridwar|dehradun/i, image: "/images/snowtrek.jpg" },
  { slug: "kashmir", name: "Kashmir", tag: "shikaras & snowlines", test: /kashmir|srinagar|gulmarg/i, image: "/images/kashmir.jpg" },
  { slug: "rajasthan", name: "Rajasthan", tag: "forts, folk & thalis", test: /udaipur|rajasthan|jodhpur|mount abu/i, image: "/images/rajasthan.jpg" },
  { slug: "goa", name: "Goa", tag: "the classic, done right", test: /goa/i, image: "/images/andaman.jpg" },
];

export default function DestinationsPage() {
  const settings = getSettings();
  const cities = getCities();
  const live = getLivePackages();

  const vt = getVideoTestimonial();
  const regionImgs = slot("destinations.regions");
  const groups = REGIONS.map((r, i) => ({
    ...r,
    image: regionImgs[i] ?? r.image,
    packages: live.filter((p) => r.test.test(`${p.name} ${p.destination} ${p.route}`)),
  })).filter((g) => g.packages.length > 0);

  const albumCaptions = text("dest.album.captions").split("\n").map((l) => l.trim()).filter(Boolean);
  const albumPhotos = slot("destinations.album").map((src, i) => ({ src, note: albumCaptions[i] ?? "" }));

  return (
    <CityProvider cities={cities} defaultCity={settings.defaultCity}>
      <Navbar overDarkHero />
      <main className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="font-script text-2xl text-gold sm:text-3xl">pick a direction, we handle the rest</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Where the batches <span className="text-gold">go.</span>
            </h1>
          </div>
        </section>

        {sectionOn("destinations", "zodiac") && (
          <ZodiacRing
            items={groups.map((g) => ({ img: g.image, label: g.name, href: `#${g.slug}` }))}
            headline={text("dest.zodiac.headline")}
            accent={text("dest.zodiac.accent")}
            sub={text("dest.zodiac.sub")}
            ringText={text("dest.zodiac.ringText")}
          />
        )}

        {sectionOn("destinations", "regions") && groups.map((g, gi) => (
          <section key={g.slug} id={g.slug} className={`scroll-mt-24 py-[9vh] ${gi % 2 ? "bg-blush" : "bg-cream"}`}>
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
                {/* region marquee tile */}
                <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] shadow-card-lg">
                  <Image src={g.image} alt={g.name} fill sizes="(max-width:1024px) 92vw, 36vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-0 p-7">
                    <p className="font-script text-2xl text-gold">{g.tag}</p>
                    <h2 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{g.name}</h2>
                    <p className="mt-1 text-[0.66rem] font-bold uppercase tracking-[0.3em] text-white/60">
                      {g.packages.length} live package{g.packages.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {/* its packages — swipeable rail on phones, grid from sm: up */}
                <div data-lenis-prevent className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:content-start sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
                  {g.packages.slice(0, 4).map((p) => {
                    const price = fromPrice(p.slug);
                    return (
                      <Link
                        key={p.slug}
                        href={`/trips/${p.slug}`}
                        className="group relative w-[74vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-card-lg sm:w-auto sm:shrink"
                      >
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-ink/40">{nightsLabel(p)}</p>
                        <h3 className="mt-1.5 font-display text-xl font-extrabold leading-tight text-ink group-hover:text-brand">{p.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-ink/50">{p.destination || p.route}</p>
                        <p className="mt-3 font-display text-lg font-extrabold text-brand">{price ? `from ${inr(price)}` : "on request"}</p>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[linear-gradient(90deg,#f5a31a,#c9252c)] transition-transform duration-500 group-hover:scale-x-100" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}

        {sectionOn("destinations", "daynight") && (
          <DayNightSeam
            day={slotOne("daynight.day")}
            night={slotOne("daynight.night")}
            dayLabel={text("dest.daynight.dayLabel")}
            nightLabel={text("dest.daynight.nightLabel")}
            headline={text("dest.daynight.headline")}
            accent={text("dest.daynight.accent")}
            sub={text("dest.daynight.sub")}
          />
        )}
        {sectionOn("destinations", "reel") && vt.enabled && <VideoReel vt={vt} />}
        {sectionOn("destinations", "album") && albumPhotos.length >= 3 && (
          <AlbumWall
            photos={albumPhotos}
            eyebrow={text("dest.album.eyebrow")}
            headline={text("dest.album.headline")}
            accent={text("dest.album.accent")}
            sub={text("dest.album.sub")}
          />
        )}
        {sectionOn("destinations", "weather") && <WeatherStrip />}
        {sectionOn("destinations", "seasons") && <SeasonsBand />}
        {sectionOn("destinations", "cta") && <CtaBand
          whatsappLink={settings.whatsappLink}
          script="fourteen states, one decision"
          title="Pick a direction. We pack the rest."
        />}
      </main>
      <CurtainFooter whatsappLink={settings.whatsappLink} announcement={settings.announcement} />
    </CityProvider>
  );
}
