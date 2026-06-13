import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/http/pagination.query';

function toOptionalBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    example: true,
    description: 'When true, returns only unread notifications.',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  unreadOnly?: boolean = false;
}
