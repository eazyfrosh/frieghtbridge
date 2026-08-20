import type { Metadata } from 'next';
import { LegalArticle } from '@/components/LegalArticle';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use the FreightBridge Logistics website and request freight transportation services.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <LegalArticle
      breadcrumb="Terms"
      title="Terms of Service"
      intro="The terms that apply when you use this website and when you book freight with FreightBridge Logistics."
      updated="1 January 2026"
      sections={[
        {
          heading: 'Using this website',
          paragraphs: [
            'You may use the FreightBridge Logistics website to learn about our services, request quotes, and track shipments associated with your account. You agree not to interfere with the site, attempt to access accounts that are not yours, or use automated tools to scrape content at a scale that degrades service for others.',
          ],
        },
        {
          heading: 'Quotes and bookings',
          paragraphs: [
            'A quote is an offer to provide transportation on the terms stated, for the window stated. It becomes a booking once accepted and confirmed by FreightBridge Logistics.',
            'Quoted prices assume the shipment details you provide are accurate. Reweighs, reclassification, additional accessorial services, or changes to pickup and delivery requirements may adjust the final price.',
          ],
        },
        {
          heading: 'Your responsibilities as a shipper',
          paragraphs: ['To move freight safely and legally, you agree to:'],
          bullets: [
            'Describe the commodity accurately, including weight, dimensions, and any hazardous characteristics.',
            'Package and secure freight so it can withstand normal handling in transit.',
            'Provide accurate addresses, contacts, and any appointment requirements.',
            'Supply complete and truthful documentation for international shipments.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'Carrier liability for loss or damage is limited by applicable transportation law and by the terms of the governing bill of lading, and is typically calculated by weight and commodity class rather than by the value of the goods.',
            'Where the replacement value of your freight exceeds those limits, cargo insurance is available and we recommend requesting it at the time of booking.',
          ],
        },
        {
          heading: 'Prototype notice',
          paragraphs: [
            'This website is a demonstration build. Tracking results, dashboard figures, statistics, and quote submissions shown here are sample data and do not represent live commercial operations.',
          ],
        },
      ]}
    />
  );
}
