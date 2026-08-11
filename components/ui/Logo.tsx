import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** `light` renders for dark backgrounds. */
  tone?: 'dark' | 'light';
  className?: string;
  href?: string;
  showWordmark?: boolean;
  onClick?: () => void;
}

/**
 * Original FreightBridge wordmark: an abstract bridge span carrying a freight
 * line across two piers, drawn from the brand's own geometry.
 */
/**
 * On white the mark is an orange tile with a white bridge; on orange or dark
 * grounds it inverts to a white tile, because an orange tile on an orange band
 * all but disappears.
 */
export function LogoMark({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const inverted = tone === 'light';
  const stroke = inverted ? '#D1450A' : '#FFFFFF';

  return (
    <span
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        inverted
          ? 'bg-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_18px_-8px_rgba(226,81,0,0.9)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        {/* Bridge deck */}
        <path d="M2.5 14h19" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        {/* Suspension span */}
        <path
          d="M3 14c3.2-6.2 14.8-6.2 18 0"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        {/* Piers */}
        <path d="M7 14v5M17 14v5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
        {/* Freight unit crossing the span */}
        <rect x="9.5" y="8.6" width="5" height="3.6" rx="1" fill={inverted ? '#121212' : '#121212'} />
      </svg>
    </span>
  );
}

export function Logo({ tone = 'dark', className, href = '/', showWordmark = true, onClick }: LogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} />
      {showWordmark && (
        <span
          className={cn(
            'font-display text-[1.28rem] font-semibold tracking-[-0.03em]',
            tone === 'light' ? 'text-ink-950' : 'text-ink-900',
          )}
        >
          Freight
          <span className={tone === 'light' ? 'text-ink-950/65' : 'text-brand-600'}>Bridge</span>
        </span>
      )}
    </span>
  );

  return (
    <Link href={href} onClick={onClick} aria-label="FreightBridge — home" className="inline-flex rounded-xl">
      {content}
    </Link>
  );
}
