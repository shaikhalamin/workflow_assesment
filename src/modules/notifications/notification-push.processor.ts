import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { NotificationPushJob } from './notification-push.types';
import { NotificationsGateway } from './notifications.gateway';

@Processor('notification-push')
export class NotificationPushProcessor extends WorkerHost {
  constructor(private readonly gateway: NotificationsGateway) {
    super();
  }

  process(job: Job<NotificationPushJob>): Promise<void> {
    this.gateway.emitNotification(job.data);
    return Promise.resolve();
  }
}
