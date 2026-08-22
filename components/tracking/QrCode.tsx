'use client';

import { useEffect, useState } from 'react';

/**
 * A QR code for the tracking link, so a printed page stays useful.
 *
 * The encoder is loaded on demand rather than imported at the top: it is a
 * few tens of kilobytes and only matters once a shipment has actually been
 * found, which is a minority of page loads. Everyone else never downloads it.
 *
 * Rendered as an inline SVG string — sharp at any size and at print
 * resolution, where a raster QR at 140px goes soft exactly when scanning it
 * matters most.
 */
export function QrCode({ value, size = 150 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);

    import('qrcode')
      .then((mod) =>
        mod.default.toString(value, {
          type: 'svg',
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0B0F1A', light: '#FFFFFF' },
        }),
      )
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  // Nothing is lost if it never arrives — the number and the link are both on
  // the page already, so the panel simply collapses rather than showing an
  // error about a convenience.
  if (failed) return null;

  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded-xl bg-ink-100"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="QR code linking to this tracking page"
      style={{ width: size, height: size }}
      className="overflow-hidden rounded-xl bg-white p-1 ring-1 ring-ink-200 [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
