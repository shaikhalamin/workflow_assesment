import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiOkData, ApiOkPaginated } from '../../common/http/swagger';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PaymentRequestResponseDto } from './dto/payment-request-response.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payment-requests')
@ApiCookieAuth('access_token')
@Controller('payment-requests')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Permissions('payments.read')
  @ApiOkPaginated(PaymentRequestResponseDto)
  list(@Query() query: PaginationQueryDto) {
    return this.paymentsService.list(query);
  }

  @Get(':id')
  @Permissions('payments.read')
  @ApiOkData(PaymentRequestResponseDto)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/mark-paid')
  @Permissions('payments.write')
  @ApiOkData(PaymentRequestResponseDto, { status: 201 })
  markPaid(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: MarkPaidDto,
  ) {
    return this.paymentsService.markPaid(id, actor, dto);
  }
}
