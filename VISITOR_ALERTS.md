# Owner visitor notifications

## Vercel production setup

Add these in Project Settings → Environment Variables → Production, then redeploy:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | Existing Resend sending key; never prefix with `NEXT_PUBLIC_` |
| `VISITOR_ALERT_EMAIL` | The owner's destination email address |
| `VISITOR_FROM_EMAIL` | `FreightBridge Logistics <support@freightbridgelogistics.app>` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.freightbridgelogistics.app` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Existing Firebase Admin service account; leave the working value unchanged |

Verify the sender domain in Resend and allow the API key to send from it. No
Resend receiving setup is required. Change `VISITOR_ALERT_EMAIL` and redeploy
to change the recipient. Removing either visitor email variable disables alerts.
Vercel preview deployments deliberately skip alerts.

## Session behavior

The invisible client runs only in the public site layout, two seconds after
mount and while the page is visible. It stores a random UUID and a 24-hour
expiration in localStorage before making a small POST. Shared layout navigation
does not remount it, and storage suppresses refreshes/new tabs. The API also sets
an HttpOnly SameSite cookie as fallback if localStorage is blocked. Multiple
simultaneous requests for the same UUID are handled transactionally. If both
browser storage mechanisms are disabled or cleared, identity cannot be preserved;
server limits still apply. This measures anonymous browser sessions, not unique
people. Visits that leave before the delay, bots, or blocked scripts may be missed.

No precise location, fingerprinting, raw IP, full user agent, URL query string,
URL fragment, or referrer path is stored. IP-derived location is approximate;
missing details appear as Unknown. Device/browser/OS are broad user-agent guesses
(some tablets identify as desktops). Server-generated time is UTC. Referrer is
hostname only; tracking numbers in URL query strings are excluded.

## Shared protection and Firebase

Existing Firebase Admin is reused. Firestore's existing deny-all catch-all rules
cover both new collections, so no rules changes or client database access are needed.

- `website_visitors/{visitorId}` stores the requested metadata, hostname and timestamps.
- `visitor_alert_limits` holds 24-hour duplicate reservations and shared counters.
- Limits: 3 alerts per IP per hour, 5 per minute site-wide, 40 per 24 hours site-wide.
  Reservations, including failed sends, consume the budget. Global windows roll
  from their first reservation. IP limiter keys use a daily HMAC digest; raw IP
  addresses are never persisted. Limits are in `lib/visitor-server.ts`.
- The daily IP digest changes at UTC midnight, so an IP's hourly allowance can
  reset at that boundary. The global budget remains in effect.
- Resend also gets an idempotency key based on the session UUID.
- Only same-origin JSON requests are accepted, with a 2 KB streamed-body cap,
  UUID/path validation, and practical bot/static/API/admin/health exclusions.
  Origin and user-agent checks are not authentication: durable global limits
  remain essential against clients that forge headers. Consider Vercel WAF rules
  for abusive request volume; this endpoint's limits cap mail, not all database reads.

Enable Firestore TTL on the `expiresAt` field for each collection group:
`website_visitors` (30-day retention) and `visitor_alert_limits` (expired gate cleanup).
TTL deletion is asynchronous. Expiration checks are explicit, so duplicate/rate
protection works even before cleanup. Until TTL is enabled, records remain stored.
No index or manual collection creation is necessary; the Admin SDK creates documents.

## Failure behavior

The client never awaits tracking for page rendering or navigation, shows no error
UI, and suppresses failed attempts for 24 hours rather than repeatedly retrying.
Alerts are best-effort: there is no delivery retry queue. Resend failures are
logged server-side without exposing keys or request contents. Resend acceptance
does not guarantee inbox delivery; use its delivery logs to confirm receipt.

Analytics writes run independently of sending once the durable rate reservation
has succeeded. An analytics-write failure does not block email. If Firestore is
unavailable for the reservation itself, alerts fail closed (503) to prevent
unbounded emails across Vercel instances. The website remains fully usable.
This intentionally favors spam protection over alert completeness during outages.

## Validation

Run `node scripts/test-visitors.cjs`, `node scripts/test-tracking-events.cjs`,
`npm run typecheck`, `npm run lint`, and `npm run build`.

The visitor suite runs the real route, transaction, formatting and client code with
an in-memory database boundary and stub Resend provider. It covers initial alerts,
duplicate/concurrent requests, cookies, client reload/navigation, expiry, missing
location, private-data exclusion, malicious HTML escaping, request validation,
rate limits, provider errors, and database failures. It does not send real emails.

After deployment, visit the production homepage in a new private browser window
and leave it open for a few seconds. Verify the owner email and Firestore record,
then refresh and navigate to confirm no second alert. Check Vercel logs and Resend
delivery logs if missing. Normal repeated browsing is intentionally suppressed.
