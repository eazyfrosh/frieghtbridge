import { BookingForm } from '@/components/admin/BookingForm';

export const metadata = { title: 'Book shipment' };

export default function AdminBookPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
        Book a shipment
      </h1>
      <p className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-500">
        Raise a booking on behalf of a customer. The reference generated here is the one they will track with.
      </p>

      <div className="mt-8">
        <BookingForm />
      </div>
    </div>
  );
}
