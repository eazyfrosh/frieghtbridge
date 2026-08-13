'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import { cn, sleep } from '@/lib/utils';
import { Button } from './ui/Button';
import { SelectField, TextField } from './ui/Field';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * The public quote enquiry.
 *
 * Deliberately short. Booking a shipment — origin and destination detail,
 * weights, dimensions, pickup windows — happens in the operations area, not on
 * the marketing site. This form only has to capture enough for someone to call
 * the customer back about a lane.
 */

const SHIPMENT_TYPES = ['Parcel', 'Pallet', 'LTL', 'FTL', 'Container', 'Not sure yet'].map((value) => ({
  value,
  label: value,
}));

interface FormState {
  name: string;
  email: string;
  company: string;
  origin: string;
  destination: string;
  shipmentType: string;
  details: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  name: '',
  email: '',
  company: '',
  origin: '',
  destination: '',
  shipmentType: 'Pallet',
  details: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Tell us who to reply to.';
  if (!values.email.trim()) errors.email = 'We need an email to send the quote to.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'That email does not look right.';
  if (!values.origin.trim()) errors.origin = 'Where does it ship from?';
  if (!values.destination.trim()) errors.destination = 'Where is it going?';
  return errors;
}

export function QuoteLeadForm({ className }: { className?: string }) {
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const reduced = useReducedMotion();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (submitted) {
      setErrors(validate({ ...values, [key]: value }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    setErrors(found);

    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      // Move focus to the first problem rather than only colouring it.
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    setPending(true);
    // No backend in this prototype — the delay exercises the pending state.
    await sleep(1000);
    setPending(false);
    setSuccess(true);
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.div
            key="success"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_PREMIUM }}
            role="status"
            className="rounded-4xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12"
          >
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">Request received.</h2>
            <p className="mx-auto mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink-500">
              A logistics specialist will come back to you on{' '}
              <span className="font-medium text-ink-800">{values.origin}</span> →{' '}
              <span className="font-medium text-ink-800">{values.destination}</span>, usually within one business
              hour.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setValues(INITIAL);
                  setErrors({});
                  setSubmitted(false);
                  setSuccess(false);
                }}
              >
                Send another
              </Button>
              <Button href="/tracking" size="lg">
                Track a shipment
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
            exit={{ opacity: 0 }}
            className="rounded-4xl border border-ink-100 bg-white p-6 shadow-card sm:p-8 lg:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="name"
                label="Name"
                name="name"
                required
                value={values.name}
                error={errors.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Alex Morgan"
              />
              <TextField
                id="email"
                label="Email"
                name="email"
                type="email"
                required
                value={values.email}
                error={errors.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="alex@company.com"
              />
              <TextField
                id="company"
                label="Company"
                name="company"
                value={values.company}
                onChange={(event) => update('company', event.target.value)}
                placeholder="Optional"
              />
              <SelectField
                id="shipmentType"
                label="Shipment type"
                name="shipmentType"
                value={values.shipmentType}
                options={SHIPMENT_TYPES}
                onChange={(event) => update('shipmentType', event.target.value)}
              />
              <TextField
                id="origin"
                label="Ships from"
                name="origin"
                required
                value={values.origin}
                error={errors.origin}
                onChange={(event) => update('origin', event.target.value)}
                placeholder="Chicago, IL"
              />
              <TextField
                id="destination"
                label="Ships to"
                name="destination"
                required
                value={values.destination}
                error={errors.destination}
                onChange={(event) => update('destination', event.target.value)}
                placeholder="Dallas, TX"
              />
            </div>

            <div className="mt-5">
              <label htmlFor="details" className="text-sm font-medium text-ink-700">
                Anything else?
              </label>
              <textarea
                id="details"
                name="details"
                rows={4}
                value={values.details}
                onChange={(event) => update('details', event.target.value)}
                placeholder="Rough weight, pallet count, timings — whatever you already know."
                className="mt-1.5 w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <p className="mt-1.5 text-xs text-ink-400">
                We only need the lane to start. The details get confirmed on the call.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
                {pending ? (
                  <>
                    <Loader2 className="h-[1.05rem] w-[1.05rem] animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Request a quote
                    <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <p className="text-xs text-ink-400">
                Prototype form — nothing is sent and no data is stored.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
