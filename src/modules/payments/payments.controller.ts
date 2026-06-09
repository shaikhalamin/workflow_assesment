import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { PaymentsService } from './payments.service';

class MarkPaidDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

@ApiTags('payment-requests')
@ApiCookieAuth('access_token')
@Controller('payment-requests')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Permissions('payments.read')
  list(@Query() query: PaginationQueryDto) {
    return this.paymentsService.list(query);
  }

  @Get(':id')
  @Permissions('payments.read')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/mark-paid')
  @Permissions('payments.write')
  markPaid(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: MarkPaidDto,
  ) {
    return this.paymentsService.markPaid(id, actor, dto);
  }
}
