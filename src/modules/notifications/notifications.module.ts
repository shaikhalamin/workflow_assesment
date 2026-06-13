import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '../../mailer/mailer.module';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationPushProcessor } from './notification-push.processor';
import { NotificationPushQueue } from './notification-push.queue';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Role, User, UserRole]),
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
