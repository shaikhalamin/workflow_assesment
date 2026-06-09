import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
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
  create(@Body() dto: CreateExpenseDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.create(dto, actor);
  }

  @Get()
  @Permissions('expenses.read')
  list(@Query() query: ExpenseQueryDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('expenses.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.expensesService.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions('expenses.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.update(id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('expenses.write')
  submit(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.expensesService.submit(id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('expenses.write')
  resubmit(
    @Param('id') id: string,
    @Body() dto: ResubmitExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.resubmit(id, dto, actor);
  }
}
