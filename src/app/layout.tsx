import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Instrument_Sans } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { BookingProvider } from "@/components/booking/BookingContext";
import SiteChrome from "@/components/site/SiteChrome";
import VideoAutoPause from "@/components/site/VideoAutoPause";
import Analytics from "@/components/site/Analytics";
import { SearchProvider, type SearchItem } from "@/components/site/SearchProvider";
import {
  getSettings,
  getLivePackages,
  upcomingDepartures,
  fromPrice,
  shortDate,
  nightsLabel,
  packageImages,
  packageCategories,
  normalizeMediaUrl,
  holdRates,
} from "@/lib/catalog";
import { phonepeConfigured } from "@/lib/phonepe";

// every page reads admin-edited data (catalog.json, media, settings) straight
// off disk on each request — force dynamic rendering everywhere so an admin
// save is live on the very next request, instead of waiting on Next's static
// route cache to notice the on-demand revalidatePath() call from the save API.
export const dynamic = "force-dynamic";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

/* Length is a real constraint, not a style preference: Google renders titles to
   a PIXEL width (~580px) and descriptions to ~1000px, then truncates. The old
   title measured 598px and the description 1194px, so the tagline and the last
   two destinations were being cut off in results anyway — better to choose what
   survives than to let the truncation choose. Keyword first, brand last. */
const DEFAULT_TITLE = "Group Trips Across India — Fixed Departures | Tripwaley";
const DEFAULT_DESC =
  "India's premium group-departure travel company. Curated batches to Ladakh, Spiti, Kashmir, Meghalaya & Kerala with certified trip captains.";

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSettings().seo;
  const title = seo?.title?.trim() || DEFAULT_TITLE;
  const description = seo?.description?.trim() || DEFAULT_DESC;
  // a pasted Drive/Dropbox share link is an HTML page, and every scraper
  // (WhatsApp, Facebook, X) would silently drop the preview — normalise to the
  // direct-file form the same way the on-page renderer does
  const ogImage = normalizeMediaUrl(seo?.ogImage || "") || "/images/ladakh.jpg";
  return {
    metadataBase: new URL("https://tripwaley.com"),
    /* NO `alternates` here. A canonical set on the layout is INHERITED by every
       page that doesn't set its own, so this line used to tell 52 of our 76
       sitemap URLs that they were duplicates of the homepage — see lib/seo.ts.
       metadataBase stays: it resolves each page's own relative canonical, and
       together with the www 301 in next.config.ts it settles which host is
       real. */
    title,
    description,
    keywords: [
      "group trips India",
      "Ladakh group departure",
      "Spiti valley trip",
      "solo travel India",
      "weekend trips",
      "Tripwaley",
    ],
    openGraph: {
      title,
      description,
      url: "https://tripwaley.com",
      siteName: "Tripwaley",
      locale: "en_IN",
      type: "website",
      images: [{ url: ogImage, width: 1600, height: 1067, alt: "Tripwaley — group trips across India" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#c91b20",
  width: "device-width",
  initialScale: 1,
};

/* The brand entity. Search engines AND AI answer engines read this to work out
   what Tripwaley is; the previous version gave them a name, a slogan and two
   social links, which is very little to reason from. Everything added here is
   verifiable from the site itself — nothing is claimed that we can't show. */
const orgJsonLd = (phone: string) => ({
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://tripwaley.com/#organization",
  name: "Tripwaley",
  slogan: "your complete travel guru",
  description:
    "Premium group-departure travel company running curated trips across India — Ladakh, Spiti, Kashmir, Meghalaya, Kerala, Andaman and more.",
  url: "https://tripwaley.com",
  areaServed: "IN",
  priceRange: "₹5,000–₹50,000",
  // NO aggregateRating here. Google treats a self-declared rating on a
  // LocalBusiness subtype as ineligible for the star feature, so it bought
  // nothing — and 4.9 / 2400 were hardcoded strings, not counted from real
  // reviews, which is an advertising-claim problem regardless of Google.
  // Ratings now ride on individual trips (Product/Offer) where they are
  // both legitimate and eligible.
  logo: { "@type": "ImageObject", url: "https://tripwaley.com/images/logo.png" },
  image: "https://tripwaley.com/images/ladakh.jpg",
  email: "grievance@tripwaley.com",
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  knowsAbout: [
    "Group departure tours in India",
    "Solo-friendly group travel",
    "Himalayan road trips",
    "College and student group tours",
    "Honeymoon packages in India",
  ],
  ...(phone ? { telephone: `+${phone.replace(/\D/g, "")}` } : {}),
  sameAs: [
    "https://instagram.com/tripwaley",
    "https://youtube.com/@tripwaley",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = getSettings();
  const live = getLivePackages();

  // search index — built once here and handed to the overlay, so searching
  // needs no endpoint and no round-trip
  const searchItems: SearchItem[] = live.map((p) => ({
    slug: p.slug,
    name: p.name,
    destination: p.destination || p.route,
    nightsLabel: nightsLabel(p),
    media: p.heroMedia || packageImages(p)[0],
    price: fromPrice(p.slug),
    keywords: `${p.route} ${p.destination} ${p.departureHubs} ${packageCategories(p).join(" ")}`.toLowerCase(),
  }));

  // real, bookable trips for the global Hold-my-seat modal (soonest departure first)
  const bookingTrips = live
    .map((p) => {
      const next = upcomingDepartures({ packageSlug: p.slug, limit: 1 })[0];
      return { slug: p.slug, name: p.name, date: next?.date ?? "", priceFrom: fromPrice(p.slug) ?? 0 };
    })
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      dateLabel: t.date ? shortDate(t.date) : "flexible dates",
      date: t.date,
      priceFrom: t.priceFrom,
    }));
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${caveat.variable}`}>
      <body>
        {/* first focusable element on every page — a keyboard user should not
            have to tab through the whole nav to reach content */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd(settings.whatsapp)) }}
        />
        <Analytics gaId={settings.gaId} metaPixelId={settings.metaPixelId} />
        <SiteChrome bar={settings.announcementBar} popup={settings.leadPopup} />
        <VideoAutoPause />
        <SmoothScroll>
          <SearchProvider items={searchItems}>
            <BookingProvider
              trips={bookingTrips}
              whatsapp={settings.whatsapp}
              rates={holdRates()}
              defaultCity={settings.defaultCity}
              payEnabled={phonepeConfigured()}
            >
              {children}
            </BookingProvider>
          </SearchProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
