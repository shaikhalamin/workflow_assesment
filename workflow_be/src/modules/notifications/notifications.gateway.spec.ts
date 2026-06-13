import type { JwtService } from '@nestjs/jwt';
import type { UsersService } from '../users/users.service';
import {
  NotificationsGateway,
  type NotificationSocket,
} from './notifications.gateway';

describe('NotificationsGateway', () => {
  const user = {
    id: 'user-1',
    name: 'Employee User',
    email: 'employee@example.com',
    passwordHash: 'hash',
    employeeGrade: null,
    departmentId: null,
    isActive: true,
    roles: ['employee', 'manager'],
    permissions: ['notifications.read'],
  };
  type VerifyAsyncMock = jest.Mock<Promise<{ sub: string }>, [string]>;
  type FindByIdWithAccessMock = jest.Mock<
    Promise<typeof user | null>,
    [string]
  >;

  function gateway(overrides?: {
    verifyAsync?: VerifyAsyncMock;
    findByIdWithAccess?: FindByIdWithAccessMock;
  }): NotificationsGateway {
    const jwtService = {
      verifyAsync: overrides?.verifyAsync ?? jest.fn(),
    } as unknown as JwtService;
    const usersService = {
      findByIdWithAccess: overrides?.findByIdWithAccess ?? jest.fn(),
    } as unknown as UsersService;

    return new NotificationsGateway(jwtService, usersService);
  }

  it('does not expose a client-triggered room join handler', () => {
    expect('joinRooms' in NotificationsGateway.prototype).toBe(false);
  });

  it('authenticates the socket access token cookie before joining rooms', async () => {
    const verifyAsync = jest
      .fn<Promise<{ sub: string }>, [string]>()
      .mockResolvedValue({ sub: user.id });
    const findByIdWithAccess = jest
      .fn<Promise<typeof user | null>, [string]>()
      .mockResolvedValue(user);
    const join = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    const disconnect = jest.fn();
    const client = {
      data: {},
      handshake: {
        headers: {
          cookie: 'refresh_token=refresh-1; access_token=access-1',
        },
      },
      join,
      disconnect,
    } as unknown as NotificationSocket;

    await gateway({ verifyAsync, findByIdWithAccess }).handleConnection(client);

    expect(verifyAsync).toHaveBeenCalledWith('access-1');
    expect(findByIdWithAccess).toHaveBeenCalledWith(user.id);
    expect(join).toHaveBeenCalledWith('user:user-1');
    expect(join).toHaveBeenCalledWith('role:employee');
    expect(join).toHaveBeenCalledWith('role:manager');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('disconnects sockets without an access token cookie', async () => {
    const join = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    const disconnect = jest.fn();
    const client = {
      data: {},
      handshake: { headers: {} },
      join,
      disconnect,
    } as unknown as NotificationSocket;

    await gateway().handleConnection(client);

    expect(join).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledWith(true);
  });
});
