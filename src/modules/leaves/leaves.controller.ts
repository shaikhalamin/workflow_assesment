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
import {
  ApiErrors,
  ApiOkData,
  ApiOkPaginated,
} from '../../common/http/swagger';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveResponseDto } from './dto/leave-response.dto';
import { LeaveQueryDto } from './dto/leave-query.dto';
import { LeaveParamDto } from './dto/leave-param.dto';
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
  @ApiOkData(LeaveResponseDto, { status: 201 })
  @ApiErrors(400, 401, 403)
  create(@Body() dto: CreateLeaveDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.create(dto, actor);
  }

  @Get()
  @Permissions('leaves.read')
  @ApiOkPaginated(LeaveResponseDto)
  @ApiErrors(400, 401, 403)
  list(@Query() query: LeaveQueryDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.list(query, actor);
  }

  @Get(':id')
  @Permissions('leaves.read')
  @ApiOkData(LeaveResponseDto)
  @ApiErrors(400, 401, 403, 404)
  findOne(@Param() params: LeaveParamDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.findOne(params.id, actor);
  }

  @Patch(':id')
  @Permissions('leaves.write')
  @ApiOkData(LeaveResponseDto)
  @ApiErrors(400, 401, 403, 404)
  update(
    @Param() params: LeaveParamDto,
    @Body() dto: UpdateLeaveDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.leavesService.update(params.id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('leaves.write')
  @ApiOkData(LeaveResponseDto, { status: 201 })
  @ApiErrors(400, 401, 403, 404)
  submit(@Param() params: LeaveParamDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.submit(params.id, actor);
  }

  @Post(':id/resubmit')
  @Permissions('leaves.write')
  @ApiOkData(LeaveResponseDto, { status: 201 })
  @ApiErrors(400, 401, 403, 404)
  resubmit(
    @Param() params: LeaveParamDto,
    @Body() dto: ResubmitLeaveDto,
    @CurrentUser() actor: Express.User,
  ) {
    return this.leavesService.resubmit(params.id, dto, actor);
  }

  @Delete(':id')
  @Permissions('leaves.write')
  @ApiOkData(SuccessResponseDto)
  @ApiErrors(400, 401, 403, 404)
  delete(@Param() params: LeaveParamDto, @CurrentUser() actor: Express.User) {
    return this.leavesService.delete(params.id, actor);
  }
}
