#!/usr/bin/env python3
"""
Tripwaley inventory importer.

Reads the operations xlsx (Package Itinerary / Pricing / Date invetory) and
emits src/data/catalog.json — the normalized snapshot the site renders from.
The JSON shape mirrors the future Postgres schema 1:1, so when the admin
panel lands, only the storage layer changes, not the site.

Usage: python3 scripts/import_inventory.py "/path/to/Tripwaley inventory sheet.xlsx"
"""

import json
import re
import sys
import unicodedata
from datetime import datetime, date
from pathlib import Path

import openpyxl

SHEET = sys.argv[1] if len(sys.argv) > 1 else "/Users/apple/Downloads/Tripwaley inventory sheet (1).xlsx"
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "catalog.json"

# ---------------------------------------------------------------- utilities

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s

def norm_key(s: str) -> str:
    """loose key for fuzzy package-name matching across sheets"""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def token_set(s: str) -> frozenset:
    stop = {"the", "of", "and", "a", "circuit", "tour", "package"}
    toks = re.findall(r"[a-z]+", (s or "").lower())
    # collapse common misspellings so 'medow/medows/meadows' & 'flowes/flower' meet
    toks = [re.sub(r"s$", "", t) for t in toks]
    return frozenset(t for t in toks if t not in stop and len(t) > 2)

def find_package(name: str):
    """exact key, then token-set equality, then subset/superset match"""
    k = norm_key(name)
    if k in packages:
        return packages[k]
    ts = token_set(name)
    if not ts:
        return None
    best = None
    for p in packages.values():
        pts = token_set(p["name"])
        if pts == ts:
            return p
        if ts <= pts or pts <= ts:
            overlap = len(ts & pts)
            if best is None or overlap > best[0]:
                best = (overlap, p)
    return best[1] if best and best[0] >= 2 else None

def make_stub(name: str, tag: str):
    p = {
        "code": f"TRWLY-{tag}{len(packages)+1:02d}", "slug": slugify(name), "name": name,
        "destination": "", "summaryFromDelhi": "", "type": "Group Departure",
        "departureHubs": "", "transport": "", "route": "", "inclusions": [],
        "exclusions": [], "addons": [], "itinerary": [], "nights": 0,
        "bestTime": "", "trekOptions": [], "travelTips": [], "thingsToCarry": [],
        "socialProof": "", "scarcityNote": "", "cityDetails": {},
    }
    packages[norm_key(name)] = p
    return p

def clean(s):
    if s is None:
        return ""
    return str(s).replace(" ", " ").strip()

def split_lines(s: str) -> list[str]:
    """bullet-ish text -> list of clean items"""
    out = []
    for raw in re.split(r"[\n\r]+", clean(s)):
        item = raw.strip().lstrip("-*•").strip()
        if item:
            out.append(item)
    return out

def parse_days(s: str):
    """'Day 1: ... Day 2: ...' -> [{day, title, body}]"""
    text = clean(s)
    if not text:
        return []
    parts = re.split(r"(?i)(?=day\s*\d+\s*[:\-–])", text)
    days = []
    for part in parts:
        m = re.match(r"(?i)day\s*(\d+)\s*[:\-–]\s*(.*)", part.strip(), re.S)
        if not m:
            continue
        body = m.group(2).strip()
        first, *rest = re.split(r"[\n\r]+", body, maxsplit=1)
        days.append({
            "day": int(m.group(1)),
            "title": first.strip().rstrip(".")[:120],
            "body": (rest[0].strip() if rest else ""),
        })
    return days

def parse_price_cell(s: str):
    """'Triple-   7000 Double- 8000' -> {'triple': 7000, 'double': 8000}"""
    text = clean(s).lower().replace(",", "")
    if not text:
        return None
    out = {}
    for occ in ("triple", "double", "quad"):
        m = re.search(occ + r"\s*[-:–]?\s*(\d{3,6})", text)
        if m:
            out[occ] = int(m.group(1))
    return out or None

def parse_addons(s: str):
    """'River Rafting (₹1500)\n- Paragliding (₹2500)' -> [{name, price}]"""
    out = []
    for item in split_lines(s):
        m = re.match(r"(.*?)\s*\(?\s*₹\s*([\d,]+)(?:\s*[-–]\s*₹?\s*([\d,]+))?\s*\)?\s*$", item)
        if m:
            name = m.group(1).strip().rstrip(":-–")
            lo = int(m.group(2).replace(",", ""))
            hi = int(m.group(3).replace(",", "")) if m.group(3) else None
            out.append({"name": name, "price": lo, "priceMax": hi})
        elif item:
            out.append({"name": item, "price": None, "priceMax": None})
    return out

# ---------------------------------------------------------------- city master

CITY_GEO = {
    "delhi":      {"name": "Delhi",     "state": "Delhi",         "lat": 28.6139, "lng": 77.2090},
    "jaipur":     {"name": "Jaipur",    "state": "Rajasthan",     "lat": 26.9124, "lng": 75.7873},
    "moradabad":  {"name": "Moradabad", "state": "Uttar Pradesh", "lat": 28.8386, "lng": 78.7733},
    "agra":       {"name": "Agra",      "state": "Uttar Pradesh", "lat": 27.1767, "lng": 78.0081},
    "ranchi":     {"name": "Ranchi",    "state": "Jharkhand",     "lat": 23.3441, "lng": 85.3096},
    "patna":      {"name": "Patna",     "state": "Bihar",         "lat": 25.5941, "lng": 85.1376},
    "ayodhya":    {"name": "Ayodhya",   "state": "Uttar Pradesh", "lat": 26.7922, "lng": 82.1998},
    "banaras":    {"name": "Varanasi",  "state": "Uttar Pradesh", "lat": 25.3176, "lng": 82.9739},
    "kochi":      {"name": "Kochi",     "state": "Kerala",        "lat": 9.9312,  "lng": 76.2673},
    "dehradun":   {"name": "Dehradun",  "state": "Uttarakhand",   "lat": 30.3165, "lng": 78.0322},
    "gwalior":    {"name": "Gwalior",   "state": "Madhya Pradesh","lat": 26.2183, "lng": 78.1828},
    "udaipur":    {"name": "Udaipur",   "state": "Rajasthan",     "lat": 24.5854, "lng": 73.7125},
    "varanasi":   {"name": "Varanasi",  "state": "Uttar Pradesh", "lat": 25.3176, "lng": 82.9739},
    "chandigarh": {"name": "Chandigarh","state": "Chandigarh",    "lat": 30.7333, "lng": 76.7794},
    "haridwar":   {"name": "Haridwar",  "state": "Uttarakhand",   "lat": 29.9457, "lng": 78.1642},
}
# sheet spellings -> canonical slug
CITY_ALIAS = {
    "banaras": "banaras", "varanasi": "banaras", "ayodhaya": "ayodhya", "ayodhya": "ayodhya",
    "delhi": "delhi", "jaipur": "jaipur", "moradabad": "moradabad", "agra": "agra",
    "ranchi": "ranchi", "patna": "patna", "kochi": "kochi", "dehradun": "dehradun",
    "gwalior": "gwalior", "udaipur": "udaipur", "chandigarh": "chandigarh", "haridwar": "haridwar",
}

def city_slug(raw: str):
    k = norm_key(raw)
    return CITY_ALIAS.get(k)

# ---------------------------------------------------------------- load sheets

wb = openpyxl.load_workbook(SHEET, data_only=True)
warnings: list[str] = []

# ---- Package Itinerary --------------------------------------------------
pi = wb["Package Itinerary"]
header = [clean(c.value) for c in pi[1]]

def col(name_frag: str):
    for i, h in enumerate(header):
        if name_frag.lower() in h.lower():
            return i
    return None

C = {k: col(k) for k in [
    "Package Name", "Destination", "Package Type", "Departure City", "Transport Mode",
    "Destinations Covered", "Inclusions", "Exclusions", "Add ons", "Itinerary Brief",
    "Detailed Itinerary", "Best time", "Trek Options", "Travel Tips", "Things to Carry",
    "Social Proof", "Scarcity",
]}
city_detail_cols = {h.replace("Details from", "").strip(): i for i, h in enumerate(header) if h.lower().startswith("details from")}

packages = {}
for row in pi.iter_rows(min_row=2, values_only=True):
    code = clean(row[0])
    name = clean(row[C["Package Name"]]) if C["Package Name"] is not None else ""
    if not name:
        continue
    slug = slugify(name)
    detailed = parse_days(row[C["Detailed Itinerary"]]) if C["Detailed Itinerary"] is not None else []
    brief = parse_days(row[C["Itinerary Brief"]]) if C["Itinerary Brief"] is not None else []
    itinerary = detailed if len(detailed) >= len(brief) else brief
    nights = max((d["day"] for d in itinerary), default=0)
    city_details = {}
    for cname, idx in city_detail_cols.items():
        v = clean(row[idx]) if idx < len(row) else ""
        cslug = city_slug(cname)
        if v and cslug:
            city_details[cslug] = v

    packages[norm_key(name)] = {
        "code": code or f"TRWLY-X{len(packages)+1:02d}",
        "slug": slug,
        "name": name,
        "destination": clean(row[C["Destination"]]) if C["Destination"] is not None else "",
        "summaryFromDelhi": city_details.get("delhi", ""),
        "type": clean(row[C["Package Type"]]) if C["Package Type"] is not None else "Group Departure",
        "departureHubs": clean(row[C["Departure City"]]) if C["Departure City"] is not None else "",
        "transport": clean(row[C["Transport Mode"]]) if C["Transport Mode"] is not None else "",
        "route": clean(row[C["Destinations Covered"]]) if C["Destinations Covered"] is not None else "",
        "inclusions": split_lines(row[C["Inclusions"]]) if C["Inclusions"] is not None else [],
        "exclusions": split_lines(row[C["Exclusions"]]) if C["Exclusions"] is not None else [],
        "addons": parse_addons(row[C["Add ons"]]) if C["Add ons"] is not None else [],
        "itinerary": itinerary,
        "nights": nights,
        "bestTime": clean(row[C["Best time"]]) if C["Best time"] is not None else "",
        "trekOptions": split_lines(row[C["Trek Options"]]) if C["Trek Options"] is not None else [],
        "travelTips": split_lines(row[C["Travel Tips"]]) if C["Travel Tips"] is not None else [],
        "thingsToCarry": split_lines(row[C["Things to Carry"]]) if C["Things to Carry"] is not None else [],
        "socialProof": clean(row[C["Social Proof"]]) if C["Social Proof"] is not None else "",
        "scarcityNote": clean(row[C["Scarcity"]]) if C["Scarcity"] is not None else "",
        "cityDetails": city_details,
    }

# ---- Pricing ------------------------------------------------------------
pr = wb["Pricing"]
price_pkg_names = [clean(c.value) for c in pr[1]][1:]
prices = []
priced_cities = set()
for row in pr.iter_rows(min_row=4, values_only=True):
    craw = clean(row[0])
    if not craw:
        continue
    cslug = city_slug(craw)
    if not cslug:
        warnings.append(f"pricing: unknown city '{craw}'")
        continue
    priced_cities.add(cslug)
    for j, pname in enumerate(price_pkg_names):
        if not pname:
            continue
        cell = row[j + 1] if j + 1 < len(row) else None
        parsed = parse_price_cell(cell)
        if not parsed:
            continue
        pkg = find_package(pname)
        if not pkg:
            warnings.append(f"pricing: package '{pname}' not in itinerary sheet — stub created")
            pkg = make_stub(pname, "P")
        prices.append({"packageSlug": pkg["slug"], "citySlug": cslug, **parsed})

# ---- Date invetory ------------------------------------------------------
di = wb["Date invetory"]
date_pkg_names = [clean(c.value) for c in di[1]][1:]
departures = []
for row in di.iter_rows(min_row=4, values_only=True):
    d = row[0]
    if d is None:
        continue
    if isinstance(d, datetime):
        iso = d.date().isoformat()
    elif isinstance(d, date):
        iso = d.isoformat()
    else:
        continue
    for j, pname in enumerate(date_pkg_names):
        if not pname:
            continue
        cell = clean(row[j + 1] if j + 1 < len(row) else "")
        if not cell or cell.upper() == "NONE":
            continue
        pkg = find_package(pname)
        if not pkg:
            warnings.append(f"dates: package '{pname}' has no itinerary/pricing — stub created")
            pkg = make_stub(pname, "D")
        slugs = []
        for part in cell.split(","):
            cs = city_slug(part)
            if cs:
                slugs.append(cs)
            elif part.strip():
                warnings.append(f"dates: unknown city '{part.strip()}' on {iso}")
        if slugs:
            departures.append({"date": iso, "packageSlug": pkg["slug"], "citySlugs": sorted(set(slugs))})

# ---- assemble -----------------------------------------------------------
pkg_list = sorted(packages.values(), key=lambda p: p["code"])
priced_slugs = {p["packageSlug"] for p in prices}
dated_slugs = {d["packageSlug"] for d in departures}
for p in pkg_list:
    # live = sellable (has a price); rich = has full day-by-day content
    p["status"] = "live" if p["slug"] in priced_slugs else "draft"
    p["rich"] = bool(p["itinerary"])
    p["hasDepartures"] = p["slug"] in dated_slugs

used_cities = priced_cities | {c for d in departures for c in d["citySlugs"]}
cities = []
for cslug in sorted(used_cities):
    geo = CITY_GEO[cslug]
    cities.append({"slug": cslug, **geo, "priced": cslug in priced_cities})

catalog = {
    "settings": {
        "brand": "Tripwaley",
        "whatsapp": "+919625330270",
        "whatsappLink": "https://wa.me/919625330270",
        "defaultCity": "delhi",
        "advancePercent": 40,
        "refundPolicy": "Free cancellation until 7 days before departure.",
        "instagram": "https://instagram.com/tripwaley",
        "announcement": "Monsoon batches are live — every departure guaranteed.",
    },
    "cities": cities,
    "packages": pkg_list,
    "prices": prices,
    "departures": sorted(departures, key=lambda d: d["date"]),
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=1))

live = sum(1 for p in pkg_list if p["status"] == "live")
print(f"catalog.json written → {OUT}")
print(f"  packages: {len(pkg_list)} ({live} live, {len(pkg_list)-live} draft)")
print(f"  cities:   {len(cities)} ({len(priced_cities)} priced)")
print(f"  prices:   {len(prices)} rules · departures: {len(departures)}")
for w in warnings[:12]:
    print("  ⚠", w)
if len(warnings) > 12:
    print(f"  … +{len(warnings)-12} more warnings")
