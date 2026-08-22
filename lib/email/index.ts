import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../firebase/admin';
import { SITE } from '../site';
import { resolveShipment, type Shipment } from '../tracking';
import { formatDate } from '../utils';
import {
  DEFAULT_TEMPLATES,
  defaultTemplate,
  fillPlaceholders,
  renderHtml,
  type EmailTemplate,
} from './templates';

/**
 * Shipment notification email.
 *
 * Sending goes through Resend's HTTP API with `fetch` — no SDK. That is a
 * deliberate choice after `firebase-admin` failed to import on Vercel over a
 * CommonJS/ESM conflict deep in its dependencies: a provider that needs one
 * POST request does not justify a dependency that can break the deployment.
 * Swapping providers means rewriting `deliver()` and nothing else.
 *
 * Templates are the defaults in `templates.ts` unless an operator has edited
 * one, in which case the override lives in Firestore. Editing never destroys
 * the original, so "reset" is always available.
 */

const TEMPLATES = 'emailTemplates';
const LOG = 'emailLog';
const MAX_SUBJECT = 200;
const MAX_BODY = 8000;

// ---------------------------------------------------------------------------
// Configuration

export function emailFrom(): string | null {
  return process.env.EMAIL_FROM?.trim() || null;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && emailFrom());
}

/** Why sending is unavailable, for the operator rather than the visitor. */
export function emailConfigError(): string | null {
  if (!process.env.RESEND_API_KEY?.trim()) return 'RESEND_API_KEY is not set on this deployment.';
  if (!emailFrom()) return 'EMAIL_FROM is not set on this deployment.';
  return null;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE.url).replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// Template storage

export interface StoredTemplate extends EmailTemplate {
  /** True when an operator has edited it away from the shipped default. */
  edited: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

function merge(base: EmailTemplate, data: FirebaseFirestore.DocumentData | undefined): StoredTemplate {
  const hasOverride =
    Boolean(data) && (typeof data?.subject === 'string' || typeof data?.body === 'string');

  return {
    ...base,
    subject: typeof data?.subject === 'string' ? data.subject : base.subject,
    body: typeof data?.body === 'string' ? data.body : base.body,
    edited: hasOverride,
    updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : null,
  };
}

/**
 * All templates, defaults merged with any overrides.
 *
 * The default list drives the result, so a stray document in Firestore cannot
 * introduce a template the code does not know how to send.
 */
export async function listTemplates(): Promise<StoredTemplate[]> {
  const db = adminDb();
  if (!db) return DEFAULT_TEMPLATES.map((base) => merge(base, undefined));

  const snapshot = await db.collection(TEMPLATES).get();
  const overrides = new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
  return DEFAULT_TEMPLATES.map((base) => merge(base, overrides.get(base.id)));
}

export async function getTemplate(id: string): Promise<StoredTemplate | null> {
  const base = defaultTemplate(id);
  if (!base) return null;

  const db = adminDb();
  if (!db) return merge(base, undefined);

  const doc = await db.collection(TEMPLATES).doc(id).get();
  return merge(base, doc.data());
}

export async function saveTemplate(
  id: string,
  input: { subject: string; body: string },
  editor: string,
): Promise<StoredTemplate | null> {
  if (!defaultTemplate(id)) return null;

  const db = adminDb();
  if (!db) return null;

  await db.collection(TEMPLATES).doc(id).set({
    subject: input.subject,
    body: input.body,
    updatedAt: Timestamp.now(),
    updatedBy: editor,
  });

  return getTemplate(id);
}

/** Delete the override; the shipped default takes over again. */
export async function resetTemplate(id: string): Promise<StoredTemplate | null> {
  if (!defaultTemplate(id)) return null;

  const db = adminDb();
  if (!db) return null;

  await db.collection(TEMPLATES).doc(id).delete();
  return getTemplate(id);
}

export function validTemplateText(subject: unknown, body: unknown): { subject: string; body: string } | null {
  if (typeof subject !== 'string' || typeof body !== 'string') return null;
  const s = subject.trim();
  const b = body.trim();
  if (!s || s.length > MAX_SUBJECT) return null;
  if (!b || b.length > MAX_BODY) return null;
  return { subject: s, body: b };
}

// ---------------------------------------------------------------------------
// Rendering

/**
 * Placeholder values for a shipment.
 *
 * `resolveShipment` is what the tracking page uses, so the date in the email
 * is the same date the customer sees when they follow the link — rather than a
 * second calculation that can drift from it.
 */
export function shipmentVariables(shipment: Shipment, recipientName: string): Record<string, string> {
  const resolved = resolveShipment(shipment);

  return {
    recipientName: recipientName.trim() || 'there',
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    service: shipment.service,
    origin: shipment.origin,
    destination: shipment.destination,
    currentLocation: shipment.currentLocation,
    carrier: shipment.carrier,
    pieces: String(shipment.pieces),
    weight: shipment.weight,
    // Formatted, not the raw ISO string. `resolveShipment` returns a timestamp
    // for the UI to render, and dropping that straight into an email put
    // "Estimated delivery: 2026-08-16T23:29:02.613Z" in front of a customer.
    estimatedDelivery: formatDate(resolved.estimatedDelivery),
    trackingUrl: `${siteUrl()}/tracking?number=${encodeURIComponent(shipment.trackingNumber)}`,
    // For freight moving on another carrier's network. Not used by any shipped
    // template — an operator who wants the carrier's own reference in the
    // wording can add `{{carrierTrackingNumber}}`, and it reads "not issued
    // yet" rather than blank on a shipment that has no number from them. There
    // is no matching URL placeholder: `{{trackingUrl}}` already points at our
    // own page, which is where the shipment is tracked.
    carrierTrackingNumber: resolved.carrierTrackingNumber ?? 'not issued yet',
    companyName: SITE.name,
  };
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderTemplate(
  template: Pick<EmailTemplate, 'subject' | 'body'>,
  variables: Record<string, string>,
): RenderedEmail {
  const subject = fillPlaceholders(template.subject, variables);
  const text = fillPlaceholders(template.body, variables);

  return {
    subject,
    text,
    html: renderHtml(text, { companyName: variables.companyName ?? SITE.name, trackingUrl: variables.trackingUrl }),
  };
}

// ---------------------------------------------------------------------------
// Delivery

export interface SendResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/**
 * The only provider-specific code in the module.
 *
 * A text alternative goes alongside the HTML: some clients prefer it, spam
 * filters expect it, and it is free — we authored the plain text first.
 */
async function deliver(to: string, email: RenderedEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = emailFrom();
  if (!apiKey || !from) return { ok: false, error: emailConfigError() ?? 'Email is not configured.' };

  // Overridable so the send path can be exercised against a stub, and so a
  // deployment behind an egress gateway can point at it. Defaults to Resend.
  const endpoint = process.env.RESEND_API_URL?.trim() || 'https://api.resend.com/emails';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(process.env.EMAIL_REPLY_TO?.trim() ? { reply_to: process.env.EMAIL_REPLY_TO.trim() } : {}),
      }),
    });

    const raw = await response.text();
    let payload: { id?: string; message?: string; name?: string } = {};
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      // Not JSON. An egress proxy or gateway refusing the request answers in
      // plain text, and that text is the only clue to what actually happened.
    }

    if (!response.ok) {
      // Resend explains refusals properly — unverified domain, invalid from
      // address. Passing that through is the difference between a fixable
      // report and "sending failed". When there is no JSON message, fall back
      // to the body rather than only the status code.
      const detail = payload.message ?? raw.trim().slice(0, 200);
      return { ok: false, error: detail ? `${response.status}: ${detail}` : `Provider returned ${response.status}.` };
    }

    return { ok: true, id: payload.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the email provider.' };
  }
}

export interface SendLogEntry {
  id: string;
  trackingNumber: string;
  templateId: string;
  templateName: string;
  to: string;
  subject: string;
  sentAt: string;
  sentBy: string;
  ok: boolean;
  error: string | null;
}

/**
 * Send one shipment notification and record the attempt.
 *
 * Failures are logged too. An operator needs to know that Tuesday's delay
 * notice never left the building, and a log that only contains successes
 * cannot tell them.
 */
export async function sendShipmentEmail(input: {
  templateId: string;
  to: string;
  recipientName: string;
  shipment: Shipment;
  sentBy: string;
}): Promise<SendResult> {
  const template = await getTemplate(input.templateId);
  if (!template) return { ok: false, error: 'Unknown template.' };

  const rendered = renderTemplate(template, shipmentVariables(input.shipment, input.recipientName));
  const result = await deliver(input.to, rendered);

  const db = adminDb();
  if (db) {
    await db
      .collection(LOG)
      .add({
        trackingNumber: input.shipment.trackingNumber,
        templateId: template.id,
        templateName: template.name,
        to: input.to,
        subject: rendered.subject,
        sentAt: Timestamp.now(),
        sentBy: input.sentBy,
        ok: result.ok,
        error: result.error ?? null,
      })
      .catch((error) => {
        // Never fail a delivered email because the audit write failed.
        console.error('[email] could not write send log:', error);
      });
  }

  return result;
}

/** What has been sent about one shipment, newest first. */
export async function sendsFor(trackingNumber: string, limit = 20): Promise<SendLogEntry[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    // Equality only, then sort here. Adding `.orderBy('sentAt')` to a filter on
    // a different field would demand a composite index, which Firestore reports
    // as a failed query with a console link — a broken page until someone
    // clicks it. A shipment accumulates a handful of notifications, so fetching
    // them and ordering in memory costs nothing and needs no setup.
    const snapshot = await db
      .collection(LOG)
      .where('trackingNumber', '==', trackingNumber)
      .limit(100)
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        trackingNumber: data.trackingNumber ?? trackingNumber,
        templateId: data.templateId ?? '',
        templateName: data.templateName ?? '',
        to: data.to ?? '',
        subject: data.subject ?? '',
        sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate().toISOString() : new Date(0).toISOString(),
        sentBy: data.sentBy ?? '',
        ok: data.ok !== false,
        error: data.error ?? null,
      };
    });

    return entries.sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, limit);
  } catch (error) {
    // The history is context, not the point of the page. Losing it should not
    // stop an operator sending the next notification.
    console.error('[email] send log query failed:', error);
    return [];
  }
}
