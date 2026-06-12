import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/http/pagination.query';
import { BillingRequestStatus } from '../entities/billing-request.entity';

export class BillingRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BillingRequestStatus })
  @IsOptional()
  @IsEnum(BillingRequestStatus)
  status?: BillingRequestStatus;
}
