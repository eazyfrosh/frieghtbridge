import type { CSSProperties, ReactNode } from 'react';
import { carrierTheme } from '@/lib/carrier-themes';
import { cn } from '@/lib/utils';

/**
 * Publishes a carrier's colours as CSS custom properties on a wrapper.
 *
 * Everything inside reads `--carrier-primary` and friends, which `globals.css`
 * also declares at `:root` with our own brand as the fallback — so a themed
 * component still renders correctly outside a scope, and a carrier with no
 * entry in the map looks like FreightBridge rather than looking broken.
 *
 * Custom properties rather than Tailwind classes because the value is data:
 * there is no set of eleven carrier colour classes to purge-safely generate,
 * and a twelfth carrier should not need a Tailwind change.
 */
export function CarrierThemeScope({
  carrierId,
  className,
  children,
}: {
  carrierId: string | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const theme = carrierTheme(carrierId);

  return (
    <div
      data-carrier={carrierId ?? 'freightbridge'}
      className={cn('carrier-theme', className)}
      style={
        {
          '--carrier-primary': theme.primary,
          '--carrier-secondary': theme.secondary,
          '--carrier-on-primary': theme.onPrimary,
          '--carrier-on-secondary': theme.onSecondary,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
