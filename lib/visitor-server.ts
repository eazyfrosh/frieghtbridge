import 'server-only';
import { createHmac } from 'node:crypto';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { VISITOR_TTL, visitorEmail, type VisitorMetadata } from './visitor';

// Shared transactional gates, not process memory: Vercel can run many instances.
export async function reserveVisitor(db: Firestore, visitorId: string, ip: string, secret: string, now = Date.now()) {
  const session = db.collection('visitor_alert_limits').doc(`session-${visitorId}`);
  const day = Math.floor(now / VISITOR_TTL);
  // Daily keyed digest: never store the raw IP or a persistent IP identifier.
  const digest = createHmac('sha256', secret).update(`${day}:${ip}`).digest('hex');
  const windows = [
    { key: `ip-${digest}`, duration: 3_600_000, max: 3 },
    { key: 'global-minute', duration: 60_000, max: 5 },
    { key: 'global-day', duration: VISITOR_TTL, max: 40 },
  ];
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(session);
    if (existing.exists && Number(existing.data()?.until) > now) return 'duplicate' as const;
    const refs = windows.map((window) => db.collection('visitor_alert_limits').doc(window.key));
    const snapshots = await tx.getAll(...refs);
    const values = windows.map((window, index) => {
      const data = snapshots[index].data();
      const active = Number(data?.until) > now;
      return { count: active ? Number(data?.count) || 0 : 0, until: active ? Number(data?.until) : now + window.duration };
    });
    if (values.some((value, index) => value.count >= windows[index].max)) return 'limited' as const;
    refs.forEach((ref, index) => tx.set(ref, {
      count: values[index].count + 1, until: values[index].until,
      expiresAt: Timestamp.fromMillis(values[index].until + VISITOR_TTL),
    }));
    tx.set(session, { until: now + VISITOR_TTL, expiresAt: Timestamp.fromMillis(now + VISITOR_TTL * 2) });
    return 'reserved' as const;
  }, { maxAttempts: 3 });
}

export async function notifyVisitor(db: Firestore, visitor: VisitorMetadata, config: { key: string; from: string; to: string; siteUrl: string }) {
  // Independent from analytics writes: a denied/quota-exceeded analytics write
  // cannot prevent an alert after the durable rate-limit reservation succeeded.
  const analytics = db.collection('website_visitors').doc(visitor.visitorId).set({
    ...visitor, createdAt: Timestamp.fromDate(new Date(visitor.createdAt)),
    expiresAt: Timestamp.fromMillis(Date.now() + 30 * VISITOR_TTL),
  }).catch(() => { console.error('[visitor] analytics write failed'); });
  let sent = false;
  try {
    const { data, error } = await new Resend(config.key).emails.send({
      from: config.from, to: [config.to], ...visitorEmail(visitor, config.siteUrl),
    }, { idempotencyKey: `visitor-${visitor.visitorId}` });
    sent = Boolean(data?.id && !error);
    if (!sent) console.error('[visitor] Resend rejected alert', error?.name || 'missing-id');
  } catch { console.error('[visitor] Resend request failed'); }
  await analytics;
  return sent;
}
