'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { SegmentedField, SelectField, TextField } from '../ui/Field';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'Netherlands',
  'France',
  'Spain',
  'United Arab Emirates',
  'Other',
].map((country) => ({ value: country, label: country }));

const SHIPMENT_TYPES = [
  { value: 'Parcel', label: 'Parcel', helper: '< 70 lb' },
  { value: 'Pallet', label: 'Pallet', helper: '1–5 units' },
  { value: 'LTL', label: 'LTL', helper: 'Partial load' },
  { value: 'FTL', label: 'FTL', helper: 'Full load' },
  { value: 'Container', label: 'Container', helper: '20ft / 40ft' },
];

const DELIVERY_PREFERENCES = [
  { value: 'Economy', label: 'Economy — lowest cost' },
  { value: 'Standard', label: 'Standard — balanced' },
  { value: 'Expedited', label: 'Expedited — priority transit' },
  { value: 'Same Day', label: 'Same day — where available' },
];

interface FormState {
  fromCountry: string;
  fromCity: string;
  fromZip: string;
  toCountry: string;
  toCity: string;
  toZip: string;
  shipmentType: string;
  weight: string;
  pieces: string;
  dimensions: string;
  pickupDate: string;
  deliveryPreference: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  fromCountry: '',
  fromCity: '',
  fromZip: '',
  toCountry: '',
  toCity: '',
  toZip: '',
  shipmentType: 'Pallet',
  weight: '',
  pieces: '1',
  dimensions: '',
  pickupDate: '',
  deliveryPreference: 'Standard',
  name: '',
  businessName: '',
  email: '',
  phone: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_PATTERN = /^[+()\-.\s\d]{7,22}$/;

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.fromCountry) errors.fromCountry = 'Select an origin country.';
  if (!values.fromCity.trim()) errors.fromCity = 'Enter the pickup city.';
  if (!values.fromZip.trim()) errors.fromZip = 'Enter a ZIP or postal code.';

  if (!values.toCountry) errors.toCountry = 'Select a destination country.';
  if (!values.toCity.trim()) errors.toCity = 'Enter the delivery city.';
  if (!values.toZip.trim()) errors.toZip = 'Enter a ZIP or postal code.';

  if (!values.shipmentType) errors.shipmentType = 'Choose a shipment type.';

  if (!values.weight.trim()) {
    errors.weight = 'Enter an approximate weight.';
  } else if (!/\d/.test(values.weight)) {
    errors.weight = 'Weight should include a number, e.g. 1200 lb.';
  }

  // The shipment record carries a piece count and the tracking page shows it,
  // so the booking is where it should be captured rather than defaulted to 1.
  const pieces = Number(values.pieces);
  if (!values.pieces.trim() || !Number.isFinite(pieces) || pieces < 1) {
    errors.pieces = 'Enter how many pieces, at least 1.';
  }

  if (!values.pickupDate) {
    errors.pickupDate = 'Choose a pickup date.';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${values.pickupDate}T00:00:00`) < today) {
      errors.pickupDate = 'Pickup date cannot be in the past.';
    }
  }

  if (!values.name.trim()) {
    errors.name = 'Enter your full name.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'That name looks too short.';
  }

  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email, e.g. you@company.com.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Enter a phone number we can reach you on.';
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number.';
  }

  return errors;
}

export function BookingForm({ className }: { className?: string }) {
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const reduced = useReducedMotion();

  // Computed after mount so server and client markup match.
  useEffect(() => {
    setMinDate(new Date().toISOString().slice(0, 10));
  }, []);

  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      // Once the visitor has attempted a submit, keep validation live so errors
      // clear the moment they are fixed.
      if (submitted) setErrors(validate(next));
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      const field = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
      field?.focus();
      field?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }

    setPending(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, pieces: Number(values.pieces) }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        trackingNumber?: string;
        error?: string;
      };

      if (!response.ok || !data.trackingNumber) {
        setSubmitError(data.error ?? 'The booking was not saved. Please try again.');
        return;
      }

      // The tracking number comes from the server, which allocated it. Making
      // one up here is what the old prototype did, and it meant the reference
      // read back to the customer matched nothing.
      setSuccess({ reference: data.trackingNumber });
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setValues(INITIAL);
    setErrors({});
    setSubmitted(false);
    setSuccess(null);
    setSubmitError(null);
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.div
            key="success"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_PREMIUM }}
            className="rounded-4xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12"
            role="status"
          >
            <motion.span
              className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
              initial={reduced ? undefined : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </motion.span>

            <h3 className="mt-6 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
              Shipment booked.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[1rem] leading-relaxed text-ink-500">
              The shipment is saved and the tracking number works straight away. Give it to the customer, or
              open the shipment to record a scan or send them a confirmation.
            </p>

            <dl className="mx-auto mt-8 grid max-w-lg gap-px overflow-hidden rounded-2xl bg-ink-100 text-left sm:grid-cols-3">
              <div className="bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Reference</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-ink-900">{success.reference}</dd>
              </div>
              <div className="bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Lane</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {values.fromCity} → {values.toCity}
                </dd>
              </div>
              <div className="bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Service</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {values.shipmentType} · {values.deliveryPreference}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={reset} variant="secondary" size="lg">
                Book another
              </Button>
              <Button href={`/admin/shipments/${encodeURIComponent(success.reference)}`} size="lg">
                Open shipment
                <ArrowRight className="h-[1.05rem] w-[1.05rem]" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            initial={false}
            exit={{ opacity: 0 }}
            className="rounded-4xl border border-ink-100 bg-white p-6 shadow-card sm:p-8 lg:p-10"
          >
            {submitted && errorCount > 0 && (
              <div
                role="alert"
                className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <span className="mt-0.5 font-semibold">
                  {errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} attention
                </span>
                <span className="text-red-600">Fix the highlighted fields and submit again.</span>
              </div>
            )}

            {/* Route */}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <fieldset className="rounded-3xl border border-ink-100 bg-ink-50/40 p-5 sm:p-6">
                <legend className="flex items-center gap-2 px-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">
                  <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  From
                </legend>
                <div className="mt-4 grid gap-4">
                  <SelectField
                    id="fromCountry"
                    label="Country"
                    required
                    placeholder="Select country"
                    options={COUNTRIES}
                    value={values.fromCountry}
                    onChange={(event) => update('fromCountry', event.target.value)}
                    error={errors.fromCountry}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="fromCity"
                      label="City"
                      required
                      placeholder="Chicago"
                      value={values.fromCity}
                      onChange={(event) => update('fromCity', event.target.value)}
                      error={errors.fromCity}
                    />
                    <TextField
                      id="fromZip"
                      label="ZIP / Postal code"
                      required
                      placeholder="60601"
                      value={values.fromZip}
                      onChange={(event) => update('fromZip', event.target.value)}
                      error={errors.fromZip}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-3xl border border-ink-100 bg-ink-50/40 p-5 sm:p-6">
                <legend className="flex items-center gap-2 px-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">
                  <PackageCheck className="h-4 w-4 text-signal-500" aria-hidden="true" />
                  To
                </legend>
                <div className="mt-4 grid gap-4">
                  <SelectField
                    id="toCountry"
                    label="Country"
                    required
                    placeholder="Select country"
                    options={COUNTRIES}
                    value={values.toCountry}
                    onChange={(event) => update('toCountry', event.target.value)}
                    error={errors.toCountry}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="toCity"
                      label="City"
                      required
                      placeholder="Dallas"
                      value={values.toCity}
                      onChange={(event) => update('toCity', event.target.value)}
                      error={errors.toCity}
                    />
                    <TextField
                      id="toZip"
                      label="ZIP / Postal code"
                      required
                      placeholder="75201"
                      value={values.toZip}
                      onChange={(event) => update('toZip', event.target.value)}
                      error={errors.toZip}
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Shipment */}
            <div className="mt-8 border-t border-ink-100 pt-8">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">
                <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Shipment details
              </h3>

              <div className="mt-5">
                <SegmentedField
                  legend="Shipment type"
                  name="shipmentType"
                  value={values.shipmentType}
                  options={SHIPMENT_TYPES}
                  onChange={(value) => update('shipmentType', value)}
                  error={errors.shipmentType}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField
                  id="weight"
                  label="Weight"
                  required
                  placeholder="1,200 lb"
                  hint="Total gross weight"
                  value={values.weight}
                  onChange={(event) => update('weight', event.target.value)}
                  error={errors.weight}
                />
                <TextField
                  id="pieces"
                  label="Pieces"
                  type="number"
                  min={1}
                  required
                  placeholder="2"
                  hint="How many units"
                  value={values.pieces}
                  onChange={(event) => update('pieces', event.target.value)}
                  error={errors.pieces}
                />
                <TextField
                  id="dimensions"
                  label="Dimensions"
                  placeholder="48 × 40 × 52 in"
                  hint="Optional — per unit"
                  value={values.dimensions}
                  onChange={(event) => update('dimensions', event.target.value)}
                  error={errors.dimensions}
                />
                <TextField
                  id="pickupDate"
                  label="Pickup date"
                  required
                  type="date"
                  min={minDate || undefined}
                  value={values.pickupDate}
                  onChange={(event) => update('pickupDate', event.target.value)}
                  error={errors.pickupDate}
                />
                <SelectField
                  id="deliveryPreference"
                  label="Delivery preference"
                  options={DELIVERY_PREFERENCES}
                  value={values.deliveryPreference}
                  onChange={(event) => update('deliveryPreference', event.target.value)}
                  error={errors.deliveryPreference}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="mt-8 border-t border-ink-100 pt-8">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                How we reach you
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField
                  id="name"
                  label="Name"
                  required
                  autoComplete="name"
                  placeholder="Amara Okafor"
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  error={errors.name}
                />
                <TextField
                  id="businessName"
                  label="Business name"
                  autoComplete="organization"
                  placeholder="Northline Supply Co."
                  hint="Optional"
                  value={values.businessName}
                  onChange={(event) => update('businessName', event.target.value)}
                  error={errors.businessName}
                />
                <TextField
                  id="email"
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                  error={errors.email}
                />
                <TextField
                  id="phone"
                  label="Phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 (312) 555-0142"
                  value={values.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  error={errors.phone}
                />
              </div>
            </div>

            {submitError && (
              <p
                role="alert"
                className="mt-8 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {submitError}
              </p>
            )}

            <div className="mt-8 flex flex-col items-start gap-4 border-t border-ink-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-sm text-ink-400">
                This creates the shipment and allocates a tracking number the customer can use immediately.
              </p>
              <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
                {pending ? (
                  <>
                    <Loader2 className="h-[1.05rem] w-[1.05rem] animate-spin" aria-hidden="true" />
                    Booking…
                  </>
                ) : (
                  <>
                    Book shipment
                    <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
