import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Ported from leadership-assessment emailService. Provider chain:
 *   RESEND_API_KEY set  -> Resend HTTP API
 *   SMTP_HOST set       -> SMTP via nodemailer
 *   neither             -> console log (dev fallback; nothing is sent)
 * EMAIL_FROM is the sender for both real providers.
 *
 * Throws on real-provider failure so callers can decide whether the send is
 * critical; callers doing fire-and-forget should .catch() themselves.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(payload: EmailPayload): Promise<void> {
    try {
      if (process.env.RESEND_API_KEY) {
        await this.sendViaResend(payload);
      } else if (process.env.SMTP_HOST) {
        await this.sendViaSmtp(payload);
      } else {
        // Development: log instead of sending.
        this.logger.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
        this.logger.debug(`[EMAIL BODY]\n${payload.text ?? payload.html}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email: ${err}`);
      throw err;
    }
  }

  private async sendViaResend(payload: EmailPayload): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'no-reply@assessos.local',
        to: [payload.to],
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

  private async sendViaSmtp(payload: EmailPayload): Promise<void> {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@assessos.local',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
  }
}
