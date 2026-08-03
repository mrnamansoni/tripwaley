import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Instrument_Sans } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { BookingProvider } from "@/components/booking/BookingContext";
import SiteChrome from "@/components/site/SiteChrome";
import VideoAutoPause from "@/components/site/VideoAutoPause";
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
} from "@/lib/catalog";

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

const DEFAULT_TITLE = "Tripwaley — Group Trips Across India | Your Complete Travel Guru";
const DEFAULT_DESC =
  "India's premium group-departure travel company. Curated batches to Ladakh, Spiti, Kashmir, Meghalaya, Kerala & Andaman with certified trip captains. Big mountains, new friends, zero planning.";

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSettings().seo;
  const title = seo?.title?.trim() || DEFAULT_TITLE;
  const description = seo?.description?.trim() || DEFAULT_DESC;
  const ogImage = seo?.ogImage || "/images/ladakh.jpg";
  return {
    metadataBase: new URL("https://tripwaley.com"),
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Tripwaley",
  slogan: "your complete travel guru",
  description:
    "Premium group-departure travel company running curated trips across India — Ladakh, Spiti, Kashmir, Meghalaya, Kerala, Andaman and more.",
  url: "https://tripwaley.com",
  areaServed: "IN",
  priceRange: "₹5,000–₹50,000",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "2400",
  },
  sameAs: [
    "https://instagram.com/tripwaley",
    "https://youtube.com/@tripwaley",
  ],
};

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
    .map((t) => ({ slug: t.slug, name: t.name, dateLabel: t.date ? shortDate(t.date) : "flexible dates", priceFrom: t.priceFrom }));
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${caveat.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteChrome bar={settings.announcementBar} popup={settings.leadPopup} />
        <VideoAutoPause />
        <SmoothScroll>
          <SearchProvider items={searchItems}>
            <BookingProvider trips={bookingTrips} whatsapp={settings.whatsapp}>{children}</BookingProvider>
          </SearchProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
