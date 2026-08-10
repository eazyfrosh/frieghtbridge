import type { Metadata } from 'next';
import { LegalArticle } from '@/components/LegalArticle';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How FreightBridge uses cookies and similar technologies, and how you can control them.',
  alternates: { canonical: '/legal/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalArticle
      breadcrumb="Cookie Policy"
      title="Cookie Policy"
      intro="What cookies do on this site, which ones we would use in production, and how to control them."
      updated="1 January 2026"
      sections={[
        {
          heading: 'What cookies are',
          paragraphs: [
            'Cookies are small text files a website stores in your browser. They let a site remember things between page loads — that you are signed in, for example, or which preferences you set.',
          ],
        },
        {
          heading: 'Categories we would use',
          paragraphs: ['A production FreightBridge deployment would use cookies in three categories:'],
          bullets: [
            'Strictly necessary — sign-in sessions, security tokens, and load balancing. These cannot be switched off.',
            'Preferences — remembering settings such as units, region, or a saved tracking number.',
            'Analytics — aggregate, privacy-respecting measurement of which pages and flows are used, so we know what to improve.',
          ],
        },
        {
          heading: 'What this prototype sets',
          paragraphs: [
            'This demonstration build does not set analytics or advertising cookies, and does not use third-party trackers. Anything you type into the quote, contact, or tracking forms stays in your browser for the length of the session.',
          ],
        },
        {
          heading: 'Controlling cookies',
          paragraphs: [
            'Every major browser lets you view, block, and delete cookies from its settings. Blocking strictly necessary cookies will prevent signed-in features from working, but the public pages of the site will still load.',
          ],
        },
      ]}
    />
  );
}
