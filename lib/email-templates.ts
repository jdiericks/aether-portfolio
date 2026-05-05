import {
  emailButton,
  escapeHtml,
  getEmailBranding,
  renderEmailLayout,
  sendEmail,
  type SendEmailResult,
} from "./email";

// ---------------------------------------------------------------------------
// Team invite
// ---------------------------------------------------------------------------

export async function sendTeamInviteEmail(opts: {
  to: string;
  recipientName: string;
  roleName: string;
  inviterName: string;
  loginUrl: string;
  temporaryPassword?: string;
}): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">Welcome to ${escapeHtml(branding.brandName)}</h1>
    <p>Hi ${escapeHtml(opts.recipientName)},</p>
    <p>${escapeHtml(opts.inviterName)} has invited you to join <strong>${escapeHtml(branding.brandName)}</strong> as a <strong>${escapeHtml(opts.roleName)}</strong>.</p>
    ${
      opts.temporaryPassword
        ? `<p>Your temporary password is:</p>
           <p style="font-family:ui-monospace,Menlo,Monaco,monospace;background:#f3f4f6;padding:10px 14px;border-radius:6px;display:inline-block;font-size:14px;">${escapeHtml(opts.temporaryPassword)}</p>
           <p style="margin-top:14px;color:#6b7280;font-size:13px;">Please change it after your first login from <strong>Account Settings</strong>.</p>`
        : ""
    }
    ${emailButton({ href: opts.loginUrl, label: "Sign in", branding })}
    <p style="color:#6b7280;font-size:13px;">If you didn't expect this invitation, you can safely ignore this email.</p>
  `;
  return sendEmail({
    to: opts.to,
    subject: `You've been invited to ${branding.brandName}`,
    html: renderEmailLayout({ branding, body, preheader: `Join ${branding.brandName} as a ${opts.roleName}.` }),
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(opts: {
  to: string;
  recipientName: string;
  resetUrl: string;
  ttlMinutes: number;
}): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">Reset your password</h1>
    <p>Hi ${escapeHtml(opts.recipientName)},</p>
    <p>We received a request to reset your password for <strong>${escapeHtml(branding.brandName)}</strong>. Click the button below to choose a new one. The link expires in ${opts.ttlMinutes} minutes.</p>
    ${emailButton({ href: opts.resetUrl, label: "Reset password", branding })}
    <p style="color:#6b7280;font-size:13px;">If you didn't request a reset, you can ignore this email — your password will stay the same.</p>
  `;
  return sendEmail({
    to: opts.to,
    subject: `Reset your ${branding.brandName} password`,
    html: renderEmailLayout({ branding, body, preheader: "Reset your password." }),
  });
}

// ---------------------------------------------------------------------------
// Inquiry notification (admin → recipient)
// ---------------------------------------------------------------------------

export async function sendInquiryNotificationEmail(opts: {
  to: string;
  inquiryName: string;
  inquiryEmail: string;
  inquiryEventType?: string | null;
  inquiryMessage: string;
  adminUrl: string;
}): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const eventLine = opts.inquiryEventType
    ? `<p style="margin:0 0 8px;"><strong>Type:</strong> ${escapeHtml(opts.inquiryEventType)}</p>`
    : "";
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">New inquiry from ${escapeHtml(opts.inquiryName)}</h1>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(opts.inquiryName)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(opts.inquiryEmail)}" style="color:${branding.primary};">${escapeHtml(opts.inquiryEmail)}</a></p>
    ${eventLine}
    <div style="margin-top:16px;padding:14px 16px;background:#f3f4f6;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.5;">${escapeHtml(opts.inquiryMessage)}</div>
    ${emailButton({ href: opts.adminUrl, label: "Open in admin", branding })}
  `;
  return sendEmail({
    to: opts.to,
    subject: `New inquiry from ${opts.inquiryName}`,
    html: renderEmailLayout({ branding, body, preheader: `${opts.inquiryName} <${opts.inquiryEmail}>` }),
    replyTo: opts.inquiryEmail,
  });
}

// ---------------------------------------------------------------------------
// Audit form auto-reply (lead → confirmation)
// ---------------------------------------------------------------------------

export async function sendAuditConfirmationEmail(opts: {
  to: string;
  recipientName: string;
}): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const siteUrl = branding.siteUrl || "";
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">Thanks, ${escapeHtml(opts.recipientName)} — we got your audit request.</h1>
    <p>The team at <strong>${escapeHtml(branding.brandName)}</strong> will review your AI Readiness Audit and follow up within one business day with concrete next steps.</p>
    ${siteUrl ? emailButton({ href: siteUrl, label: "Visit our site", branding }) : ""}
    <p style="color:#6b7280;font-size:13px;">In the meantime, feel free to reply directly to this email if you have additional context to share.</p>
  `;
  return sendEmail({
    to: opts.to,
    subject: `We received your audit request — ${branding.brandName}`,
    html: renderEmailLayout({ branding, body, preheader: "We'll be in touch within one business day." }),
  });
}

// ---------------------------------------------------------------------------
// 2FA recovery codes
// ---------------------------------------------------------------------------

export async function send2faRecoveryCodesEmail(opts: {
  to: string;
  recipientName: string;
  codes: string[];
}): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const codesHtml = opts.codes
    .map(
      (code) =>
        `<li style="font-family:ui-monospace,Menlo,Monaco,monospace;font-size:14px;padding:4px 0;">${escapeHtml(code)}</li>`,
    )
    .join("");
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">Your two-factor recovery codes</h1>
    <p>Hi ${escapeHtml(opts.recipientName)},</p>
    <p>You enabled two-factor authentication on your <strong>${escapeHtml(branding.brandName)}</strong> account. Save these single-use recovery codes somewhere safe — each one can be used to sign in if you lose access to your authenticator app.</p>
    <ul style="margin:16px 0;padding:14px 24px;background:#f3f4f6;border-radius:8px;list-style:disc;">
      ${codesHtml}
    </ul>
    <p style="color:#6b7280;font-size:13px;">If you didn't enable 2FA, sign in immediately and disable it from Account Settings.</p>
  `;
  return sendEmail({
    to: opts.to,
    subject: `Your ${branding.brandName} recovery codes`,
    html: renderEmailLayout({ branding, body, preheader: "Save these recovery codes somewhere safe." }),
  });
}

// ---------------------------------------------------------------------------
// Test email (used by /admin/email)
// ---------------------------------------------------------------------------

export async function sendTestEmail(to: string): Promise<SendEmailResult> {
  const branding = await getEmailBranding();
  const body = `
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">Test email — looking good</h1>
    <p>This is a test message sent from your <strong>${escapeHtml(branding.brandName)}</strong> admin to confirm Resend is configured correctly.</p>
    <p>If you can read this, your buyers can too.</p>
  `;
  return sendEmail({
    to,
    subject: `Test email from ${branding.brandName}`,
    html: renderEmailLayout({ branding, body, preheader: "Resend is configured correctly." }),
  });
}
