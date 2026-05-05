import { Resend } from "resend";
import { getSiteContent } from "./site-content";

// ---------------------------------------------------------------------------
// Resend client
// ---------------------------------------------------------------------------

let cachedClient: Resend | null = null;
function getClient(): Resend | null {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cachedClient = new Resend(key);
  return cachedClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// ---------------------------------------------------------------------------
// Branding context for emails
// ---------------------------------------------------------------------------

export interface EmailBranding {
  productName: string;
  brandName: string;
  fromAddress: string;
  fromName: string;
  replyTo: string | null;
  notificationEmail: string | null;
  primary: string;
  primaryFg: string;
  background: string;
  foreground: string;
  siteUrl: string;
  logoUrl: string | null;
  showPoweredBy: boolean;
  poweredByText: string;
  poweredByUrl: string;
}

export async function getEmailBranding(): Promise<EmailBranding> {
  const content = await getSiteContent();
  const productName = content.branding_product_name || content.brand_name || "Aether";
  const brandName = content.brand_name || productName;
  const fromName = content.email_from_name || brandName;
  const fromAddress =
    content.email_from_address ||
    process.env.EMAIL_FROM ||
    "no-reply@example.com";
  const replyTo = content.email_reply_to || content.contact_email || null;
  const notificationEmail =
    content.email_notification_recipient || content.contact_email || null;

  const showPoweredBy = (content.branding_show_powered_by ?? "true") !== "false";
  const poweredByText =
    content.branding_powered_by_text || `Powered by ${productName}`;
  const poweredByUrl = content.branding_powered_by_url || "";

  return {
    productName,
    brandName,
    fromName,
    fromAddress,
    replyTo,
    notificationEmail,
    primary: content.theme_primary || "#171717",
    primaryFg: content.theme_primary_foreground || "#ffffff",
    background: content.theme_background || "#ffffff",
    foreground: content.theme_foreground || "#171717",
    siteUrl: (content.seo_site_url || process.env.NEXTAUTH_URL || "").replace(/\/$/, ""),
    logoUrl: content.brand_logo_url || null,
    showPoweredBy,
    poweredByText,
    poweredByUrl,
  };
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Override the From address. Defaults to branding from address. */
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Send a transactional email via Resend. If RESEND_API_KEY is missing the
 * email is logged to stdout and the call returns `{ ok: true, skipped: true }`,
 * so dev/staging deploys without email credentials don't crash.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getClient();
  const branding = await getEmailBranding();

  const from =
    options.from ||
    `${branding.fromName} <${branding.fromAddress}>`;
  const replyTo = options.replyTo || branding.replyTo || undefined;

  if (!client) {
    console.warn("[email] RESEND_API_KEY not configured, email not sent.", {
      to: options.to,
      subject: options.subject,
    });
    return { ok: true, skipped: true };
  }

  try {
    const result = await client.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] sendEmail threw:", message);
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Branded HTML wrapper used by every template
// ---------------------------------------------------------------------------

export function renderEmailLayout(opts: {
  branding: EmailBranding;
  preheader?: string;
  body: string;
}): string {
  const { branding, preheader, body } = opts;
  const safePreheader = preheader ? escapeHtml(preheader) : "";
  const productName = escapeHtml(branding.productName);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${productName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${branding.foreground};">
  ${safePreheader ? `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">${safePreheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${branding.background};border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
              ${
                branding.logoUrl
                  ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.brandName)}" style="height:36px;width:auto;display:block;" />`
                  : `<div style="font-weight:700;font-size:18px;color:${branding.foreground};">${escapeHtml(branding.brandName)}</div>`
              }
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;color:${branding.foreground};">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#fafafa;font-size:12px;color:#6b7280;">
              <div>${escapeHtml(branding.brandName)}</div>
              ${
                branding.showPoweredBy && branding.poweredByText
                  ? `<div style="margin-top:6px;">${
                      branding.poweredByUrl
                        ? `<a href="${escapeHtml(branding.poweredByUrl)}" style="color:#6b7280;text-decoration:none;">${escapeHtml(branding.poweredByText)}</a>`
                        : escapeHtml(branding.poweredByText)
                    }</div>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(opts: {
  href: string;
  label: string;
  branding: EmailBranding;
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td>
      <a href="${escapeHtml(opts.href)}" style="display:inline-block;padding:12px 22px;background:${opts.branding.primary};color:${opts.branding.primaryFg};text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(opts.label)}</a>
    </td></tr>
  </table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
