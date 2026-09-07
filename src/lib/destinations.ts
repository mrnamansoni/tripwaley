/**
 * The destination taxonomy — one entry per place we can build a landing page for.
 *
 * WHY THIS EXISTS. /destinations grouped packages with a hardcoded array of
 * regexes matched against `name + destination + route` CONCATENATED,
 * first-match-wins, and the groups were anchors (#himachal) on a single page.
 * Two problems followed:
 *
 *   1. Anything the array didn't list was invisible. Kerala, Andaman and both
 *      Meghalaya trips matched no region and appeared nowhere on /destinations.
 *   2. The site had no page built to answer "spiti valley tour package" or
 *      "kashmir tour package" — the highest-volume commercial queries in Indian
 *      travel. Only product-level trip pages existed, which are long-tail.
 *
 * Matching is by SPECIFICITY, not array order — the same fix geo.ts needed for
 * the same reason. `destination` is the field the owner fills in to say where a
 * trip goes; `route` is a rambling list of stops and is consulted last. A trip
 * whose destination is Manali but whose route mentions Kasol belongs to Manali.
 *
 * The editorial fields (bestTime, gettingThere, know) are deliberately factual
 * and short. They are the part a listing page cannot generate, and they are why
 * these pages are worth indexing at all — everything else here is assembled
 * from the live catalog, so prices, dates and trips can never go stale.
 *
 * Pure and importless, so scripts/test-destinations.mjs can exercise it.
 */

export interface Destination {
  slug: string;
  /** how people search for it */
  name: string;
  state: string;
  /** one line under the h1 */
  tagline: string;
  /** matched against a package's own destination field, then name, then route */
  match: RegExp;
  image: string;
  /** the honest season answer, not "all year round" */
  bestTime: string;
  /** two or three sentences on reaching the start point */
  gettingThere: string;
  /** the thing people get wrong, said plainly */
  know: string;
  /** 40-60 words that a listing page could never produce */
  intro: string;
}

export const DESTINATIONS: Destination[] = [
  {
    slug: "spiti",
    name: "Spiti Valley",
    state: "Himachal Pradesh",
    tagline: "a cold desert at 4,000m, and the quietest road in India",
    match: /spiti|kaza|chandratal|kibber|langza|hikkim|tabo|dhankar/i,
    image: "/images/spiti.jpg",
    bestTime:
      "June to September, when both the Manali and Shimla approaches are open. The Manali side closes with the first heavy snow — usually October — and Spiti is then reachable only via Kinnaur, which adds two days.",
    gettingThere:
      "Nearest airport is Bhuntar (Kullu), about 250km from Kaza; nearest railhead is Shimla or Chandigarh. Almost everyone arrives by road. Our batches board in Delhi and take the Shimla–Kinnaur side up, which gains altitude gradually rather than dropping you at 4,000m on day two.",
    know:
      "Spiti is high enough that altitude decides how much you enjoy it. Every route we run has an acclimatisation night built in before Kaza, and it is not padding — day three is when people who rushed start feeling it.",
    intro:
      "Spiti is a cold desert on the Tibetan plateau, reached through gorges that take a full day to drive. Monasteries here predate most European cathedrals, the villages sit above 4,000m, and Chandratal is dark enough that the Milky Way casts a shadow. It is not a weekend trip and it does not pretend to be.",
  },
  {
    slug: "kasol-parvati-valley",
    name: "Kasol & Parvati Valley",
    state: "Himachal Pradesh",
    tagline: "riverside cafés, a hot spring at 3,000m, and a two-day trek",
    match: /kasol|kheerganga|parvati|tosh|manikaran|malana/i,
    image: "/images/tw-g-kasol-huts.jpg",
    bestTime:
      "March to June and September to November. Monsoon brings landslides to the Parvati road, and the Kheerganga trek is genuinely unpleasant in heavy rain.",
    gettingThere:
      "Overnight bus from Delhi to Bhuntar, then an hour up the valley to Kasol. Our batches run the Delhi leg overnight so day one is spent in the valley rather than on the highway.",
    know:
      "Kheerganga is a 12km round trip climbing about 1,100m. It is walkable by anyone reasonably fit, but it is a trek and not a stroll — the hot spring at the top is the reward, and it is worth it.",
    intro:
      "The Parvati valley runs off the Kullu highway and changes character every few kilometres: Kasol's café strip, the gurudwara and hot springs at Manikaran, the pine slope above Tosh, and Kheerganga at the head of it. It is the most-visited valley in Himachal for good reason, and the easiest Himalayan trip to do on a long weekend.",
  },
  {
    slug: "manali",
    name: "Manali",
    state: "Himachal Pradesh",
    tagline: "the town everything else in Himachal is measured from",
    match: /manali|solang|hadimba|vashisht|old manali|sissu|atal tunnel/i,
    image: "/images/tw-manali-night.jpg",
    bestTime:
      "October to February for snow, March to June for the passes and the valley in flower. Manali itself is open all year; what changes is whether Rohtang and the Atal Tunnel are letting you go further north.",
    gettingThere:
      "Overnight from Delhi by road — around 12 hours. Bhuntar airport is 50km south. Our Delhi batches travel overnight in a Volvo or Tempo Traveller so you wake up in the valley.",
    know:
      "Old Manali and Mall Road are two different holidays. If you want cafés, pine and quiet, ask to be based in Old Manali or Vashisht rather than the main bazaar.",
    intro:
      "Manali is the junction every Himachal route passes through: south to Kullu and the Parvati valley, north through the Atal Tunnel to Lahaul and Spiti, east to Jispa and the Ladakh road. It works as a destination in its own right for a long weekend, and as the staging post for everything above it.",
  },
  {
    slug: "jibhi-tirthan-valley",
    name: "Jibhi & Tirthan Valley",
    state: "Himachal Pradesh",
    tagline: "wooden houses, trout streams, and no phone signal worth speaking of",
    match: /jibhi|tirthan|shoja|sojha|raghupur|jalori|serolsar|banjar/i,
    image: "/images/tw-hero-deodar.jpg",
    bestTime:
      "March to June and September to November. Jalori Pass — the way to Raghupur Fort and Serolsar Lake — closes under snow in deep winter, though Jibhi itself stays reachable and is beautiful in it.",
    gettingThere:
      "About 10 hours from Delhi by road via Mandi and Aut. Jibhi sits off the main Kullu highway, which is precisely why it stays quiet.",
    know:
      "Raghupur Fort is a short, steep walk from Jalori Pass — roughly 3km each way — and the fort itself is mostly ruined. The meadow at the top is the actual reason to go.",
    intro:
      "The Tirthan valley was kept quiet by an accident of geography: it is off the Kullu highway, and the Great Himalayan National Park at its head blocks any road going further. What is left is old wooden architecture, a trout river, and slopes of deodar with almost nothing built on them.",
  },
  {
    slug: "mcleodganj-triund",
    name: "McLeodganj & Triund",
    state: "Himachal Pradesh",
    tagline: "the Dhauladhar wall, seen from a ridge you can walk up in a morning",
    match: /mcleod|mcleodganj|triund|dharamshala|dharamkot|bhagsu|bir|billing/i,
    image: "/images/himalaya-sunrise.jpg",
    bestTime:
      "March to June and September to December. Triund in monsoon is slippery and usually cloud-covered; the Dhauladhar view is the whole point and you will not get it.",
    gettingThere:
      "Overnight bus from Delhi — about 11 hours to McLeodganj. Gaggal airport is 20km away with flights from Delhi.",
    know:
      "Triund is a 9km round trip and gains about 1,100m. Most people manage it comfortably in a day; camping at the top is what turns it from a walk into a trip.",
    intro:
      "McLeodganj sits below the Dhauladhar range with the Tibetan government-in-exile at its centre, which gives the town a character no other Himachali hill station has. Triund is the ridge directly above it — one of the few Himalayan viewpoints reachable in a single morning's walk from a café.",
  },
  {
    slug: "kedarkantha",
    name: "Kedarkantha",
    state: "Uttarakhand",
    tagline: "the winter summit most people climb first",
    match: /kedarkantha|sankri|juda|govind/i,
    image: "/images/snowtrek.jpg",
    bestTime:
      "December to April. Kedarkantha is a winter trek — that is the point of it. Snow is usually reliable from late December, and the summit view is best in January and February.",
    gettingThere:
      "Dehradun is the railhead and airport; Sankri, the base village, is a 10-hour drive from there. Our batches include the Dehradun–Sankri leg both ways.",
    know:
      "The summit is 3,800m and the climb is done in the dark to reach the top at sunrise. It is a beginner's trek, but it is a real one: expect four days of walking in snow.",
    intro:
      "Kedarkantha is the trek that turns people into trekkers. Four days, a base village of wooden houses, campsites in snow-covered clearings, and a summit push before dawn that ends with the Swargarohini massif turning orange in front of you. It asks for fitness rather than experience.",
  },
  {
    slug: "chopta-tungnath",
    name: "Chopta & Tungnath",
    state: "Uttarakhand",
    tagline: "the highest Shiva temple in the world, an hour above a meadow",
    match: /chopta|tungnath|deoria|chandrashila|ukhimath/i,
    image: "/images/tw-snowfield.jpg",
    bestTime:
      "March to June and September to November for clear Himalayan views. December to February if you want it under snow, which is when the Chandrashila summit is at its best and the walk is at its hardest.",
    gettingThere:
      "Haridwar or Rishikesh is the railhead; Chopta is around 8 hours further by road. Dehradun is the nearest airport.",
    know:
      "Tungnath is 3.5km uphill from Chopta on a paved path, and Chandrashila is another 1.5km of proper climbing above it. Plenty of people stop at the temple, and that is a perfectly good day.",
    intro:
      "Chopta is a meadow at 2,700m surrounded by rhododendron forest, with Tungnath — the highest of the Panch Kedar temples — an hour's walk above it. Keep going for another 45 minutes and Chandrashila gives you Nanda Devi, Trishul and Chaukhamba in one sweep.",
  },
  {
    slug: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand",
    tagline: "rapids, a Ganga aarti, and the easiest weekend out of Delhi",
    match: /rishikesh|haridwar|shivpuri|neelkanth|rafting/i,
    image: "/images/tw-rafting.jpg",
    bestTime:
      "September to June. Rafting stops during the monsoon when the Ganga runs too high — usually July and August — and resumes once the water settles.",
    gettingThere:
      "Six hours from Delhi by road, or an overnight train to Haridwar and half an hour on. Dehradun airport is 35km away.",
    know:
      "The 16km Shivpuri stretch is the standard rafting run and takes about three hours. It is Grade II–III: exciting, and genuinely fine for a first-timer who can swim.",
    intro:
      "Rishikesh does two things at once and does both well: it is the whitewater capital of north India and one of its oldest pilgrimage towns. A weekend here is rafting and a cliff jump in the afternoon, then the Ganga aarti at Parmarth Niketan in the evening, and they sit together more naturally than they sound.",
  },
  {
    slug: "kashmir",
    name: "Kashmir",
    state: "Jammu & Kashmir",
    tagline: "shikaras, meadows, and the only place in India that looks like this",
    match: /kashmir|srinagar|gulmarg|pahalgam|sonmarg|shikara|dal lake|betaab/i,
    image: "/images/kashmir.jpg",
    bestTime:
      "April and May for tulips and blossom, June to August for the meadows, and December to February for snow in Gulmarg. Autumn — late October — is the quietest and, for a lot of people, the best.",
    gettingThere:
      "Fly to Srinagar; it is the only sensible way in and there are direct flights from Delhi. The road via Jammu exists but costs you a day and a half each way.",
    know:
      "A houseboat night on Dal Lake is worth doing once and is not the same as a hotel — they are old, wooden and often unheated. Ask which you are getting rather than assuming.",
    intro:
      "Kashmir is the trip people put off and then wish they had taken sooner. Srinagar and the shikaras on Dal Lake, the gondola at Gulmarg going up to 4,000m, the meadows at Pahalgam and Sonmarg, and chinar trees that turn the whole valley red in late October.",
  },
  {
    slug: "ladakh",
    name: "Ladakh",
    state: "Ladakh",
    tagline: "Leh, Nubra and Pangong, at the top of the country",
    match: /ladakh|leh|nubra|pangong|khardung|chang la|hunder|diskit/i,
    image: "/images/ladakh.jpg",
    bestTime:
      "June to September. The Manali and Srinagar roads open around late May and close with the first snow in October; flights to Leh run all year but the passes to Nubra and Pangong do not.",
    gettingThere:
      "Fly into Leh, or drive the Manali–Leh or Srinagar–Leh highway if you want the road to be part of the trip. Flying means you arrive at 3,500m in an hour, which is exactly why the first day is a rest day.",
    know:
      "Altitude is the whole planning problem in Ladakh. Two nights in Leh before going anywhere higher is not optional — Khardung La is 5,300m, and people who skip the acclimatisation spend it in the car with a headache.",
    intro:
      "Ladakh is a high-altitude desert between the Karakoram and the Himalaya, and it looks like nowhere else in India: bare rock in a dozen colours, monasteries on ridgelines, and a lake at Pangong that changes colour through the day. The route matters more here than anywhere else, because altitude decides how much of it you actually enjoy.",
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    state: "Rajasthan",
    tagline: "lake palaces, fort walls and a thali you will remember",
    match: /rajasthan|udaipur|jodhpur|jaisalmer|mount abu|kumbhalgarh|chittorgarh|pushkar/i,
    image: "/images/rajasthan.jpg",
    bestTime:
      "October to March. Rajasthan in May and June regularly passes 45°C, which is not a holiday — the season is genuinely closed in high summer for a reason.",
    gettingThere:
      "Udaipur and Jodhpur both have airports with direct Delhi flights, and the overnight trains from Delhi are comfortable and cheap. Most of our Rajasthan batches board in Delhi.",
    know:
      "Udaipur rewards slowing down more than most Indian cities. Two nights is the minimum that makes the lake, the City Palace and a sunset from Bahubali Hill fit without rushing.",
    intro:
      "Rajasthan is the India that people picture before they arrive: Udaipur's lake palaces, the walls at Kumbhalgarh running for 36km, Jodhpur's blue city under Mehrangarh, and food that is better than its reputation. It is also the easiest big trip in the country to do in winter, when everywhere north is closed.",
  },
  {
    slug: "goa",
    name: "Goa",
    state: "Goa",
    tagline: "the classic, done without the package-tour bit",
    match: /goa|anjuna|baga|palolem|arambol|dudhsagar|panjim/i,
    image: "/images/andaman.jpg",
    bestTime:
      "November to February is peak — dry, warm and busy. October and March are quieter and just as good. The monsoon closes most beach shacks but turns Dudhsagar into something worth the trip on its own.",
    gettingThere:
      "Fly to Goa (both Dabolim and Mopa), or take the Konkan railway down the coast, which is one of the best train journeys in India. Our batches from Delhi run the flight-plus-transfers version.",
    know:
      "North and South Goa are different holidays. North is Anjuna, Baga and the night markets; South is Palolem and Agonda and considerably quieter. Decide which one you actually want before booking.",
    intro:
      "Goa works because it is not one thing: Portuguese churches and Panjim's Latin quarter, the north-coast beach clubs, the quiet south, and Dudhsagar falls inland. Done as a group departure it skips the two parts that go wrong on your own — the transfers, and picking the wrong coast.",
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    state: "Meghalaya",
    tagline: "living root bridges, the cleanest village in Asia, and a lot of rain",
    match: /meghalaya|shillong|cherrapunji|sohra|dawki|mawlynnong|nongriat|laitlum/i,
    image: "/images/tw-waterfall-banner.jpg",
    bestTime:
      "October to April. Meghalaya is the wettest place on earth and the monsoon is not a figure of speech — from June to September the waterfalls are extraordinary and everything else is difficult.",
    gettingThere:
      "Fly to Guwahati, then about three hours by road to Shillong. Guwahati is the transport hub for the whole north-east and has direct flights from Delhi, Kolkata and Bangalore.",
    know:
      "The double-decker root bridge at Nongriat is 3,000 steps down and 3,000 back up. It is the highlight of the state and it is a hard day — going down is not the problem.",
    intro:
      "Meghalaya is built by water: root bridges that villagers grow across rivers over decades, Dawki where the boats appear to float on air, and the Cherrapunji plateau where the cliffs drop straight into Bangladesh. The rain that makes it awkward to visit is the same rain that made all of it.",
  },
  {
    slug: "kerala",
    name: "Kerala",
    state: "Kerala",
    tagline: "tea hills, backwaters and a houseboat that goes nowhere in particular",
    match: /kerala|munnar|alleppey|alappuzha|thekkady|backwater|kumarakom|kochi|periyar/i,
    image: "/images/tw-waterfall-banner.jpg",
    bestTime:
      "September to March. The monsoon is dramatic and green but the backwaters and hill roads are both harder work; April and May get uncomfortably humid at sea level.",
    gettingThere:
      "Fly to Kochi — it is the natural start for the Munnar–Thekkady–Alleppey loop and has direct flights from most Indian metros.",
    know:
      "One night on a houseboat is the right amount. Two is a lot of the same canal, and the good operators moor up by evening anyway.",
    intro:
      "Kerala's standard loop earns its reputation: tea slopes at Munnar, the Periyar reserve at Thekkady, and a houseboat night on the Alleppey backwaters. It is the gentlest big trip in India — short drives, no altitude, and food that is a genuine reason to go.",
  },
  {
    slug: "andaman",
    name: "Andaman Islands",
    state: "Andaman & Nicobar",
    tagline: "the clearest water in India, six hours from the mainland",
    match: /andaman|havelock|neil island|port blair|radhanagar|swaraj|shaheed/i,
    image: "/images/andaman.jpg",
    bestTime:
      "October to May. The monsoon between June and September makes the inter-island ferries unreliable, which matters more than the rain does.",
    gettingThere:
      "Fly to Port Blair from Chennai, Kolkata or Delhi, then ferries to Havelock and Neil. The ferry legs are the part worth booking in advance.",
    know:
      "Build a buffer day before your flight home. Ferries get cancelled for weather, and being stuck on Havelock is only a good story if you are not missing a flight.",
    intro:
      "The Andamans are closer to Myanmar than to mainland India, and the water shows it. Radhanagar on Havelock is regularly called the best beach in Asia, the diving and snorkelling are the best in the country, and Port Blair's Cellular Jail is a genuinely sobering half-day.",
  },
  {
    slug: "shimla",
    name: "Shimla",
    state: "Himachal Pradesh",
    tagline: "the summer capital, and the ridge it was built along",
    match: /shimla|kufri|mashobra|chail|narkanda|jakhoo|kalka/i,
    image: "/images/himalaya-sunrise.jpg",
    bestTime:
      "March to June and September to December. Shimla gets snow in late December and January, which is when it is busiest — book earlier than feels necessary if that is what you are coming for.",
    gettingThere:
      "Around eight hours from Delhi by road, or the Kalka–Shimla toy train, which is a UNESCO World Heritage line and takes five hours to cover 96km. The train is the better story.",
    know:
      "Mall Road and the Ridge are pedestrian-only, and most hotels are a steep walk from wherever a vehicle can drop you. Pack accordingly — this catches people out every single time.",
    intro:
      "Shimla was built by the British as somewhere to escape the Delhi summer, and the bones of that are still the appeal: colonial architecture along a ridge at 2,200m, the toy train up from Kalka, and Kufri and Mashobra a short drive out for the snow and the deodar.",
  },
  {
    slug: "valley-of-flowers",
    name: "Valley of Flowers",
    state: "Uttarakhand",
    tagline: "a UNESCO meadow that is only open for ten weeks",
    match: /valley of flowers|flower medows|flower meadows|ghangaria|hemkund|govindghat/i,
    image: "/images/tw-snowfield.jpg",
    bestTime:
      "July to early September, and nothing else. The valley is under snow the rest of the year and the park is closed — mid-July to mid-August is peak bloom, which is the only reason to accept trekking in the monsoon.",
    gettingThere:
      "Rishikesh or Haridwar is the railhead, then a long drive to Govindghat. From there it is a 13km walk to Ghangaria, the base village, and another 4km into the valley itself.",
    know:
      "This is the one trip where the season cannot be moved. The park opens on 1 June and closes on 4 October, and the flowers are only worth the walk for about six weeks in the middle of that.",
    intro:
      "The Valley of Flowers is a UNESCO World Heritage site at 3,600m that spends most of the year under snow and then, for a few weeks in monsoon, turns into a meadow with over 500 flowering species in it. Hemkund Sahib sits above it at 4,600m, which makes this both a trek and a pilgrimage route.",
  },
  {
    slug: "lansdowne",
    name: "Lansdowne",
    state: "Uttarakhand",
    tagline: "a cantonment town that never got loud",
    match: /lansdowne|tarkeshwar|bhulla/i,
    image: "/images/tw-hero-deodar.jpg",
    bestTime:
      "All year. Winter is cold and clear with occasional snow, summer is a straightforward escape from the plains, and the monsoon is green and quiet.",
    gettingThere:
      "About six hours from Delhi by road — one of the closest genuine hill stations to the city. Kotdwar is the railhead, 40km below.",
    know:
      "Lansdowne is run by the Garhwal Rifles and stays deliberately undeveloped: no nightlife, few shops, early closing. That is the reason to come, not a shortcoming.",
    intro:
      "Lansdowne is an army cantonment from 1887 that was never allowed to sprawl, which makes it the quietest hill station within a day of Delhi. Oak and pine, a small lake, Tarkeshwar Mahadev in deodar forest an hour away, and almost nothing else to do — which is the point.",
  },
];

/** the field-by-field matcher: destination, then name, then the rambling route */
export function destinationsFor(pkg: { name?: string; destination?: string; route?: string }): Destination[] {
  const hit = (haystack: string | undefined) => {
    const s = (haystack ?? "").trim();
    return s ? DESTINATIONS.filter((d) => d.match.test(s)) : [];
  };
  // A trip genuinely can belong to two destinations (Kedarnath–Chopta), so this
  // returns all matches at the most specific level that matched anything.
  const byDestination = hit(pkg.destination);
  if (byDestination.length) return byDestination;
  const byName = hit(pkg.name);
  if (byName.length) return byName;
  return hit(pkg.route);
}

export const getDestination = (slug: string): Destination | undefined =>
  DESTINATIONS.find((d) => d.slug === slug);
