import { Injectable, Logger } from '@nestjs/common';
import type { MailTransport, RenderedEmail } from '../mail-transport.interface';

@Injectable()
export class ConsoleMailTransport implements MailTransport {
  private readonly logger = new Logger(ConsoleMailTransport.name);

  send(email: RenderedEmail): Promise<void> {
    this.logger.log(
      [
        '========== EMAIL ==========',
        `FROM: ${email.from}`,
        `TO: ${email.to}`,
        `SUBJECT: ${email.subject}`,
        '',
        email.text,
        '===========================',
      ].join('\n'),
    );
    return Promise.resolve();
  }
}
