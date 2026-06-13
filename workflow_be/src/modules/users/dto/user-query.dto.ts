import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/http/pagination.query';

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'manager' })
  @IsOptional()
  @IsString()
  roleSlug?: string;
}
