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
import { ApiOkData, ApiOkPaginated } from '../../common/http/swagger';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
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
  @ApiOkData(ExpenseResponseDto, { status: 201 })
  create(@Body() dto: CreateExpenseDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.create(dto, actor);
  }

  @Get()
  @Permissions('expenses.read')
  @ApiOkPaginated(ExpenseResponseDto)
  list(@Query() query: ExpenseQueryDto, @CurrentUser() actor: Express.User) {
    return this.expensesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('expenses.read')
  @ApiOkData(ExpenseResponseDto)
  findOne(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.expensesService.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions('expenses.write')
  @ApiOkData(ExpenseResponseDto)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.update(id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('expenses.write')
  @ApiOkData(ExpenseResponseDto, { status: 201 })
  submit(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.expensesService.submit(id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('expenses.write')
  @ApiOkData(ExpenseResponseDto, { status: 201 })
  resubmit(
    @Param('id') id: string,
    @Body() dto: ResubmitExpenseDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.expensesService.resubmit(id, dto, actor);
  }
}
