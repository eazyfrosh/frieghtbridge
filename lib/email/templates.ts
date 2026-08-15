/**
 * Shipment notification templates.
 *
 * Templates are plain text with `{{placeholder}}` markers, not HTML. That is a
 * deliberate limit: the operator edits wording, and the branded HTML shell is
 * generated around it. Letting people paste HTML into a field that gets mailed
 * out invites both broken layouts in Outlook and an injection surface, for the
 * sake of formatting almost nobody wants to hand-write.
 *
 * The defaults here are the fallback whenever Firestore has no override, so a
 * fresh deployment can send sensible mail before anyone edits anything.
 */

export interface EmailTemplate {
  id: string;
  /** Shown in the admin list. */
  name: string;
  /** When an operator would send it. */
  description: string;
  subject: string;
  body: string;
}

/** Every marker a template may use, with the label shown in the editor. */
export const PLACEHOLDERS: Array<{ token: string; label: string }> = [
  { token: 'recipientName', label: "Recipient's name" },
  { token: 'trackingNumber', label: 'Tracking number' },
  { token: 'status', label: 'Current status' },
  { token: 'service', label: 'Service level' },
  { token: 'origin', label: 'Origin' },
  { token: 'destination', label: 'Destination' },
  { token: 'currentLocation', label: 'Current location' },
  { token: 'carrier', label: 'Carrier' },
  { token: 'pieces', label: 'Piece count' },
  { token: 'weight', label: 'Weight' },
  { token: 'estimatedDelivery', label: 'Estimated delivery date' },
  { token: 'trackingUrl', label: 'Link to the tracking page' },
  { token: 'companyName', label: 'Your company name' },
];

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'booked',
    name: 'Shipment booked',
    description: 'Send when a booking is confirmed and the shipment has a tracking number.',
    subject: 'Your shipment {{trackingNumber}} is booked',
    body: `Hi {{recipientName}},

Your shipment is booked and ready to move.

Tracking number: {{trackingNumber}}
From: {{origin}}
To: {{destination}}
Service: {{service}}
Estimated delivery: {{estimatedDelivery}}

You can follow it here at any time:
{{trackingUrl}}

We'll email you again when it's collected.

{{companyName}}`,
  },
  {
    id: 'picked-up',
    name: 'Picked up / in transit',
    description: 'Send once the freight has been collected and is moving.',
    subject: '{{trackingNumber}} is on its way',
    body: `Hi {{recipientName}},

Good news — your shipment has been collected and is now in transit.

Tracking number: {{trackingNumber}}
Currently at: {{currentLocation}}
Heading to: {{destination}}
Carrier: {{carrier}}
Estimated delivery: {{estimatedDelivery}}

Live status: {{trackingUrl}}

{{companyName}}`,
  },
  {
    id: 'out-for-delivery',
    name: 'Out for delivery',
    description: 'Send on the morning of delivery so someone is there to receive it.',
    subject: '{{trackingNumber}} is out for delivery today',
    body: `Hi {{recipientName}},

Your shipment is out for delivery and should arrive today.

Tracking number: {{trackingNumber}}
Delivering to: {{destination}}
Pieces: {{pieces}} ({{weight}})

Please make sure someone is available to sign for it.

Live status: {{trackingUrl}}

{{companyName}}`,
  },
  {
    id: 'delivered',
    name: 'Delivered',
    description: 'Send once delivery is confirmed.',
    subject: '{{trackingNumber}} has been delivered',
    body: `Hi {{recipientName}},

Your shipment has been delivered to {{destination}}.

Tracking number: {{trackingNumber}}
Pieces: {{pieces}} ({{weight}})

If anything doesn't look right, reply to this email and we'll look into it
straight away.

Thanks for shipping with us.

{{companyName}}`,
  },
  {
    id: 'delayed',
    name: 'Delayed',
    description: 'Send as soon as a delay is known — before the customer notices it themselves.',
    subject: 'Update on your shipment {{trackingNumber}}',
    body: `Hi {{recipientName}},

We want to let you know your shipment is running behind schedule.

Tracking number: {{trackingNumber}}
Currently at: {{currentLocation}}
Revised estimated delivery: {{estimatedDelivery}}

We're sorry for the inconvenience. We're monitoring this shipment closely and
will update you as soon as anything changes.

Live status: {{trackingUrl}}

{{companyName}}`,
  },
];

export function defaultTemplate(id: string): EmailTemplate | null {
  return DEFAULT_TEMPLATES.find((template) => template.id === id) ?? null;
}

/**
 * Substitute `{{token}}` markers.
 *
 * Unknown markers are left exactly as written rather than replaced with an
 * empty string: a visible `{{recipeintName}}` in the preview shows the operator
 * their typo, where a silent blank would ship a broken email.
 */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, token: string) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : whole,
  );
}

/** Markers used in the text that nothing will replace. */
export function unknownPlaceholders(text: string): string[] {
  const known = new Set(PLACEHOLDERS.map((p) => p.token));
  const found = new Set<string>();
  for (const match of text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!known.has(match[1])) found.add(match[1]);
  }
  return [...found];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wrap the plain-text body in a branded HTML email.
 *
 * Table layout and inline styles, because that is what mail clients render
 * predictably — Outlook still ignores most of a stylesheet. Everything
 * interpolated is escaped: the body is operator-authored, but a shipment field
 * is not, and an address containing `<` should not be able to reshape the mail.
 */
export function renderHtml(body: string, options: { companyName: string; trackingUrl?: string }): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const withLinks = escapeHtml(block).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#C24500;text-decoration:underline;">$1</a>',
      );
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#2b2b2b;">${withLinks.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  const button = options.trackingUrl
    ? `<p style="margin:24px 0 0;">
         <a href="${escapeHtml(options.trackingUrl)}"
            style="display:inline-block;background:#FF6A00;color:#111111;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
           Track this shipment
         </a>
       </p>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F7F5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e6e3;">
        <tr><td style="background:#111111;padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;font-family:Helvetica,Arial,sans-serif;">
            ${escapeHtml(options.companyName)}
          </span>
        </td></tr>
        <tr><td style="padding:28px;font-family:Helvetica,Arial,sans-serif;">
          ${paragraphs}
          ${button}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#F7F7F5;border-top:1px solid #e6e6e3;font-family:Helvetica,Arial,sans-serif;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#8a8a85;">
            You're receiving this because you have a shipment with ${escapeHtml(options.companyName)}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
