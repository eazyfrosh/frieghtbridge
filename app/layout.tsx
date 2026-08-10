import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { SITE } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'FreightBridge | Modern Freight & Logistics Solutions',
    template: '%s | FreightBridge',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'freight',
    'logistics',
    'freight transportation',
    'last-mile delivery',
    'warehousing',
    'freight forwarding',
    'supply chain',
    'shipment tracking',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    siteName: SITE.name,
    title: 'FreightBridge | Modern Freight & Logistics Solutions',
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreightBridge | Modern Freight & Logistics Solutions',
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0C0806',
  width: 'device-width',
  initialScale: 1,
};

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  slogan: SITE.tagline,
  description: SITE.description,
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '210 Harbor Point Drive, Suite 900',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    postalCode: '60601',
    addressCountry: 'US',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        {/* Scroll-reveal elements are server-rendered at opacity 0 and animated
            in by Framer Motion. Without JS they would stay invisible, so reveal
            everything up front instead. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-white antialiased">
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          // Static, developer-authored structured data — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </body>
    </html>
  );
}
