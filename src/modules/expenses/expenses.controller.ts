import {
  Body,
  Controller,
  Delete,
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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseParamDto } from './dto/expense-param.dto';
import { ResubmitExpenseDto } from './dto/resubmit-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiCookieAuth('access_token')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Permissions('expenses.write')
  @ApiData(ExpenseResponseDto, { status: 201, errors: [400, 401, 403] })
  create(@Body() dto: CreateExpenseDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.create(dto, actor);
  }

  @Get()
  @Permissions('expenses.read')
  @ApiPaginatedData(ExpenseResponseDto, { errors: [400, 401, 403] })
  list(@Query() query: ExpenseQueryDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('expenses.read')
  @ApiData(ExpenseResponseDto, { errors: [400, 401, 403, 404] })
  findOne(
    @Param() params: ExpenseParamDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.findOne(params.id, actor);
  }

  @Patch(':id')
  @Permissions('expenses.write')
  @ApiData(ExpenseResponseDto, { errors: [400, 401, 403, 404] })
  update(
    @Param() params: ExpenseParamDto,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.update(params.id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('expenses.write')
  @ApiData(ExpenseResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  submit(@Param() params: ExpenseParamDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.submit(params.id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('expenses.write')
  @ApiData(ExpenseResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  resubmit(
    @Param() params: ExpenseParamDto,
    @Body() dto: ResubmitExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.resubmit(params.id, dto, actor);
  }

  @Delete(':id')
  @Permissions('expenses.write')
  @ApiData(SuccessResponseDto, { errors: [400, 401, 403, 404] })
  delete(@Param() params: ExpenseParamDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.delete(params.id, actor);
  }
}
