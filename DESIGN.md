---
name: Tripwaley
description: Group trips across India, told like the film of your batch.
colors:
  brand: "#c91b20"
  brand-bright: "#e82028"
  brand-soft: "#ff7a7f"
  gold: "#f5a31a"
  gold-ink: "#8a5605"
  ink: "#1a1614"
  reel-black: "#0d0b09"
  coal: "#111111"
  cream: "#fffcf8"
  blush: "#fef5f0"
  ticket-paper: "#f4efe4"
  card: "#ffffff"
  line: "#eae4dd"
  success: "#1ab76a"
  success-ink: "#0f7a4a"
  trust: "#2f6fed"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.64rem"
    fontWeight: 700
    letterSpacing: "0.25em"
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6rem"
    letterSpacing: "0.1em"
  script:
    fontFamily: "Caveat, cursive"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.1
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  gutter: "20px"
  gutter-sm: "32px"
  section: "64px"
  container: "1152px"
  container-wide: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 28px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.brand-bright}"
  button-ghost-dark:
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "48px"
  button-ghost-light:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  input-dark:
    backgroundColor: "rgba(0,0,0,0.3)"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.3xl}"
    padding: "28px"
  ticket-card:
    backgroundColor: "{colors.ticket-paper}"
    rounded: "{rounded.2xl}"
    width: "304px"
  chip-status:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: Tripwaley

## Overview

**Creative North Star: "The Trip Reel"**

Tripwaley plays like the film of your batch. The homepage opens on a title card ("SCENE ON HAI", "scroll · roll · camera"), photographs cut in like footage, script captions sit over images like home-video subtitles, and the site ends on a curtain footer. Travel paperwork is the reel's props: departure boards, ticket stubs with punched holes, a receipt printer, a final boarding call. Everything is here to make a stranger picture themselves on the next batch.

The rhythm alternates: dark cinematic scenes on reel-black carry the emotion (heroes, the about story, reviews), and warm cream daylight sections carry the facts (prices, itineraries, FAQs). Type does the shouting in heavy, tight Bricolage Grotesque; body copy stays quiet in Instrument Sans. Red is the call to action and gold is the light in the dark: sun, highlights and the emphasised word of a headline.

It is dense and energetic without being a dashboard: large display type, full-bleed photography, and many small uppercase labels acting as the reel's credits and slate marks. The owner confirmed on 2026-09-28 that the current look is right; this document records it rather than redirecting it.

**Key Characteristics:**
- Film and travel-document metaphors carried by real components, not decoration
- Dark cinematic scenes alternate with cream daylight sections
- Heavy, tight display type with one word per headline picked out in brand red or gold
- Handwritten Caveat captions as the voice of the crew
- Pill-shaped actions, generous rounded cards, warm (never pure-black) shadows
- Motion is scroll-driven (GSAP + Lenis); CSS loops have reduced-motion paths, most GSAP timelines do not yet (audit 2026-09-28)

## Colors

A three-colour brand locked to the logo (red, gold, ink) over warm paper neutrals; no new hues.

### Primary
- **Chilli Red** (brand): the one call to action on any screen: "Hold your seat", the primary button, active states, the focus ring, text selection, and the emphasised word in a light-section headline.
- **Bright Chilli** (brand-bright): hover state of the red only.
- **Soft Chilli** (brand-soft): the red lifted for text on dark grounds (errors, required marks); 7.1:1 on ink, where brand-bright is only 4.0:1.

### Secondary
- **Sunrise Gold** (gold): light in the dark. Emphasised headline words, rules, badges and borders on ink or reel-black. Fails contrast as text on light grounds (2.03:1).
- **Burnt Gold** (gold-ink): the same gold darkened for text on cream (6.0:1). The only gold allowed as text on light surfaces.

### Neutral
- **Ink** (ink): body text on light grounds and the ground of dark sections.
- **Reel Black** (reel-black): the deepest cinematic ground, used for film-strip and ticket details.
- **Coal** (coal): the curtain footer.
- **Cream** (cream): page base.
- **Blush** (blush): soft warm tint that separates one daylight section from the next.
- **Ticket Paper** (ticket-paper): ground of the ticket-stub trip cards. Reel Black and Ticket Paper are not yet `@theme` tokens in `globals.css`; code uses the hex directly.
- **Card White** (card): cards, inputs and panels on cream.
- **Warm Line** (line): borders and dividers on light grounds.

### Semantic
- **Go Green** (success) / **Deep Green** (success-ink): confirmed, WhatsApp, "seats open". Deep Green is the text version on light grounds (5.3:1).
- **Trust Blue** (trust): payment and trust marks only.

### Named Rules
**The Locked Palette Rule.** Brand hues come from the logo: red, gold, ink. Do not introduce a new hue; express variety with tints of these and with photography.

**The Ink-Safe Gold Rule.** Gold and green are for fills, borders and text on dark grounds. On cream or white, text uses gold-ink or success-ink, never the originals.

**The One Red Rule.** One red call to action per viewport. When two compete, one becomes a ghost button.

**The Readable Faint Rule.** Muted text never drops below `ink/65` on light grounds (5.3:1 on every light ground in use, ticket paper included) or `white/55` on dark ones (6:1). Fainter tints are for borders, dividers and decoration only. White text never sits on the bright `success` green; use `success-ink` as the fill (5.4:1).

## Typography

**Display Font:** Bricolage Grotesque (with ui-sans-serif, system-ui)
**Body Font:** Instrument Sans (with ui-sans-serif, system-ui)
**Script Font:** Caveat (with cursive)
**Data Font:** the system monospace stack

**Character:** Bricolage at extra-bold with tight tracking is the title card: loud, warm, slightly quirky. Instrument Sans is the calm narrator. Caveat is someone from the batch scribbling on the photo, and the mono is the slate and departure-board data.

### Hierarchy
- **Display** (800, clamp to 4.5rem, 0.98): page-opening headlines. One word or phrase is coloured brand or gold.
- **Headline** (800, clamp to 3.75rem, 1.0): section headings ("How a batch works.", "The 2 AM questions.").
- **Title** (800, 1.5rem, 1.2): card titles, step names, FAQ questions.
- **Body** (400, 1rem, 1.625): descriptive copy at 60–65% ink or white opacity, capped near 36rem (max-w-xl) for reading width.
- **Label** (700, about 0.6rem, 0.25em tracking, uppercase): slate marks and credits: stat captions, eyebrows, chips. Colour at least ink/65 or white/55 (see The Readable Faint Rule).
- **Data** (mono, about 0.6rem, uppercase, wide tracking): film-strip frame numbers, departure-board rows, ticket codes.
- **Script** (Caveat, 1.5–2.25rem): a single caption line above a headline or over a photo, always lowercase and conversational.

### Named Rules
**The One Script Line Rule.** Caveat appears at most once per section, as a caption or kicker. It never carries a heading, a price or instructions.

**The Coloured Word Rule.** A headline highlights one word or phrase, never more, in brand on light grounds and gold on dark ones.

## Layout

Content sits in a centred container of 72rem (max-w-6xl), widening to 80rem (max-w-7xl) for the navbar and wide galleries, with 20px gutters on phones and 32px from the `sm` breakpoint (640px). Most layout switches happen at `sm`; the full desktop navigation appears only at `xl` (1280px), and below that the menu is a drawer. Sections breathe at about 64px vertically (py-16) and alternate cream, blush and ink/reel-black grounds rather than relying on dividers. Heroes and photo bands are full-bleed. Horizontal carousels scroll with snap for trip cards on phones.

## Elevation & Depth

Hybrid. Light sections use soft, warm-tinted shadows (never pure black) to lift cards off cream, and the card lifts further with a small upward shift on hover. Dark sections convey depth with photography, film grain and translucent white borders instead of shadows.

### Shadow Vocabulary
- **Card rest** (`0 1px 2px rgba(26,22,20,.05), 0 8px 24px -8px rgba(26,22,20,.12)`): cards at rest on cream.
- **Card lifted** (`0 2px 4px rgba(26,22,20,.06), 0 24px 48px -16px rgba(26,22,20,.22)`): hover state, modals and featured cards.
- **Red glow** (`0 8px 28px -8px rgba(201,27,32,.45)`): under the primary red button only.

### Named Rules
**The Warm Shadow Rule.** Shadows are tinted with ink (26,22,20), never neutral black, and the red glow belongs to the primary button alone.

**The Film Grain Rule.** Dark cinematic grounds may carry the `.noise` grain overlay at about 4.5% opacity; daylight sections never do.

## Shapes

Soft and friendly. Every action and chip is a full pill. Cards use large radii (24px on desktop, 16px on phones), inputs 12px. Ticket-stub cards add punched half-circle notches in reel-black along their tear line. Borders are 1px warm lines on light grounds and 10–25% white on dark grounds.

## Components

### Buttons
- **Shape:** full pill (9999px), at least 48px tall for main actions, 44px in the navbar.
- **Primary:** Chilli Red with white extra-bold text, 12px × 28px padding, red glow shadow.
- **Hover / Focus:** shifts to Bright Chilli; presses scale to 97%. Focus shows the global 2px red outline at 3px offset.
- **Ghost on dark:** transparent with a 25% white border and white text; the border and text turn gold on hover.
- **Ghost on light:** card white with a faint ink border; the border and text turn red on hover. The WhatsApp variant turns green instead.

### Chips
- **Style:** full pill, uppercase label type. Solid red for urgency ("filling fast"), 15% green tint with deep green text for "open", translucent ink with a blur over photos.
- **State:** urgency chips may carry the pulsing live dot (`.animate-live`), which stops under reduced motion.

### Cards / Containers
- **Corner Style:** 24px (rounded-3xl) on desktop, 16px on phones.
- **Background:** card white on cream; ticket paper for trip ticket-stubs.
- **Shadow Strategy:** card rest, lifted on hover (see Elevation).
- **Border:** 1px warm line.
- **Internal Padding:** 20–28px, up to 40px for feature panels.

### Inputs / Fields
- **Style:** card white, 1px warm line, 12px radius, 12px × 16px padding, 16px text so iOS does not zoom.
- **Focus:** border turns red with a 3px red halo at 12% opacity. On dark grounds, the field is 30% black with a white border that turns gold on focus.
- **Error / Disabled:** disabled buttons drop to 50% opacity.

### Navigation
- **Style:** a 72px bar over the hero, transparent over dark heroes, with the logo on the left. From `xl`, text links plus two pill actions: WhatsApp (ghost, green on hover) and "Hold your seat" (primary red). Below `xl`, a 44px round menu button opens a drawer of extra-bold display-type links over a 40% ink scrim.

### Ticket-stub trip card (signature)
A 304px ticket in ticket paper with a punched tear line, used in horizontal snap carousels. It lifts on hover. It carries the trip name, route and price from the visitor's city.

### Script caption (signature)
One Caveat line in gold or white, set above a headline or across the bottom of a photo band: "the origin story, short version", "strangers on day one. this, by day six."

## Do's and Don'ts

### Do:
- **Do** alternate dark cinematic scenes with cream daylight sections so emotion and facts take turns.
- **Do** keep one red primary action per viewport, and put it where the thumb is on phones.
- **Do** use gold-ink (#8a5605) and success-ink (#0f7a4a) for gold or green text on light grounds.
- **Do** give every looping or scroll-driven animation a `prefers-reduced-motion` path: CSS loops in `globals.css` have one; GSAP timelines need `gsap.matchMedia()` too.
- **Do** use real photographs of real batches for imagery.

### Don't:
- **Don't** add a hue outside red, gold and ink; the palette is locked to the logo.
- **Don't** use Caveat for headings, prices or instructions.
- **Don't** use pure-black shadows or put the red glow on anything but the primary button.
- **Don't** use bounce or elastic easing; the house curve is `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Don't** set gold (#f5a31a) or green (#1ab76a) as text on cream or white.
- **Don't** set text fainter than ink/65 on light grounds or white/55 on dark grounds.
- **Don't** hide content with GSAP `autoAlpha` (visibility:hidden) when it holds headings, links or buttons; animate `opacity` so it stays reachable, and give every GSAP timeline a reduced-motion branch.
