import { PageHero } from './PageHero';
import { Reveal } from './ui/Reveal';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LegalArticleProps {
  breadcrumb: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

export function LegalArticle({ breadcrumb, title, intro, updated, sections }: LegalArticleProps) {
  return (
    <>
      <PageHero eyebrow="Legal" breadcrumb={breadcrumb} title={title} description={intro} />

      <article className="section bg-white">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-5 text-sm text-ink-500">
                <span className="font-semibold text-ink-700">Last updated {updated}.</span> FreightBridge is a
                demonstration website. This page is illustrative sample copy, not a binding legal agreement or
                professional advice.
              </p>
            </Reveal>

            <div className="mt-12 space-y-12">
              {sections.map((section, index) => (
                <Reveal key={section.heading} delay={Math.min(index * 0.04, 0.2)} as="section">
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-2xl">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[0.98rem] leading-relaxed text-ink-600">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-[0.96rem] leading-relaxed text-ink-600">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                            aria-hidden="true"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
