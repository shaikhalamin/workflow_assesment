import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import { Paginated } from './paginated';
import { RAW_RESPONSE_KEY } from './raw-response.decorator';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') {
      return next.handle();
    }

    const raw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (raw) {
      return next.handle();
    }

    const res = ctx.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined || value === null) return value;
        if (value instanceof StreamableFile) return value;
        if (res.headersSent) return value;

        if (value instanceof Paginated) {
          const totalPages =
            value.limit > 0 ? Math.ceil(value.total / value.limit) : 0;
          return {
            data: value.items,
            meta: {
              page: value.page,
              limit: value.limit,
              total: value.total,
              totalPages,
              hasNext: value.page < totalPages,
              hasPrev: value.page > 1,
            },
            error: null,
          };
        }

        return { data: value, error: null };
      }),
    );
  }
}
