import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  actions?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
  actions,
}: SectionHeadingProps) {
  const light = tone === 'light';

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        Boolean(actions) && 'lg:flex-row lg:items-end lg:justify-between lg:gap-12',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <Reveal>
            <span className={light ? 'eyebrow-dark' : 'eyebrow'}>
              <span className="h-1.5 w-1.5 rounded-full bg-signal-500" aria-hidden="true" />
              {eyebrow}
            </span>
          </Reveal>
        )}
        <Reveal delay={0.06}>
          <h2 className={cn('display-2 mt-5', light && 'text-white')}>{title}</h2>
        </Reveal>
        {description && (
          <Reveal delay={0.12}>
            <p className={cn('lead mt-5', light && 'text-ink-200')}>{description}</p>
          </Reveal>
        )}
      </div>
      {actions && (
        <Reveal delay={0.18} className="shrink-0">
          {actions}
        </Reveal>
      )}
    </div>
  );
}
