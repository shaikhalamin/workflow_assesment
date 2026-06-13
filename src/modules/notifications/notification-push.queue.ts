import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { Notification } from './entities/notification.entity';
import { toNotificationPushJob } from './notification-push.types';
import type { NotificationPushJob } from './notification-push.types';

@Injectable()
export class NotificationPushQueue {
  constructor(
    @InjectQueue('notification-push')
    private readonly queue: Queue<NotificationPushJob>,
  ) {}

  async enqueue(notification: Notification): Promise<void> {
    await this.queue.add('send', toNotificationPushJob(notification));
  }
}
