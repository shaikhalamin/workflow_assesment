import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { InvoiceParamDto } from './dto/invoice-param.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiCookieAuth('access_token')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Permissions('invoices.read')
  @ApiPaginatedData(InvoiceResponseDto, { errors: [400, 401, 403] })
  list(@Query() query: InvoiceQueryDto, @CurrentUser() actor: Express.User) {
    return this.invoicesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('invoices.read')
  @ApiData(InvoiceResponseDto, { errors: [400, 401, 403, 404] })
  findOne(
    @Param() params: InvoiceParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.invoicesService.findOne(params.id, actor);
  }

  @Post(':id/cancel')
  @Permissions('invoices.write')
  @ApiData(InvoiceResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  cancel(@Param() params: InvoiceParamDto, @CurrentUser() actor: Express.User) {
    return this.invoicesService.cancel(params.id, actor);
  }

  @Post(':id/mark-paid')
  @Permissions('invoices.write')
  @ApiData(InvoiceResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  markPaid(
    @Param() params: InvoiceParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.invoicesService.markPaid(params.id, actor);
  }
}
