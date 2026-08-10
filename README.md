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
- `brand` — primary blue (CTAs, links, active states)
- `signal` — orange accent (eyebrow dots, highlights, freight units)
- `font-display` (Sora) for headings, `font-sans` (Inter) for body
- `shadow-soft` / `shadow-card` / `shadow-lift` for the card elevation ladder
- `ease-premium` for the shared easing curve

Reusable text/layout classes (`.section`, `.display-1`, `.display-2`, `.lead`,
`.eyebrow`, `.card-surface`) are defined in `app/globals.css`.

## Imagery

All artwork in `public/images/` is original SVG authored for this project — no
third-party or stock assets. Photography can be dropped in by adding the host to
`images.remotePatterns` in `next.config.mjs` and pointing the `src` of the
`next/image` calls in `Hero`, `WhyFreightBridge`, `ServicesPage`, and `AboutPage`
at the new URLs.

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
