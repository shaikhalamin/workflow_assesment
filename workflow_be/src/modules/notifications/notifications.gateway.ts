import {
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import type { NotificationPushJob } from './notification-push.types';

type EmptyEvents = Record<string, (...args: never[]) => void>;

type NotificationSocketData = {
  user?: Express.User;
};

export type NotificationSocket = Socket<
  EmptyEvents,
  ServerToClientEvents,
  EmptyEvents,
  NotificationSocketData
>;

type NotificationServer = Server<
  EmptyEvents,
  ServerToClientEvents,
  EmptyEvents,
  NotificationSocketData
>;

type ServerToClientEvents = {
  notification: (notification: NotificationPushJob) => void;
};

type AccessPayload = {
  sub: string;
};

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  private server!: NotificationServer;

  async handleConnection(client: NotificationSocket): Promise<void> {
    try {
      client.data.user = await this.authenticate(client);
      await this.joinAuthenticatedRooms(client);
    } catch {
      client.disconnect(true);
    }
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

  private async authenticate(
    client: NotificationSocket,
  ): Promise<Express.User> {
    const token = this.accessTokenFromCookieHeader(
      client.handshake.headers.cookie,
    );
    if (!token) throw new UnauthorizedException();

    const payload = await this.jwtService.verifyAsync<AccessPayload>(token);
    if (!payload.sub) throw new UnauthorizedException();

    const user = await this.usersService.findByIdWithAccess(payload.sub);
    if (!user?.isActive) throw new UnauthorizedException();

    return {
      userId: user.id,
      email: user.email,
      employeeGrade: user.employeeGrade,
      departmentId: user.departmentId,
      roles: user.roles,
      permissions: user.permissions,
      sid: null,
    };
  }

  private async joinAuthenticatedRooms(
    client: NotificationSocket,
  ): Promise<void> {
    const user = client.data.user;
    if (!user) throw new WsException('Unauthorized');

    await client.join(this.userRoom(user.userId));
    for (const roleSlug of user.roles) {
      await client.join(this.roleRoom(roleSlug)); ///
    }
  }

  private accessTokenFromCookieHeader(
    cookieHeader: string | undefined,
  ): string | null {
    return (
      cookieHeader
        ?.split(';')
        .map((cookie) => cookie.trim().split('='))
        .find(([name]) => name === 'access_token')
        ?.slice(1)
        .join('=') ?? null
    );
  }
}
