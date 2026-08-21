import { cn } from '@/lib/utils';

/**
 * A carrier's mark, or its initials when there is no logo file.
 *
 * No hooks and no client boundary — it renders identically in a server page
 * and inside a client form.
 *
 * Logos sit on a white tile with a hairline ring in both themes. Carrier marks
 * are fixed-colour artwork built for white: UPS's shield, FedEx's wordmark and
 * USPS's eagle all disappear or fringe on a dark ground, and there is no
 * inverted variant to switch to.
 */

interface CarrierLogoProps {
  /** Public URL of the logo, from `carrierLogos()`. Absent falls back to initials. */
  src?: string | null;
  initials: string;
  /** Only for the alt text on a logo that stands alone. */
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * True when the carrier's name is already next to it in text, which is the
   * usual case — the logo is then decorative and gets an empty alt so a screen
   * reader does not read the name twice.
   */
  labelled?: boolean;
  className?: string;
}

/**
 * Height is fixed and width follows the artwork; `max-w` letterboxes anything
 * unusually wide. `shrink-0` matters: the tile is an inline-flex box with no
 * width of its own, so an auto-sized image inside it collapses to nothing —
 * the container waits on the image and the image waits on the container.
 */
const SIZES = {
  sm: { tile: 'h-6 px-1', image: 'h-4 max-w-[3.25rem]', text: 'text-[0.6rem]' },
  md: { tile: 'h-7 px-1.5', image: 'h-[1.15rem] max-w-[4.5rem]', text: 'text-[0.62rem]' },
  lg: { tile: 'h-9 px-2', image: 'h-6 max-w-[6rem]', text: 'text-[0.7rem]' },
} as const;

export function CarrierLogo({
  src,
  initials,
  name,
  size = 'md',
  labelled = true,
  className,
}: CarrierLogoProps) {
  const scale = SIZES[size];

  if (!src) {
    return (
      <span
        aria-hidden={labelled ? 'true' : undefined}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md bg-ink-900 font-bold text-surface',
          scale.tile,
          scale.text,
          className,
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-white px-1.5 ring-1 ring-ink-200 dark:ring-white/15',
        scale.tile,
        className,
      )}
    >
      {/* A local, already-sized asset: next/image would add a layout contract
          and an optimiser round trip for a 3KB mark that never resizes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={labelled ? '' : (name ?? '')}
        className={cn('w-auto shrink-0 object-contain', scale.image)}
      />
    </span>
  );
}
