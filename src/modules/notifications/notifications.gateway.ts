import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { NotificationPushJob } from './notification-push.types';

type JoinNotificationRoomPayload = {
  userId?: string;
  roleSlug?: string;
};

@WebSocketGateway({ namespace: 'notifications', cors: { origin: true } })
export class NotificationsGateway {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('notifications:join')
  async joinRooms(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinNotificationRoomPayload,
  ): Promise<void> {
    if (payload.userId) await client.join(this.userRoom(payload.userId));
    if (payload.roleSlug) await client.join(this.roleRoom(payload.roleSlug));
  }

  emitNotification(notification: NotificationPushJob): void {
    if (notification.recipientUserId) {
      this.server
        .to(this.userRoom(notification.recipientUserId))
        .emit('notification', notification);
    }

    if (notification.recipientRoleSlug) {
      this.server
        .to(this.roleRoom(notification.recipientRoleSlug))
        .emit('notification', notification);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private roleRoom(roleSlug: string): string {
    return `role:${roleSlug}`;
  }
}
