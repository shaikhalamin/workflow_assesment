import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { MailTransport } from './mail-transport.interface';
import { MAIL_TRANSPORT } from './mail-transport.interface';
import type { EmailPayload } from './mailer.service';
import { renderEmail } from './templates';
import { mailerConfig } from '../config/mailer.config';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    @Inject(mailerConfig.KEY)
    private readonly config: ConfigType<typeof mailerConfig>,
  ) {
    super();
  }

  async process(job: Job<EmailPayload>): Promise<void> {
    const { html, text } = await renderEmail(job.data, this.config.brand);
    await this.transport.send({
      from: this.config.from,
      to: job.data.to,
      subject: job.data.subject,
      text,
      html,
    });
  }
}
