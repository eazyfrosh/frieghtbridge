import { Compass, PackageSearch } from 'lucide-react';
import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/**
 * Root-level 404, so it renders outside the (site) group and has to bring the
 * public chrome with it.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main">
    <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-brand-500 px-5 py-32 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_-10%,#C24500_0%,transparent_60%)] opacity-70" />
        <div className="absolute inset-0 bg-grid-light bg-[size:60px_60px] opacity-35 mask-fade-b" />
      </div>

      <div className="on-dark container text-center">
        <span className="eyebrow-dark mx-auto">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          Off the route
        </span>

        <p className="mt-8 font-display text-7xl font-semibold tracking-[-0.05em] text-white sm:text-8xl">404</p>

        <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
          This page never made it to the dock.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white">
          The link may be out of date, or the page may have moved. Let&rsquo;s get you back to something useful.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/" size="lg" variant="onDark" className="w-full sm:w-auto">
            Back to home
          </Button>
          <Button href="/tracking" size="lg" variant="outlineDark" className="w-full sm:w-auto">
            <PackageSearch className="h-[1.05rem] w-[1.05rem]" />
            Track a shipment
          </Button>
        </div>
      </div>
    </section>
      </main>
      <Footer />
    </>
  );
}
