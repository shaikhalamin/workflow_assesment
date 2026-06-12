import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { BillingService } from './billing.service';
import { BillingRequestParamDto } from './dto/billing-request-param.dto';
import { BillingRequestQueryDto } from './dto/billing-request-query.dto';
import { BillingRequestResponseDto } from './dto/billing-request-response.dto';
import { CreateBillingRequestDto } from './dto/create-billing-request.dto';
import { ResubmitBillingRequestDto } from './dto/resubmit-billing-request.dto';
import { UpdateBillingRequestDto } from './dto/update-billing-request.dto';

@ApiTags('billing-requests')
@ApiCookieAuth('access_token')
@Controller('billing-requests')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Permissions('billing.write')
  @ApiData(BillingRequestResponseDto, { status: 201, errors: [400, 401, 403] })
  create(
    @Body() dto: CreateBillingRequestDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.create(dto, actor);
  }

  @Get()
  @Permissions('billing.read')
  @ApiPaginatedData(BillingRequestResponseDto, { errors: [400, 401, 403] })
  list(
    @Query() query: BillingRequestQueryDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.list(query, actor);
  }

  @Get(':id')
  @Permissions('billing.read')
  @ApiData(BillingRequestResponseDto, { errors: [400, 401, 403, 404] })
  findOne(
    @Param() params: BillingRequestParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.findOne(params.id, actor);
  }

  @Patch(':id')
  @Permissions('billing.write')
  @ApiData(BillingRequestResponseDto, { errors: [400, 401, 403, 404] })
  update(
    @Param() params: BillingRequestParamDto,
    @Body() dto: UpdateBillingRequestDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.update(params.id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('billing.write')
  @ApiData(BillingRequestResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  submit(
    @Param() params: BillingRequestParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.submit(params.id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('billing.write')
  @ApiData(BillingRequestResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  resubmit(
    @Param() params: BillingRequestParamDto,
    @Body() dto: ResubmitBillingRequestDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.resubmit(params.id, dto, actor);
  }

  @Post(':id/cancel')
  @Permissions('billing.write')
  @ApiData(SuccessResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  cancel(
    @Param() params: BillingRequestParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.billingService.cancel(params.id, actor);
  }
}
