import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveQueryDto } from './dto/leave-query.dto';
import { ResubmitLeaveDto } from './dto/resubmit-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeavesService } from './leaves.service';

@ApiTags('leaves')
@ApiCookieAuth('access_token')
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @Permissions('leaves.write')
  create(@Body() dto: CreateLeaveDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.create(dto, actor);
  }

  @Get()
  @Permissions('leaves.read')
  list(@Query() query: LeaveQueryDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('leaves.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.leavesService.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions('leaves.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.leavesService.update(id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('leaves.write')
  submit(@Param('id') id: string, @CurrentUser() actor: Express.User) {
    return this.leavesService.submit(id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('leaves.write')
  resubmit(
    @Param('id') id: string,
    @Body() dto: ResubmitLeaveDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.leavesService.resubmit(id, dto, actor);
  }
}
