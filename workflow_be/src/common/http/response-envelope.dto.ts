import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 142 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

export class ApiErrorDto {
  @ApiProperty({
    example: 'VALIDATION_FAILED',
    description: 'Stable machine-readable error code.',
  })
  code!: string;

  @ApiProperty({
    example: 'title must not be empty',
    description: 'Human-readable error message.',
  })
  message!: string;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    required: false,
    nullable: true,
    additionalProperties: true,
    description:
      'Optional structured details (e.g. per-field validation errors).',
  })
  details?: unknown;
}

export class ApiResponseDto<T> {
  @ApiProperty({
    nullable: true,
    description: 'Endpoint response payload. Null when the request fails.',
  })
  data!: T | null;

  @ApiProperty({
    type: ApiErrorDto,
    nullable: true,
    example: null,
    description: 'Error details. Null when the request succeeds.',
  })
  error!: ApiErrorDto | null;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'Current page items.' })
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;

  @ApiProperty({
    type: ApiErrorDto,
    nullable: true,
    example: null,
    description: 'Error details. Null when the request succeeds.',
  })
  error!: ApiErrorDto | null;
}
