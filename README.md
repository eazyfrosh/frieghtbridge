# FreightBridge Logistics

**Move Freight. Build Connections.**

A production-quality marketing site for FreightBridge Logistics, a modern freight
and supply chain company. Built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and
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
  layout.tsx                    root shell only — fonts, metadata, JSON-LD
  globals.css                   design tokens, component classes, reduced-motion rules
  (site)/                       PUBLIC marketing site
    layout.tsx                  navbar + footer chrome
    page.tsx                    home page composition
    tracking/                   shipment tracking (accepts ?number=FBX-...)
    quote/                      short quote enquiry (booking lives in admin)
    services/                   services + solutions by industry
    about/                      company, timeline, careers, partners
    contact/                    contact channels + message form
    resources/faq/              grouped FAQ accordion
    resources/shipping-guide/   practical shipping guidance
    legal/{privacy,terms,cookies}
  admin/                        STAFF operations area, auth-gated
    login/                      sign-in page (outside the gated group)
    (dash)/layout.tsx           sidebar shell + server-side session check
    (dash)/page.tsx             operations dashboard
    (dash)/shipments/           list, status filters, detail view
    (dash)/book/                book a shipment
  api/admin/session/            sign-in / sign-out (Node runtime)
  api/tracking/                 public shipment lookup (Node runtime)
  not-found.tsx, sitemap.ts, robots.ts
middleware.ts                   blocks unauthenticated /admin requests
components/
  Navbar, Hero, TrackingWidget, Services, WhyFreightBridge, HowItWorks,
  QuoteLeadForm, GlobalNetwork, EnterpriseSection, TechnologySection,
  Testimonials, CTA, Footer, PageHero, ContactForm, Accordion, LegalArticle,
  ShowcaseCarousel, NetworkStory, RoadFeature
  admin/                        AdminShell, LoginForm, BookingForm
  ui/                           Button, Field, Figure, Logo, Reveal,
                                SectionHeading, VideoFrame
lib/
  tracking.ts                   shipment types, resolution, client lookup
  fixtures/shipments.ts         seed data + no-Firebase fallback
  shipments.ts                  Firestore reads (server only)
  admin.ts                      stats and status tones for the ops views
  session.ts                    authoritative session check (server only)
  firebase/{config,admin,client}.ts
  site.ts                       nav, services, footer and coverage-region data
  motion.ts                     shared Framer Motion variants
  utils.ts                      class joiner + date/time formatting
scripts/seed-firestore.mjs      seeds the shipments collection
firestore.rules                 denies all client access (server-only reads)
firebase.json, .firebaserc      emulator configuration
public/images/                  original SVG freight illustrations
```

## Admin section

`/admin` is a staff area, separate from the marketing site. **Booking a
shipment happens here, not on the public site** — the public `/quote` page is
only a short enquiry that captures a lane and a contact.

### Setting it up

Create a Firebase project, enable **Authentication → Email/Password**, and
create **Cloud Firestore**. Then copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY=<service account JSON, one line or base64>
ADMIN_EMAILS=ops@example.com
```

The `NEXT_PUBLIC_` values are public by design — a Firebase API key identifies
a project, it does not authorise anything. `FIREBASE_SERVICE_ACCOUNT_KEY` is a
real secret: it bypasses every Firestore rule, so it is server-only and must
never be given a `NEXT_PUBLIC_` prefix.

There is **no default login**. Create the operator in the Firebase console
(Authentication → Users → Add user) and put that same address in
`ADMIN_EMAILS`. Then seed Firestore and deploy the rules:

```bash
npm run seed                        # writes the demo shipments
firebase deploy --only firestore:rules
```

### When sign-in fails

```bash
npm run doctor
```

Walks the whole chain — env file, client config, whether the project id is
actually baked into the built bundle, the service account, the allowlist, live
Firebase Auth, and whether the operator account exists — and names the broken
link. It prints no secrets.

The failure it catches most often: `NEXT_PUBLIC_*` values are inlined at
**build** time, so editing `.env.local` and restarting is not enough. Rebuild.

### Running against the emulators

No Firebase project needed, and nothing touches the network:

```bash
npm run emulators                   # Auth on :9099, Firestore on :8080
npm run seed:emulator               # in a second shell
```

Add the two commented lines at the bottom of `.env.example` to `.env.local`,
and create a user with the Admin SDK or the emulator's REST API.

### How the auth works

1. The browser signs in with the Firebase client SDK and gets an ID token.
2. That token is posted to `/api/admin/session`, which verifies it server-side
   and exchanges it for a **Firebase session cookie** — httpOnly, SameSite=Lax,
   `Secure` in production, 8-hour expiry.
3. The client's own Firebase session is then discarded. The cookie is the only
   credential, and JavaScript cannot read it, so an XSS bug cannot lift it.
4. Every admin page and route handler calls `getSession()`, which verifies the
   cookie against Firebase **with `checkRevoked`**.
5. Signing out revokes the account's refresh tokens, so any copy of the cookie
   stops working immediately rather than lasting until it expires.

**Having a Firebase account is not the same as being an operator.** Firebase's
Email/Password provider permits public self-signup through its REST API by
default, and the project's API key is in the client bundle by design — so
without a gate, anyone could enrol themselves and walk into `/admin`. Every
sign-in and every subsequent request checks the address against `ADMIN_EMAILS`;
an empty list authorises nobody. Also switch off sign-up in the console
(Authentication → Settings → User actions) so accounts cannot be created at
all. Checking on each request, not just at sign-in, means removing an address
ends that session on the next page load.

For more than a handful of operators, move this to Firebase custom claims —
the allowlist is deliberately the simplest thing that closes the hole.

`middleware.ts` only checks that a cookie is *present* — the Admin SDK cannot
run on the Edge runtime. It is a redirect for the common case, not the security
boundary; `getSession()` is.

ID tokens older than five minutes are refused at exchange, so a captured token
has a short window.

### Firestore

Shipments live in a `shipments` collection, keyed by tracking number, so the
public lookup is a point read rather than a query.

`firestore.rules` denies **all** client access. Every read goes through the
Admin SDK on the server, which bypasses rules — so a leaked client config grants
no access to shipment data. The only way in from outside is
`GET /api/tracking?number=…`, which answers one exact tracking number and
offers no listing or prefix search. Add per-IP rate limiting there before real
traffic, or the numbering scheme can be brute-forced.

With no Firebase configured the app falls back to the seed fixtures so a fresh
clone still runs. **Data degrades; authentication does not** — `getSession()`
returns null rather than pretending, and sign-in returns 503.

### What this is not

A single operator account, created by hand in the console. There is no signup,
no password reset flow, no MFA, no roles and no audit trail. Firebase gives you
all of those; none are wired up here.

A booking stores the customer's name, email, phone and company on the shipment,
and the notify panel prefills from them. Those fields are excluded from
`TrackingResult` by type, not just by omission in the mapping code — a tracking
number is the only credential the public lookup asks for, so anyone who guesses
one must not thereby learn who the shipment belongs to. A future `...shipment`
spread into the public response fails to compile.

Tracking numbers are random eight-digit `FBX-` references written with
Firestore's `create()`, so a collision fails rather than overwriting an
existing consignment; the allocator retries.

Editing a shipment stores the whole record, so the first save on one of the
seed fixtures materialises it into Firestore. `listShipments` therefore merges:
Firestore wins for any tracking number it holds, and fixtures fill in the rest
— otherwise saving one shipment would make the other three vanish from the
list. To retire the demo data, delete the entries from
`lib/fixtures/shipments.ts`.

## Prototype behaviour

This is a front-end prototype: there is no backend.

- **Tracking** calls `GET /api/tracking`, which reads Firestore server-side.
  The seed fixtures cover the four states, and they are no longer advertised on
  the page — a specimen number on a live tracking form reads as a real
  consignment, and people paste it in and then ask why it is not their shipment.
  For testing, type one of: `FBX-28473921` (in transit), `FBX-90112845` (out for
  delivery), `FBX-55620174` (delivered), `FBX-73004466` (delayed).
- **Shipments are editable.** An operator can correct a shipment's details and
  record tracking events from `/admin/shipments/<number>`; both write to
  Firestore and appear on the customer's tracking page immediately. Events
  carry an absolute timestamp (`at`), unlike the fixtures' relative `hoursAgo`,
  and the timeline sorts chronologically so a late-arriving depot scan lands in
  the right place rather than on the end.
- **Booking is real.** `/admin/book` creates a shipment in Firestore and
  allocates an `FBX-` tracking number that works on the public tracking page
  immediately. It is staff-only; the public `/quote` page remains a short
  enquiry that transmits nothing.
- **Quote and contact forms** validate fully client-side and show a success
  state; nothing is transmitted.
- **Admin sign-in and shipment storage are real.** Authentication is Firebase
  Auth; shipments are read from Cloud Firestore through the Admin SDK. Without
  Firebase configured, shipment reads fall back to the seed fixtures — sign-in
  does not fall back, it refuses.
- **Live chat is real** and stores conversations in Firestore. See below.
- **Statistics and dashboard figures** are demonstration values, labelled as
  such on the page.

## Live chat

Visitors chat from a bubble on every public page; operators reply at
`/admin/chat`. Conversations live in Firestore under `chats/{id}` with a
`messages` subcollection.

**No client Firestore access, and no anonymous auth.** Everything goes through
`/api/chat` and the Admin SDK, exactly as shipment reads do, so `firestore.rules`
stays deny-all. A visitor proves ownership of a conversation with a 32-byte
random secret in an httpOnly cookie; only its SHA-256 is stored, compared in
constant time. The alternative — Firebase Anonymous Auth with per-uid rules —
would mean enabling a provider, granting the browser a database handle, and
writing rules that Firestore cannot actually express for this case.

**Updates arrive by polling**, not a socket: 4s with the panel open, 15s with it
shut, paused entirely when the tab is hidden. Serverless functions cap
connection lifetime, so a socket would spend its time reconnecting.

**Messages carry a per-conversation sequence number**, assigned inside the write
transaction, and polls ask for everything after the highest one they hold. A
timestamp cursor was tried first and is wrong: wall-clock ordering across
instances is not guaranteed, and widening the window to compensate makes the
newest message match its own cursor and re-send forever.

Limits: 2000 characters a message, 20 messages a minute per conversation, 5 new
conversations an hour per IP. The counters live in Firestore — an in-process
counter on a serverless host resets constantly and limits nothing.

**Ending a chat** is the visitor's to do, from the panel header. It closes the
conversation for the operator — recorded as ended by the visitor, distinct from
the operator filing it — and clears the cookie, so that browser can no longer
read the thread. The record is kept, because the operator still needs the
history. The cookie is cleared even if the close write fails: someone ending a
chat on a shared computer is asking for it off their screen, and a Firestore
hiccup is no reason to leave it readable.

Not built: email notification when a message arrives (an operator has to have
the page open), typing indicators, read receipts, file attachments, and any
retention policy — conversations accumulate until deleted by hand.

## Shipment email notifications

Five premade templates — booked, picked up, out for delivery, delivered,
delayed — editable at `/admin/templates`, sent from a shipment's own page.

**Templates are plain text with `{{placeholder}}` markers, not HTML.** The
operator edits wording; the branded HTML shell is generated around it and a
plain-text alternative goes alongside. Letting people paste HTML into a field
that gets mailed out buys formatting almost nobody hand-writes, in exchange
for broken layouts in Outlook and an injection surface. Everything
interpolated is escaped.

**Editing never overwrites the shipped copy.** Defaults live in
`lib/email/templates.ts`; an edit is stored as an override in Firestore, so
Reset always works. A mistyped marker like `{{recipeintName}}` is saved with a
warning and rendered literally — a visible mistake beats a silent blank.

**Preview is the same code path as the send**, rendered against the real
shipment, so what the operator approves is what leaves. The estimated delivery
date comes from `resolveShipment`, the same function the public tracking page
uses, so the email cannot disagree with the page it links to.

Every attempt is logged to Firestore, **failures included** — an operator needs
to know a delay notice never left the building.

Sending uses Resend's HTTP API through `fetch`, with no SDK: after
`firebase-admin` failed to import on Vercel over a CommonJS/ESM conflict deep
in its dependencies, a provider needing one POST does not justify a dependency
that can break the deployment. Swapping providers means rewriting `deliver()`
in `lib/email/index.ts` and nothing else.

Set `RESEND_API_KEY` and `EMAIL_FROM` to enable sending; the From domain must
be verified in Resend or it will refuse. Without them, editing and previewing
still work and the UI says why sending is off.

Not built: sending automatically on a status change (every send is a
deliberate act), bulk sends, scheduling, open tracking, and unsubscribe
handling — these are transactional notifications, but check your obligations
before using them for anything else.

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

`ShowcaseCarousel` is the slideshow between Services and Why FreightBridge Logistics:
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
  description: 'Freight moving through a FreightBridge Logistics distribution network',
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
