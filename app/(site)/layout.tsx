import type { ReactNode } from 'react';
import { ChatWidget } from '@/components/ChatWidget';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

/**
 * Chrome for the public marketing site. The admin section sits outside this
 * group so it never inherits the customer-facing navbar and footer — which is
 * also what keeps the chat widget off the operator's own screens.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
