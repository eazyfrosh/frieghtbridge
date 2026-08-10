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
  Testimonials, CTA, Footer, PageHero, ContactForm, Accordion, LegalArticle
  ui/                           Button, Field, Logo, Reveal, SectionHeading
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
  state; nothing is transmitted.
- **Statistics and dashboard figures** are demonstration values, labelled as
  such on the page.

## Design system

Tokens live in `tailwind.config.ts`:

- `ink` — neutral navy scale used for text and dark surfaces
- `brand` — primary orange (CTAs, links, active states, brand accents).
  `brand-600` is the darkest step used behind white text and clears 4.5:1
- `signal` — cool blue accent, used sparingly against the warm primary
  (the coverage map's world layer, depth glows, the "out for delivery" state)
- `font-display` (Sora) for headings, `font-sans` (Inter) for body
- `shadow-soft` / `shadow-card` / `shadow-lift` for the card elevation ladder
- `ease-premium` for the shared easing curve

Reusable text/layout classes (`.section`, `.display-1`, `.display-2`, `.lead`,
`.eyebrow`, `.card-surface`) are defined in `app/globals.css`.

## Imagery

### Hero media (video or photograph)

The hero frame is photographic and configured in one place — `HERO_MEDIA` in
`lib/site.ts`:

```ts
export const HERO_MEDIA = {
  src: '/images/hero-freight.jpg',   // your photo
  alt: '…',
  fallbackSrc: '/images/hero-freight.svg',
  fallbackAlt: '…',
};
```

To use your own shot, drop the file in `public/images/` and point `src` at it.
For a hosted image, add the host to `images.remotePatterns` in
`next.config.mjs` first (`images.unsplash.com` is already allowed).

`HeroPhoto` falls back to `fallbackSrc` if the photo cannot be loaded, so a
wrong path or a dead URL degrades to the illustration instead of leaving a
broken hero. **The shipped `src` is a stock placeholder — replace it with a
photo you have rights to before going live.**

Aim for landscape, 1600×1200 or wider. The frame crops with `object-cover` and
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

Leave `src` empty to use the still image. Guidance for the clip:

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

### Everything else

The remaining artwork in `public/images/` is original SVG authored for this
project — no third-party or stock assets. Those can be swapped for photography
the same way, by changing the `src` of the `next/image` calls in
`WhyFreightBridge`, `ServicesPage`, and `AboutPage`.

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
