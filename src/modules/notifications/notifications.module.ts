import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '../../mailer/mailer.module';
import { Notification } from './entities/notification.entity';
import { NotificationPushProcessor } from './notification-push.processor';
import { NotificationPushQueue } from './notification-push.queue';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: 'notification-push' }),
    MailerModule,
  ],
  providers: [
    NotificationsService,
    NotificationPushQueue,
    NotificationPushProcessor,
    NotificationsGateway,
  ],
  exports: [TypeOrmModule, NotificationsService],
})
export class NotificationsModule {}
