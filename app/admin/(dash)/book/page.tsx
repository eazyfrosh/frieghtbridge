import { BookingForm } from '@/components/admin/BookingForm';
import { fulfilmentMode } from '@/lib/fulfilment';

export const metadata = { title: 'Book shipment' };

export default function AdminBookPage() {
  const fulfilment = fulfilmentMode();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
        Book a shipment
      </h1>
      <p className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-500">
        Raise a booking on behalf of a customer, on our own network or on any carrier we work with. The
        reference generated here is the one they will track with, whoever moves the freight.
      </p>

      {fulfilment === 'manual' && (
        <p className="mt-4 max-w-2xl rounded-2xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
          No shipping API is connected, so bookings onto another carrier are recorded rather than tendered:
          book the freight on their platform and paste their tracking number in — here, or on the shipment
          afterwards. Set <code className="font-mono text-[0.85em]">SHIPPING_API_KEY</code> to have it
          tendered automatically.
        </p>
      )}

      <div className="mt-8">
        <BookingForm fulfilment={fulfilment} />
      </div>
    </div>
  );
}
