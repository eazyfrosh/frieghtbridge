# FreightBridge

**Move Freight. Build Connections.**

A production-quality marketing site for FreightBridge, a modern freight and logistics
company. Built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and
Lucide icons.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (next/core-web-vitals)
npm run typecheck  # tsc --noEmit
```

## Project structure

```
app/
  layout.tsx                    root layout, fonts, metadata, JSON-LD
  page.tsx                      home page composition
  globals.css                   design tokens, component classes, reduced-motion rules
  tracking/                     shipment tracking (accepts ?number=FBX-...)
  quote/                        freight quote request
  services/                     services + solutions by industry
  about/                        company, timeline, careers, partners
  contact/                      contact channels + message form
  resources/faq/                grouped FAQ accordion
  resources/shipping-guide/     practical shipping guidance
  legal/{privacy,terms,cookies} sample legal copy
  not-found.tsx, sitemap.ts, robots.ts
components/
  Navbar, Hero, TrackingWidget, Services, WhyFreightBridge, HowItWorks,
  QuoteForm, GlobalNetwork, EnterpriseSection, TechnologySection,
  Testimonials, CTA, Footer, PageHero, ContactForm, Accordion, LegalArticle,
  ShowcaseCarousel, NetworkStory
  ui/                           Button, Field, Figure, Logo, Reveal,
                                SectionHeading, VideoFrame
lib/
  tracking.ts                   mock shipment data + lookup API surface
  site.ts                       nav, services, footer and coverage-region data
  motion.ts                     shared Framer Motion variants
  utils.ts                      class joiner + date/time formatting
public/images/                  original SVG freight illustrations
```

## Prototype behaviour

This is a front-end prototype: there is no backend.

- **Tracking** resolves against fixtures in `lib/tracking.ts` after a simulated
  round trip, so real loading / not-found / error states are exercised. Demo
  numbers: `FBX-28473921` (in transit), `FBX-90112845` (out for delivery),
  `FBX-55620174` (delivered), `FBX-73004466` (delayed). Replacing
  `lookupShipment` with a `fetch` is the only change the UI needs.
- **Quote and contact forms** validate fully client-side and show a success
  state; nothing is transmitted. The quote form lives at `/quote`; the home
  page links to it rather than embedding it.
- **Statistics and dashboard figures** are demonstration values, labelled as
  such on the page.

## Design system

Tokens live in `tailwind.config.ts`:

The scheme is **bright orange and white**. Surfaces are white or near-white,
the feature bands are full-bleed `brand-500`, and the greys are untinted so
nothing reads as a third colour.

- `ink` — true neutral grey. Carries all body text on white, and supplies the
  near-black accent used *on* the orange bands. `ink-400` is the lightest step
  used for body text on white and clears 4.5:1
- `brand` — primary orange. `brand-500` (`#FF6A00`) is the band and button
  colour; `brand-700` (`#C24500`) is the step used for orange text and orange
  fills that sit on white
- `signal` — warm gold, kept as a sparing accent (a gradient hairline, one
  icon) rather than a band colour

Copy on the bands is **white**, with `ink-950` reserved for the accent words
inside display headings (`.text-gradient`) — near-black on bright orange is
6.52:1, the strongest pairing that surface offers, and the two-tone headline is
what carries the emphasis.

**Known contrast gap:** white on `brand-500` measures 2.87:1, below the 4.5:1
AA floor for body text and the 3:1 floor for large text. The bands' ambient
radials deepen toward `brand-700`/`brand-800` to claw some of that back where
the copy sits, but flat areas stay short. Deepening the band token itself to
`brand-700` (white at 5.07:1) is the fix if AA matters more than the brightness.

Orange on white is capped from the other side: `brand-600` reaches 3.88:1,
enough for display headings and icons but not for body copy, so links, small
print, badges and filled controls step down to `brand-700` (5.07:1) or
`brand-800` (7.05:1 behind white text).

The header is solid white at every scroll position — it never goes transparent
over the hero. `scrolled` drives only the drop shadow and the height shrink.

Semantic status colours stay outside the brand ramp so a status never reads as
decoration: emerald for delivered, rose for delayed/exception. "In transit" and
"out for delivery" are both brand orange and are told apart by **intensity** —
a light chip versus a solid one — because gold and orange sit too close to
carry that distinction by hue.

Type and elevation:

- `font-display` (Sora) for headings, `font-sans` (Inter) for body
- `shadow-soft` / `shadow-card` / `shadow-lift` for the card elevation ladder
- `ease-premium` for the shared easing curve

Reusable text/layout classes (`.section`, `.display-1`, `.display-2`, `.lead`,
`.eyebrow`, `.card-surface`) are defined in `app/globals.css`.

### Motion

`lib/motion.ts` holds the shared variants: `fadeUp` plus `slideInLeft` /
`slideInRight` for lateral entrances. `Reveal` and `RevealItem` take a
`from="left" | "right" | "up"` prop, which is how the editorial sections
alternate their entrance direction.

`ShowcaseCarousel` is the slideshow between Services and Why FreightBridge:
autoplaying, drag/swipe, arrow-key navigable, with a progress bar on the active
dot and a pause control. Autoplay stops on hover and on focus, and never starts
under `prefers-reduced-motion`.

All motion resolves through `lib/use-reduced-motion.ts` rather than Framer's
hook directly — see the note in that file on why.

## Imagery

### Hero media (video or photograph)

The hero frame is configured in one place — `HERO_MEDIA` in `lib/site.ts`:

```ts
export const HERO_MEDIA = {
  video: { src: '/video/hero-freight.mp4', webm: '/video/hero-freight.webm', description: '…' },
  src: '/images/hero-freight.png',   // still, and the video's poster
  alt: '…',
  fallbackSrc: '/images/hero-freight.svg',
  fallbackAlt: '…',
};
```

To use a different shot, drop the file in `public/images/` and point `src` at
it. For a hosted image, add the host to `images.remotePatterns` in
`next.config.mjs` first — everything is local today, so that list is empty.

Aim for landscape, 1600px wide or more. The frame crops with `object-cover` and
a scrim covers the lower third, so keep the subject clear of the bottom-left
corner where the shipment card overlaps.

#### Using a background video instead

Drop an MP4 in `public/video/` and point `HERO_MEDIA.video.src` at it:

```ts
video: {
  src: '/video/hero-freight.mp4',
  webm: '',                            // optional, served first when present
  poster: '/images/hero-freight.jpg',  // shown while the clip loads
  description: 'Freight moving through a FreightBridge distribution network',
},
```

Leave `src` empty to use the still image.

The same frame powers the **"Inside the network"** section on the home page,
configured through `STORY_VIDEO` in `lib/site.ts`:

```ts
export const STORY_VIDEO = {
  src: '/video/inside-the-network.mp4',
  webm: '/video/inside-the-network.webm',
  description: '…',
};
```

Leave `src` empty and that section shows `IMAGERY.lastMile` on its own.

#### The empty slot: "On the road"

A third home-page section, `components/RoadFeature.tsx`, ships with its video
slot **deliberately empty**, ready for a clip to be dropped in without touching
any code. Its config is `ROAD_VIDEO` in `lib/site.ts`, already pointing at
`/video/on-the-road.mp4`.

To fill it, add a file at that exact path — `public/video/on-the-road.mp4`.
Through the GitHub web UI: open `public/video/`, **Add file → Upload files**,
drag the clip in, and commit. The section starts playing it on the next
deploy. No edit to `lib/site.ts` is needed, so the filename has to match.

Until the file exists the section shows `IMAGERY.road` on its own and looks
finished — but the browser console does log a 404 for the missing clip on each
load. That is the price of pre-filling the path so the upload is a one-step
change; it clears the moment the file lands. To silence it before then, set
`ROAD_VIDEO.src` to `''`.

GitHub's web uploader caps a single file at 25 MB, well above the ~3 MB this
should be.

All three clips share `ui/VideoFrame`, so the guidance below applies to any of
them:

- 6–10 seconds, silently looping, compressed to **under ~3 MB** — it is the
  first thing on the page and competes with the hero copy for bandwidth.
  720p is plenty: the frame renders about 540 px tall, so a 4K master is
  roughly 25× the bytes for no visible gain. To resize and strip audio:

  ```bash
  ffmpeg -i master.mp4 -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow \
         -pix_fmt yuv420p -an -movflags +faststart hero-freight.mp4
  ffmpeg -i master.mp4 -vf scale=1280:-2 -c:v libvpx-vp9 -crf 36 -b:v 0 \
         -row-mt 1 -an hero-freight.webm
  ```
- The clip is `muted` and `playsInline`, which is what allows mobile browsers
  to autoplay it at all
- It is suppressed entirely under `prefers-reduced-motion`; those visitors get
  the poster image
- It renders with a pause control, since WCAG 2.2.2 requires a way to stop
  motion that auto-starts and runs beyond five seconds
- If the video fails to load it falls back to the still, and then to the
  illustration
- Ship the webm only if it actually beats the mp4. VP9 usually wins, but on a
  high-motion clip it can come out larger, and `VideoFrame` prefers webm where
  the browser supports it — check the two file sizes before committing both
- A webm that is missing or broken no longer costs the clip: `VideoFrame`
  retries the mp4 once before falling through to the still. This is why an
  mp4-only upload works even though Chrome reports webm as playable

### Section imagery

The three section images are configured in one place — `IMAGERY` in
`lib/site.ts`:

```ts
export const IMAGERY = {
  road:      { src: '/images/hero-freight.svg',  alt: '…', fallbackSrc: '…' },
  port:      { src: '/images/port-terminal.svg', alt: '…', fallbackSrc: '…' },
  warehouse: { src: '/images/warehouse-ops.svg', alt: '…', fallbackSrc: '…' },
};
```

To use photographs: drop the files in `public/images/`, change each `src`, and
update the `alt` to describe your photo. That is the whole change — those three
entries feed the Why section, the services and about pages, and all three
carousel slides.

Landscape, 1600px wide or more; each is cropped with `object-cover`. If a `src`
is missing or mistyped the bundled illustration renders instead, so a typo
degrades rather than breaking the page.

**PNG, JPEG and WebP all work** — just match the extension in `src`. Source
format barely matters to visitors, because `next/image` resizes and re-encodes.
Measured on a 1600px photographic PNG in this project:

| | bytes |
| --- | --- |
| Source PNG in the repo | 1,813,200 |
| Served as AVIF (most browsers) | 20,952 |
| Served as WebP | 24,010 |
| Served as PNG (no modern format support) | 165,298 |

So a heavy PNG costs repository weight and build time, not page weight. Git
keeps every version of a binary forever, so if the source files run to several
MB it is worth exporting them as JPEG before committing.

The shipped illustrations are original SVG authored for this project — no
third-party or stock assets. They keep their own scene colours and sit outside
the brand palette on purpose.

## Accessibility & motion

- Semantic landmarks, a skip link, labelled form fields, and `aria-live` regions
  on the tracking results.
- Visible focus rings site-wide (`:focus-visible`), with a light variant for dark
  sections via the `.on-dark` wrapper.
- Every animation is gated on `prefers-reduced-motion` — Framer Motion through
  `useReducedMotion`, CSS through a media query in `globals.css`.
- A `<noscript>` rule reveals scroll-animated content when JavaScript is off.

## Verified

`npm run build`, `npm run lint`, and `npm run typecheck` all pass. The site was
checked in Chromium at 375 / 768 / 1440 px for console errors and horizontal
overflow, and the tracking lookup, quote validation, quote submission, desktop
dropdowns, and mobile menu were exercised end to end.
