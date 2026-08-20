'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import { sleep } from '@/lib/utils';
import { Button } from './ui/Button';
import { SelectField, TextAreaField, TextField } from './ui/Field';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const TOPICS = [
  { value: 'quote', label: 'New quote or pricing' },
  { value: 'shipment', label: 'An existing shipment' },
  { value: 'warehousing', label: 'Warehousing & fulfillment' },
  { value: 'enterprise', label: 'Enterprise logistics' },
  { value: 'partnership', label: 'Carrier or partner enquiry' },
  { value: 'careers', label: 'Careers' },
];

interface ContactValues {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof ContactValues, string>>;

const INITIAL: ContactValues = { name: '', email: '', company: '', topic: '', message: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function validate(values: ContactValues): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email, e.g. you@company.com.';
  }
  if (!values.topic) errors.topic = 'Choose what this is about.';
  if (!values.message.trim()) {
    errors.message = 'Tell us how we can help.';
  } else if (values.message.trim().length < 15) {
    errors.message = 'A little more detail helps us route your message.';
  }
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const reduced = useReducedMotion();

  function update<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
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
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    setPending(true);
    await sleep(1100);
    setPending(false);
    setSent(true);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div
          key="sent"
          role="status"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="rounded-4xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12"
        >
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">Message received</h2>
          <p className="mx-auto mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink-500">
            Thanks, {values.name.split(' ')[0]}. A FreightBridge Logistics specialist will reply to {values.email} shortly —
            usually within one business hour.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setValues(INITIAL);
                setErrors({});
                setSubmitted(false);
                setSent(false);
              }}
            >
              Send another message
            </Button>
            <Button href="/quote" size="lg">
              Request a quote
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
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Send us a message</h2>
          <p className="mt-2 text-[0.95rem] text-ink-500">
            Tell us what you need and we will route it to the right specialist.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
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
              id="company"
              label="Company"
              autoComplete="organization"
              hint="Optional"
              placeholder="Northline Supply Co."
              value={values.company}
              onChange={(event) => update('company', event.target.value)}
            />
            <SelectField
              id="topic"
              label="What is this about?"
              required
              placeholder="Select a topic"
              options={TOPICS}
              value={values.topic}
              onChange={(event) => update('topic', event.target.value)}
              error={errors.topic}
            />
          </div>

          <div className="mt-4">
            <TextAreaField
              id="message"
              label="Message"
              required
              placeholder="Lanes, volumes, timing — whatever matters most for your shipment."
              value={values.message}
              onChange={(event) => update('message', event.target.value)}
              error={errors.message}
            />
          </div>

          <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xs text-sm text-ink-400">We reply to every message from a real person.</p>
            <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="h-[1.05rem] w-[1.05rem] animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <Send className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
