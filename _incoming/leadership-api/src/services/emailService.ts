import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to:   [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

async function sendViaSMTP(payload: EmailPayload): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST ?? 'localhost',
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to:   payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    if (env.RESEND_API_KEY) {
      await sendViaResend(payload);
    } else if (env.SMTP_HOST) {
      await sendViaSMTP(payload);
    } else {
      // Development: log email to console
      logger.info(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
      logger.debug(`[EMAIL BODY]\n${payload.text ?? payload.html}`);
    }
  } catch (err) {
    logger.error('Failed to send email:', err);
    throw err;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseLayout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b}
  .container{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  .header{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:24px;font-weight:600;letter-spacing:-.3px}
  .header p{margin:8px 0 0;color:#c7d2fe;font-size:14px}
  .body{padding:40px}
  .body h2{margin:0 0 16px;font-size:20px;font-weight:600;color:#1e293b}
  .body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569}
  .btn{display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff !important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;margin:8px 0 24px}
  .code{display:inline-block;padding:12px 24px;background:#f1f5f9;border-radius:8px;font-family:monospace;font-size:24px;font-weight:700;letter-spacing:4px;color:#4f46e5;margin:8px 0 24px}
  .footer{padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:13px;color:#94a3b8}
  .divider{height:1px;background:#e2e8f0;margin:24px 0}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>LeaderAssess Pro</h1>
    <p>Enterprise Leadership Assessment Platform</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} LeaderAssess Pro. All rights reserved.</p>
    <p>If you didn't request this email, you can safely ignore it.</p>
  </div>
</div>
</body>
</html>`;
}

export function verifyEmailTemplate(name: string, verifyUrl: string): EmailPayload['html'] {
  return baseLayout(`
    <h2>Verify your email address</h2>
    <p>Hi ${name}, welcome to LeaderAssess Pro! Please verify your email address to activate your account.</p>
    <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#94a3b8">This link expires in 24 hours. If the button doesn't work, copy this URL:<br>
    <span style="color:#4f46e5;word-break:break-all">${verifyUrl}</span></p>
  `, 'Verify your email — LeaderAssess Pro');
}

export function resetPasswordTemplate(name: string, resetUrl: string): EmailPayload['html'] {
  return baseLayout(`
    <h2>Reset your password</h2>
    <p>Hi ${name}, we received a request to reset the password for your account.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#94a3b8">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `, 'Reset your password — LeaderAssess Pro');
}

export function inviteUserTemplate(inviterName: string, inviteUrl: string, role: string): EmailPayload['html'] {
  return baseLayout(`
    <h2>You've been invited</h2>
    <p><strong>${inviterName}</strong> has invited you to join LeaderAssess Pro as a <strong>${role}</strong>.</p>
    <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#94a3b8">This invitation expires in 7 days.</p>
  `, 'You\'ve been invited — LeaderAssess Pro');
}

export function assessmentCompleteTemplate(name: string, module: string, score: number, passed: boolean, resultsUrl: string): EmailPayload['html'] {
  return baseLayout(`
    <h2>Assessment complete</h2>
    <p>Hi ${name}, you've completed the <strong>${module}</strong> assessment.</p>
    <p style="font-size:32px;font-weight:700;color:${passed ? '#10b981' : '#ef4444'};margin:0 0 8px">${score}%</p>
    <p style="margin:0 0 24px;font-size:14px;color:${passed ? '#10b981' : '#ef4444'};font-weight:600">${passed ? '✓ Passed' : '✗ Did not pass'}</p>
    <a href="${resultsUrl}" class="btn">View Full Report</a>
  `, 'Assessment results — LeaderAssess Pro');
}
