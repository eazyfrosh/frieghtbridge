import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from './ui/Reveal';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb: string;
  children?: ReactNode;
  /** Extra bottom padding for pages whose next section overlaps the hero. */
  overlap?: boolean;
}

/**
 * Dark page header used by every inner route. It gives the fixed navbar a
 * consistent dark surface to sit transparently over before it turns solid.
 */
export function PageHero({ eyebrow, title, description, breadcrumb, children, overlap }: PageHeroProps) {
  return (
    <section
      className={`relative isolate overflow-hidden bg-brand-500 pt-[124px] text-white lg:pt-[148px] ${
        overlap ? 'pb-32 sm:pb-40' : 'pb-16 sm:pb-20 lg:pb-24'
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_20%_-20%,#C24500_0%,transparent_58%),radial-gradient(70%_60%_at_95%_0%,#9C3800_0%,transparent_55%)] opacity-65" />
        <div className="absolute inset-0 bg-grid-light bg-[size:60px_60px] opacity-40 mask-fade-b" />
      </div>

      <div className="on-dark container">
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex items-center gap-1.5 text-sm text-white">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="font-medium text-white" aria-current="page">
                {breadcrumb}
              </li>
            </ol>
          </nav>
        </Reveal>

        <Reveal delay={0.05}>
          <span className="eyebrow-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            {eyebrow}
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="display-1 mt-6 max-w-3xl text-white">{title}</h1>
        </Reveal>

        {description && (
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white sm:text-lg">{description}</p>
          </Reveal>
        )}

        {children && (
          <Reveal delay={0.22}>
            <div className="mt-9">{children}</div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
