import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const userPermissions = request.user?.permissions ?? [];
    const hasPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermissions)
      throw new ForbiddenException('Insufficient permission');
    return true;
  }
}
