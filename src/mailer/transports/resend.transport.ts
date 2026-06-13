import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { MailTransport, RenderedEmail } from '../mail-transport.interface';

@Injectable()
export class ResendMailTransport implements MailTransport {
  private readonly logger = new Logger(ResendMailTransport.name);
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(email: RenderedEmail): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (error) {
      this.logger.error(`Resend send failed for ${email.to}: ${error.message}`);
      throw new Error(`Resend: ${error.name}: ${error.message}`);
    }

    this.logger.log(`Email sent via Resend: ${data?.id ?? 'unknown id'}`);
  }
}
