import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from '../../config/jwt.config';
import { MailerModule } from '../../mailer/mailer.module';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { Notification } from './entities/notification.entity';
import { NotificationPushProcessor } from './notification-push.processor';
import { NotificationPushQueue } from './notification-push.queue';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([Notification, Role, User, UserRole]),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secret,
      }),
    }),
    BullModule.registerQueue({ name: 'notification-push' }),
    MailerModule,
    UsersModule,
  ],
  providers: [
    NotificationsService,
    NotificationPushQueue,
    NotificationPushProcessor,
    NotificationsGateway,
  ],
  controllers: [NotificationsController],
  exports: [TypeOrmModule, NotificationsService],
})
export class NotificationsModule {}
