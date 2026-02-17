import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.from =
      this.config.get<string>('EMAIL_FROM') || 'noreply@columbarium.local';
  }

  async send(options: SendMailOptions): Promise<void> {
    if (!this.resend) {
      console.warn(
        '[Email] Resend not configured (missing RESEND_API_KEY). Would have sent:',
        options,
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(
    email: string,
    verificationLink: string,
  ): Promise<void> {
    const subject = 'Verify your email – Columbarium';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
          <p><a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify email</a></p>
          <p>Or copy this link: <br/><a href="${verificationLink}">${verificationLink}</a></p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't create an account, you can ignore this email.</p>
        </body>
      </html>
    `;
    await this.send({ to: email, subject, html });
  }
}
