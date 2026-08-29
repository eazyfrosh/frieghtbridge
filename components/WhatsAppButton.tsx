import { WhatsAppIcon } from '@/components/icons/WhatsApp';
import { WHATSAPP_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Floating WhatsApp button, beside the chat launcher.
 *
 * Same size, shape, elevation and hover as the chat bubble, so the two read as
 * one pair of ways to reach a person rather than two unrelated widgets.
 *
 * Placed to the *left* of the chat rather than above it. The chat panel opens
 * upward from `bottom-24`, so a stacked button would sit underneath it the
 * moment someone opened a conversation; side by side, both stay reachable
 * whatever the chat is doing.
 *
 * It renders unconditionally, unlike `ChatWidget`, which hides itself when the
 * server cannot store conversations. WhatsApp needs nothing from us — that is
 * the point of having it — so if anything it matters more when chat is down.
 */
export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message FreightBridge Logistics customer service on WhatsApp"
      className={cn(
        'no-print fixed bottom-5 right-[5.5rem] z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full',
        // WhatsApp green with a dark glyph, the same fill-and-dark-mark
        // treatment as the chat bubble. The familiar white-on-green sits at
        // about 1.9:1, well under the 3:1 a graphical element needs, and this
        // is legible while still unmistakably WhatsApp.
        'bg-[#25D366] text-night-950 shadow-[0_8px_28px_rgba(18,18,18,0.22)]',
        'transition-transform duration-300 ease-premium hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40',
      )}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
