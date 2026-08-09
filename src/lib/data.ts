/**
 * Tripwaley content data — single source for all homepage sections.
 * In production this would come from a CMS; the shapes are CMS-ready.
 */

export const WHATSAPP_NUMBER = "919876543210";

export const waLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ */

export interface Destination {
  slug: string;
  name: string;
  region: string;
  hook: string;
  image: string;
  days: number;
  nights: number;
  priceFrom: number;
  rating: number;
  reviews: number;
  nextDeparture: string;
  seatsLeft: number;
  tags: string[];
  /** Tailwind grid classes for the asymmetric bento layout (desktop) */
  bento: string;
}

export const destinations: Destination[] = [
  {
    slug: "ladakh",
    name: "Leh–Ladakh",
    region: "Himalayas · 11,500 ft",
    hook: "Ride the world's highest passes with 15 strangers who become family.",
    image: "/images/ladakh.jpg",
    days: 7,
    nights: 6,
    priceFrom: 24999,
    rating: 4.9,
    reviews: 612,
    nextDeparture: "12 Jul",
    seatsLeft: 3,
    tags: ["Bike trip", "Pangong stay"],
    bento: "md:col-span-7 md:row-span-2",
  },
  {
    slug: "spiti",
    name: "Spiti Valley",
    region: "Cold desert · Himachal",
    hook: "Middle-of-nowhere monasteries and the clearest night skies in India.",
    image: "/images/spiti.jpg",
    days: 8,
    nights: 7,
    priceFrom: 18999,
    rating: 4.9,
    reviews: 488,
    nextDeparture: "19 Jul",
    seatsLeft: 7,
    tags: ["Road trip", "Astro night"],
    bento: "md:col-span-5 md:row-span-1",
  },
  {
    slug: "kashmir",
    name: "Kashmir",
    region: "Srinagar · Gulmarg · Pahalgam",
    hook: "Shikara sunsets on Dal Lake. Yes, it looks exactly like the photos.",
    image: "/images/kashmir.jpg",
    days: 6,
    nights: 5,
    priceFrom: 21999,
    rating: 4.8,
    reviews: 534,
    nextDeparture: "26 Jul",
    seatsLeft: 9,
    tags: ["Houseboat", "Gondola"],
    bento: "md:col-span-5 md:row-span-1",
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    region: "Shillong · Cherrapunji",
    hook: "Living root bridges, secret waterfalls and the cleanest village in Asia.",
    image: "/images/meghalaya.jpg",
    days: 6,
    nights: 5,
    priceFrom: 17999,
    rating: 4.8,
    reviews: 402,
    nextDeparture: "2 Aug",
    seatsLeft: 12,
    tags: ["Waterfalls", "Caves"],
    bento: "md:col-span-4 md:row-span-1",
  },
  {
    slug: "kerala",
    name: "Kerala",
    region: "Munnar · Alleppey · Varkala",
    hook: "Houseboat brunches and misty tea trails — the slowest week of your year.",
    image: "/images/kerala.jpg",
    days: 6,
    nights: 5,
    priceFrom: 16999,
    rating: 4.9,
    reviews: 577,
    nextDeparture: "9 Aug",
    seatsLeft: 10,
    tags: ["Backwaters", "Tea trails"],
    bento: "md:col-span-4 md:row-span-1",
  },
  {
    slug: "andaman",
    name: "Andaman",
    region: "Havelock · Neil Island",
    hook: "Bioluminescent beaches and scuba mornings on India's clearest waters.",
    image: "/images/andaman.jpg",
    days: 6,
    nights: 5,
    priceFrom: 28999,
    rating: 4.9,
    reviews: 356,
    nextDeparture: "16 Aug",
    seatsLeft: 6,
    tags: ["Scuba", "Island hop"],
    bento: "md:col-span-4 md:row-span-1",
  },
];

/* ------------------------------------------------------------------ */

export interface Collection {
  slug: string;
  title: string;
  sub: string;
  image: string;
  trips: number;
  from: number;
  badge?: string;
}

export const collections: Collection[] = [
  {
    slug: "himalayan-odysseys",
    title: "Himalayan Odysseys",
    sub: "Ladakh, Spiti, Kashmir — the big three, done properly.",
    image: "/images/himalaya-sunrise.jpg",
    trips: 14,
    from: 18999,
    badge: "Most loved",
  },
  {
    slug: "weekend-escapes",
    title: "Weekend Escapes",
    sub: "Friday night departure, Monday 9 AM you're back at your desk.",
    image: "/images/tent-view.jpg",
    trips: 22,
    from: 5499,
    badge: "Under ₹10k",
  },
  {
    slug: "festival-rush",
    title: "Festival Rush",
    sub: "Holi in Vrindavan, Pushkar mela, Hornbill — India at full volume.",
    image: "/images/rajasthan.jpg",
    trips: 8,
    from: 8999,
  },
  {
    slug: "island-life",
    title: "Island Life",
    sub: "Andaman blues and Lakshadweep lagoons. Certified vitamin-sea.",
    image: "/images/andaman.jpg",
    trips: 6,
    from: 26999,
  },
  {
    slug: "snow-treks",
    title: "Snow Treks",
    sub: "Kedarkantha, Brahmatal, Chopta — summit sunrises above the clouds.",
    image: "/images/snowtrek.jpg",
    trips: 9,
    from: 9499,
    badge: "Winter special",
  },
  {
    slug: "astro-nights",
    title: "Astro Nights",
    sub: "Milky-way camping with telescopes, bonfires and zero network bars.",
    image: "/images/stars.jpg",
    trips: 5,
    from: 6999,
  },
];

/* ------------------------------------------------------------------ */

export interface Vibe {
  id: string;
  label: string;
  emoji: string;
  weight: number;
}

export const vibes: Vibe[] = [
  { id: "trek", label: "Trek hard", emoji: "🥾", weight: 9 },
  { id: "chai", label: "Chai & sunsets", emoji: "☕", weight: 7 },
  { id: "photo", label: "Reels & photos", emoji: "📸", weight: 8 },
  { id: "party", label: "Bonfire parties", emoji: "🔥", weight: 6 },
  { id: "adrenaline", label: "Adrenaline junkie", emoji: "🪂", weight: 9 },
  { id: "slow", label: "Slow mornings", emoji: "🌅", weight: 5 },
  { id: "foodie", label: "Local food hunts", emoji: "🍜", weight: 7 },
  { id: "music", label: "Guitar by the lake", emoji: "🎸", weight: 6 },
];

/* ------------------------------------------------------------------ */

export interface Testimonial {
  name: string;
  meta: string;
  trip: string;
  quote: string;
  hue: number; // avatar gradient hue
}

export const testimonials: Testimonial[] = [
  {
    name: "Ananya Sharma",
    meta: "26 · Bengaluru",
    trip: "Ladakh, June batch",
    quote:
      "Went solo, came back with 14 best friends and a camera roll I still can't get over. The captains handled everything — I just showed up.",
    hue: 350,
  },
  {
    name: "Rohan Mehta",
    meta: "29 · Mumbai",
    trip: "Spiti Valley",
    quote:
      "The astro night at Kibber was unreal. Milky way, bonfire, someone playing guitar — I understood the hype in one evening.",
    hue: 25,
  },
  {
    name: "Priya Nair",
    meta: "24 · Kochi",
    trip: "Meghalaya",
    quote:
      "As a solo woman traveller I was nervous. By day two the batch felt safer than my college group. Tripwaley's captains are gold.",
    hue: 200,
  },
  {
    name: "Arjun Reddy",
    meta: "31 · Hyderabad",
    trip: "Kashmir, April batch",
    quote:
      "Zero hidden costs, hotels exactly as shown, and a WhatsApp group that still hasn't gone quiet three months later.",
    hue: 145,
  },
  {
    name: "Sneha Kulkarni",
    meta: "27 · Pune",
    trip: "Kedarkantha trek",
    quote:
      "Summit at sunrise with 18 strangers-turned-family. Cried a little. Booked Spiti for August before we even got down.",
    hue: 280,
  },
  {
    name: "Kabir Singh",
    meta: "25 · Delhi",
    trip: "Andaman",
    quote:
      "First scuba dive of my life. The trip captain literally held my hand underwater. 10/10 would panic again.",
    hue: 190,
  },
  {
    name: "Ishita Bose",
    meta: "28 · Kolkata",
    trip: "Kerala slow week",
    quote:
      "Houseboat brunch, tea-trail walks, zero rush. The one trip where my out-of-office was actually true.",
    hue: 90,
  },
  {
    name: "Dev Patel",
    meta: "23 · Ahmedabad",
    trip: "Rishikesh weekend",
    quote:
      "₹6k, one weekend, rapids + cliff jump + camping under stars. Cheaper than my Friday nights out, honestly.",
    hue: 210,
  },
];

/** Photo cards interleaved in the social wall */
export const wallPhotos = [
  { src: "/images/group-mountains.jpg", alt: "Tripwaley batch laughing in the Dolomite-style peaks of Ladakh" },
  { src: "/images/group-trek.jpg", alt: "Traveller trekking through a wildflower valley" },
  { src: "/images/traveller-street.jpg", alt: "Backpacker exploring old-town lanes" },
  { src: "/images/camp-tents.jpg", alt: "Glowing tents under a star-filled sky" },
  { src: "/images/taj.jpg", alt: "Taj Mahal at sunrise on the Golden Triangle trip" },
  { src: "/images/houseboat.jpg", alt: "Kerala houseboat cruising the backwaters" },
];

/* ------------------------------------------------------------------ */

export interface Moment {
  id: string;
  title: string;
  desc: string;
  image: string;
}

/** "Moments" expanding-panel section (adapted from a 21st.dev selector) */
export const moments: Moment[] = [
  {
    id: "bonfire",
    title: "Bonfire nights",
    desc: "Guitar, chai and 3 AM conversations",
    image: "/images/camp-tents.jpg",
  },
  {
    id: "astro",
    title: "Astro camps",
    desc: "Milky-way skies, zero network bars",
    image: "/images/stars.jpg",
  },
  {
    id: "rapids",
    title: "Rapids & cliff jumps",
    desc: "Grade III+ adrenaline on the Ganga",
    image: "/images/rishikesh.jpg",
  },
  {
    id: "backwaters",
    title: "Backwater mornings",
    desc: "Canoe breakfasts deep in Alleppey",
    image: "/images/backwater-canoe.jpg",
  },
  {
    id: "summit",
    title: "Summit sunrises",
    desc: "Earn the view at 12,500 ft",
    image: "/images/snowtrek.jpg",
  },
];

/** Photo-dump arc gallery (adapted from a 21st.dev intro animation) */
export const galleryPhotos = [
  { src: "/images/ladakh.jpg", label: "Leh–Ladakh" },
  { src: "/images/group-mountains.jpg", label: "Batch of June" },
  { src: "/images/kashmir.jpg", label: "Dal Lake" },
  { src: "/images/tent-view.jpg", label: "Wake-up call" },
  { src: "/images/kerala.jpg", label: "Alleppey" },
  { src: "/images/himalaya-sunrise.jpg", label: "Above the clouds" },
  { src: "/images/rajasthan.jpg", label: "Jaipur" },
  { src: "/images/group-trek.jpg", label: "Valley walks" },
  { src: "/images/andaman.jpg", label: "Havelock" },
  { src: "/images/traveller-street.jpg", label: "Old town" },
  { src: "/images/spiti.jpg", label: "Spiti" },
  { src: "/images/houseboat.jpg", label: "Slow south" },
  { src: "/images/meghalaya.jpg", label: "Meghalaya" },
  { src: "/images/taj.jpg", label: "Agra sunrise" },
];

/* ------------------------------------------------------------------ */

export const stats = [
  { value: 12000, suffix: "+", label: "Happy wanderers" },
  { value: 4.9, suffix: "★", label: "Avg. rating, 2,400+ reviews", decimals: 1 },
  { value: 350, suffix: "+", label: "Departures every year" },
  { value: 98, suffix: "%", label: "Would travel with us again" },
];

export const navLinks = [
  { href: "/trips", label: "Trips" },
  { href: "/group-departures", label: "Group" },
  { href: "/honeymoon", label: "Honeymoon" },
  { href: "/solo", label: "Solo" },
  { href: "/travel-with-creator", label: "Creators" },
  { href: "/destinations", label: "Destinations" },
  { href: "/stories", label: "Stories" },
  { href: "/#reviews", label: "Reviews" },
];

/** Next flagship departure the CTA-band countdown targets (IST) */
export const NEXT_DEPARTURE = {
  trip: "Leh–Ladakh · 12 Jul batch",
  iso: "2026-07-12T06:00:00+05:30",
  seatsLeft: 3,
};

export const footerLinks = {
  destinations: [
    { label: "Leh–Ladakh", href: "#destinations" },
    { label: "Spiti Valley", href: "#destinations" },
    { label: "Kashmir", href: "#destinations" },
    { label: "Meghalaya", href: "#destinations" },
    { label: "Kerala", href: "#destinations" },
    { label: "Andaman", href: "#destinations" },
  ],
  collections: [
    { label: "Himalayan Odysseys", href: "#collections" },
    { label: "Weekend Escapes", href: "#collections" },
    { label: "Festival Rush", href: "#collections" },
    { label: "Snow Treks", href: "#collections" },
    { label: "Astro Nights", href: "#collections" },
  ],
  company: [
    { label: "About us", href: "#" },
    { label: "Trip Captains", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Corporate trips", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
