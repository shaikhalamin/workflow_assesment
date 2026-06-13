import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { mailerConfig } from '../config/mailer.config';
import { EmailProcessor } from './email.processor';
import { MAIL_TRANSPORT } from './mail-transport.interface';
import type { MailTransport } from './mail-transport.interface';
import { MailerService } from './mailer.service';
import { ConsoleMailTransport } from './transports/console.transport';
import { ResendMailTransport } from './transports/resend.transport';

@Module({
  imports: [
    ConfigModule.forFeature(mailerConfig),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [
    MailerService,
    EmailProcessor,
    {
      provide: MAIL_TRANSPORT,
      inject: [mailerConfig.KEY],
      useFactory: (config: ConfigType<typeof mailerConfig>): MailTransport => {
        if (config.transport === 'resend') {
          if (!config.resendApiKey) {
            throw new Error('MAILER_TRANSPORT=resend requires RESEND_API_KEY');
          }
          return new ResendMailTransport(config.resendApiKey);
        }

        return new ConsoleMailTransport();
      },
    },
  ],
  exports: [MailerService, MAIL_TRANSPORT],
})
export class MailerModule {}
