import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailNotificationService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_default_key');
  }

  // Sends transactional email via Resend API
  async sendEmail(to: string, subject: string, htmlContent: string) {
    return this.resend.emails.send({
      from: 'Agentic HR <onboarding@resend.dev>',
      to,
      subject,
      html: htmlContent,
    });
  }
}
