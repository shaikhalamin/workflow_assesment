import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import {
  ApiErrorDto,
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationMetaDto,
} from './response-envelope.dto';

const ENVELOPE_MODELS = [
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationMetaDto,
  ApiErrorDto,
] as const;

const STATUS_TO_ERROR_DESCRIPTION: Record<number, string> = {
  400: 'Validation failed or malformed request',
  401: 'Unauthenticated',
  403: 'Insufficient permissions',
  404: 'Resource not found',
  409: 'Conflict with existing resource',
  410: 'Resource is gone',
  422: 'Unprocessable entity',
  429: 'Too many requests',
  500: 'Internal server error',
  503: 'Service unavailable',
};

interface ApiOkDataOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
}

export function ApiOkData<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiOkDataOptions = {},
) {
  const { status = 200, description, isArray = false } = options;
  const itemSchema = { $ref: getSchemaPath(model) };
  const dataSchema = isArray
    ? { type: 'array' as const, items: itemSchema }
    : itemSchema;

  return applyDecorators(
    ApiExtraModels(model, ...ENVELOPE_MODELS),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: dataSchema,
              error: {
                type: 'object',
                nullable: true,
                allOf: [{ $ref: getSchemaPath(ApiErrorDto) }],
              },
            },
            required: ['data', 'error'],
          },
        ],
      },
    }),
  );
}

interface ApiOkPaginatedOptions {
  status?: number;
  description?: string;
}

export function ApiOkPaginated<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiOkPaginatedOptions = {},
) {
  const { status = 200, description } = options;

  return applyDecorators(
    ApiExtraModels(model, ...ENVELOPE_MODELS),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: { $ref: getSchemaPath(PaginationMetaDto) },
              error: {
                type: 'object',
                nullable: true,
                allOf: [{ $ref: getSchemaPath(ApiErrorDto) }],
              },
            },
            required: ['data', 'meta', 'error'],
          },
        ],
      },
    }),
  );
}

export function ApiErrors(...statuses: number[]) {
  const decorators = statuses.map((status) =>
    ApiResponse({
      status,
      description: STATUS_TO_ERROR_DESCRIPTION[status],
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: { type: 'null', nullable: true, example: null },
              error: { $ref: getSchemaPath(ApiErrorDto) },
            },
            required: ['data', 'error'],
          },
        ],
      },
    }),
  );
  return applyDecorators(ApiExtraModels(...ENVELOPE_MODELS), ...decorators);
}

export const ENVELOPE_EXTRA_MODELS = ENVELOPE_MODELS;
