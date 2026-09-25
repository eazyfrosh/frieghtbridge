/** Shared, non-secret visitor metadata and email formatting helpers. */
export const VISITOR_TTL = 24 * 60 * 60 * 1000;
export const VISITOR_COOKIE = 'fb_visitor';
export const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ignoredVisitorPage(page: string): boolean {
  return !page.startsWith('/') || page.startsWith('//') || /[\\\x00-\x1f]/.test(page) ||
    /^\/(?:admin|api|_next|health|healthz)(?:\/|$)/i.test(page) || /\.[a-z0-9]{1,8}$/i.test(page);
}

export function isBot(ua: string): boolean {
  return !ua || /bot|crawler|spider|slurp|headless|lighthouse|pagespeed|curl|wget|python|uptime|monitor|facebookexternalhit|preview/i.test(ua);
}

export function deviceInfo(ua: string) {
  return {
    device: /ipad|tablet|kindle|silk|android(?!.*mobile)/i.test(ua) ? 'Tablet' : /mobile|iphone|ipod/i.test(ua) ? 'Mobile' : 'Desktop',
    browser: /edg(?:e|a|ios)?\//i.test(ua) ? 'Edge' : /opr\//i.test(ua) ? 'Opera' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Unknown',
    operatingSystem: /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /cros/i.test(ua) ? 'ChromeOS' : /macintosh|mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Unknown',
  };
}

export function referrerSource(value: unknown): string {
  if (typeof value !== 'string' || !value) return 'Direct / Unknown';
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.hostname.slice(0, 253) : 'Unknown';
  } catch { return 'Unknown'; }
}

export interface VisitorMetadata {
  visitorId: string;
  country: string;
  region: string;
  city: string;
  page: string;
  referrer: string;
  device: string;
  browser: string;
  operatingSystem: string;
  hostname: string;
  createdAt: string;
}

export function visitorMetadata(headers: Headers, input: { visitorId: string; page: string; referrer?: unknown }, site: URL, vercel: boolean): VisitorMetadata {
  function geo(name: string) {
    if (!vercel) return 'Unknown';
    const value = headers.get(name);
    if (!value) return 'Unknown';
    try { return decodeURIComponent(value).replace(/[\x00-\x1f]/g, '').slice(0, 100) || 'Unknown'; }
    catch { return 'Unknown'; }
  }
  const countryCode = geo('x-vercel-ip-country');
  let country = countryCode;
  if (/^[A-Z]{2}$/.test(countryCode)) {
    try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode; } catch { /* keep code */ }
  }
  return {
    visitorId: input.visitorId, country,
    city: geo('x-vercel-ip-city'), region: geo('x-vercel-ip-country-region'),
    page: input.page, referrer: referrerSource(input.referrer),
    ...deviceInfo(headers.get('user-agent') || ''),
    hostname: site.hostname, createdAt: new Date().toISOString(),
  };
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function visitorEmail(visitor: VisitorMetadata, siteUrl: string) {
  const rows = [
    ['Country', visitor.country], ['City/Region', `${visitor.city} / ${visitor.region}`],
    ['Page', visitor.page], ['Source', visitor.referrer], ['Device', visitor.device],
    ['Browser', visitor.browser], ['Operating System', visitor.operatingSystem],
    ['Time', `${visitor.createdAt} (UTC)`], ['Website', visitor.hostname],
  ];
  return {
    subject: '🔔 New Visitor on Your Logistics Website',
    text: `New Website Visitor\n\n${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nOpen Website: ${siteUrl}`,
    html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#222;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:white;border:1px solid #e6e6e6;border-radius:12px;">
<tr><td style="padding:24px;background:#111;color:white;"><h1 style="margin:0;font-size:24px;">New Website Visitor</h1><p style="margin:8px 0 0;font-size:14px;">FreightBridge Logistics</p></td></tr>
<tr><td style="padding:24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout:fixed;">
${rows.map(([label, value]) => `<tr><td width="38%" style="padding:10px 8px 10px 0;vertical-align:top;font-size:14px;color:#666;border-bottom:1px solid #eee;">${label}</td><td style="padding:10px 0;font-size:14px;line-height:1.5;overflow-wrap:anywhere;word-break:break-word;border-bottom:1px solid #eee;">${escape(value)}</td></tr>`).join('')}
</table><p style="margin:24px 0 8px;"><a href="${escape(siteUrl)}" style="display:inline-block;padding:14px 22px;background:#c24500;color:white;font-weight:bold;text-decoration:none;border-radius:8px;">Open Website</a></p>
<p style="font-size:12px;color:#666;line-height:1.5;">Location is approximate. Unknown details are unavailable from the request.</p></td></tr></table></td></tr></table></body></html>`,
  };
}
