import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PaymentRequestParamDto } from './dto/payment-request-param.dto';
import { PaymentRequestResponseDto } from './dto/payment-request-response.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payment-requests')
@ApiCookieAuth('access_token')
@Controller('payment-requests')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiPaginatedData(PaymentRequestResponseDto, { errors: [400, 401, 403] })
  list(@Query() query: PaginationQueryDto, @CurrentUser() actor: Express.User) {
    return this.paymentsService.list(query, actor);
  }

  @Get(':id')
  @ApiData(PaymentRequestResponseDto, { errors: [400, 401, 403, 404] })
  findOne(
    @Param() params: PaymentRequestParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.paymentsService.findOne(params.id, actor);
  }

  @Post(':id/mark-paid')
  @Permissions('payments.write')
  @ApiData(PaymentRequestResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  markPaid(
    @Param() params: PaymentRequestParamDto,
    @CurrentUser() actor: Express.User,
    @Body() dto: MarkPaidDto,
  ) {
    return this.paymentsService.markPaid(params.id, actor, dto);
  }
}
