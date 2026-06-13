import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { TemplateName, TemplateProps } from './templates';

export type EmailPayload = {
  [K in TemplateName]: {
    template: K;
    to: string;
    subject: string;
    props: Omit<TemplateProps<K>, 'brand'>;
  };
}[TemplateName];

@Injectable()
export class MailerService {
  constructor(@InjectQueue('email') private readonly queue: Queue) {}

  async enqueue(payload: EmailPayload): Promise<void> {
    await this.queue.add('send', payload);
  }
}
