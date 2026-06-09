import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

const ENVELOPE_RESERVED_KEYS = new Set([
  'message',
  'statusCode',
  'error',
  'code',
  'details',
]);

interface NormalizedError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ResponseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawPayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    if (status >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${req.method} ${req.url} -> ${status}`, stack);
    }

    const normalized = this.normalize(status, rawPayload);

    res.status(status).json({
      data: null,
      error: normalized,
    });
  }

  private normalize(status: number, payload: unknown): NormalizedError {
    const defaultCode = STATUS_CODE_MAP[status] ?? `HTTP_${status}`;

    if (typeof payload === 'string') {
      return { code: defaultCode, message: payload, statusCode: status };
    }

    if (!payload || typeof payload !== 'object') {
      return { code: defaultCode, message: defaultCode, statusCode: status };
    }

    const obj = payload as Record<string, unknown>;
    const codeFromPayload = typeof obj.code === 'string' ? obj.code : undefined;
    const rawMessage = obj.message;

    let message: string;
    let code = codeFromPayload ?? defaultCode;
    let details: unknown;

    if (Array.isArray(rawMessage)) {
      const fields = rawMessage.map((m) => String(m));
      message = fields[0] ?? defaultCode;
      if (status === 400 && !codeFromPayload) code = 'VALIDATION_FAILED';
      details = { fields };
    } else if (typeof rawMessage === 'string') {
      message = rawMessage;
    } else {
      message = defaultCode;
    }

    if (typeof obj.details !== 'undefined') {
      details = obj.details;
    } else if (!details) {
      const extras: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (!ENVELOPE_RESERVED_KEYS.has(k)) extras[k] = v;
      }
      if (Object.keys(extras).length > 0) details = extras;
    }

    return { code, message, statusCode: status, details };
  }
}
