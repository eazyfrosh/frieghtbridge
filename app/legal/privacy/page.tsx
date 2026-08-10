import type { Metadata } from 'next';
import { LegalArticle } from '@/components/LegalArticle';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FreightBridge collects, uses, and protects the information you share when requesting a quote or tracking a shipment.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalArticle
      breadcrumb="Privacy Policy"
      title="Privacy Policy"
      intro="What we collect when you use FreightBridge, why we collect it, and the choices you have."
      updated="1 January 2026"
      sections={[
        {
          heading: 'Information we collect',
          paragraphs: [
            'We collect the information you give us directly when you request a quote, track a shipment, or contact our team.',
          ],
          bullets: [
            'Contact details: name, business name, email address, and phone number.',
            'Shipment details: origin, destination, shipment type, weight, dimensions, and timing.',
            'Support correspondence: the messages you send us and our replies.',
          ],
        },
        {
          heading: 'How we use it',
          paragraphs: [
            'Shipment and contact information is used to prepare quotes, arrange transportation, keep you informed about freight in motion, and answer support requests.',
            'We do not sell personal information, and we do not share it with third parties for their own marketing.',
          ],
        },
        {
          heading: 'Sharing with carriers and partners',
          paragraphs: [
            'Moving freight requires sharing shipment details with the carriers, warehouse operators, and customs agents handling your goods. We share only what those partners need to complete the movement.',
          ],
        },
        {
          heading: 'Retention',
          paragraphs: [
            'Shipment records are retained for as long as needed to service the account and to meet transportation and customs record-keeping obligations. Quote requests that do not become shipments are retained for a shorter period.',
          ],
        },
        {
          heading: 'Your choices',
          paragraphs: [
            'You can request a copy of the information we hold about you, ask us to correct it, or ask us to delete it where we are not required to keep it.',
            'Email hello@freightbridge.com and we will respond within a reasonable period.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Information is transmitted over encrypted connections and access is limited to the people who need it to do their job. No system is perfectly secure, and we will tell you promptly if an incident affects your data.',
          ],
        },
      ]}
    />
  );
}
