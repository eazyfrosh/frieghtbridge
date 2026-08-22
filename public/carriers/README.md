# Carrier logos

Drop a logo in here and it appears everywhere that carrier is shown — the
booking form, the shipment page, the tracking result and the "carriers we
recognise" list. No code change is needed: `lib/carrier-logos.ts` reads this
directory and matches files to carriers by name.

A carrier with no file here shows its initials on a dark tile instead, which is
what the whole site does today. Adding logos one at a time is fine.

## Filenames

The name before the extension must be the carrier's id, exactly:

| File            | Carrier                 |
| --------------- | ----------------------- |
| `freightbridge` | FreightBridge Logistics |
| `ups`           | UPS                     |
| `fedex`         | FedEx                   |
| `usps`          | USPS                    |
| `dhl-express`   | DHL Express             |
| `dhl-ecommerce` | DHL eCommerce           |
| `royal-mail`    | Royal Mail              |
| `canada-post`   | Canada Post             |
| `dpd`           | DPD                     |
| `gls`           | GLS                     |
| `tnt`           | TNT                     |

`usps-international` is the catch-all for postal numbers we can place as
international post but cannot attribute to one operator. It has no logo of its
own — leave it out.

`.svg` is best. `.png`, `.webp`, `.jpg` and `.avif` also work. If two files
share an id the first one found wins, so keep one per carrier.

## What the logo should look like

- **Transparent background.** The site puts the logo on a white tile.
- **Trimmed.** No built-in padding — the tile supplies its own, and whitespace
  baked into the file makes the mark look smaller than its neighbours. This
  matters more than it sounds: the DHL logo here arrived as a wordmark inside a
  567×567 square canvas, which drew about 5px tall on a 16px tile. The files in
  this folder have had their `viewBox` cropped to the artwork's real bounding
  box, and any full-canvas white plate removed. Crop anything you add the same
  way.
- **Wordmark or combination mark**, not the icon alone, where the carrier
  publishes one. They sit next to the carrier's name at roughly 20px tall.
- **Small.** These render at 16–28px. An SVG should be a few KB; a raster file
  wants to be about 240px wide, not 2000.

## A note on the marks themselves

These are other companies' trademarks. Use the official asset from each
carrier's brand or media page rather than a copy traced from elsewhere, and
have a look at their usage guidelines — several of them require the mark to be
shown unaltered and place conditions on using it to imply a partnership. Where
you are a genuine reseller or booking agent, that is usually covered; it is
worth being sure.
