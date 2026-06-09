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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiOkData, ApiOkPaginated } from '../../common/http/swagger';
import { CreateWorkflowEventSchemaDto } from './dto/create-workflow-event-schema.dto';
import { UpdateWorkflowEventSchemaDto } from './dto/update-workflow-event-schema.dto';
import { WorkflowEventSchemaResponseDto } from './dto/workflow-builder-response.dto';
import { WorkflowEventSchemaService } from './workflow-event-schema.service';

@ApiTags('workflow-event-schemas')
@ApiCookieAuth('access_token')
@Controller('workflow-event-schemas')
@Permissions('workflow.builder.manage')
export class WorkflowEventSchemaController {
  constructor(
    private readonly workflowEventSchemaService: WorkflowEventSchemaService,
  ) {}

  @Get()
  @ApiOkPaginated(WorkflowEventSchemaResponseDto)
  list(@Query() query: PaginationQueryDto) {
    return this.workflowEventSchemaService.list(query);
  }

  @Post()
  @ApiOkData(WorkflowEventSchemaResponseDto, { status: 201 })
  create(@Body() dto: CreateWorkflowEventSchemaDto) {
    return this.workflowEventSchemaService.create(dto);
  }

  @Get(':id')
  @ApiOkData(WorkflowEventSchemaResponseDto)
  findOne(@Param('id') id: string) {
    return this.workflowEventSchemaService.findOne(id);
  }

  @Patch(':id')
  @ApiOkData(WorkflowEventSchemaResponseDto)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowEventSchemaDto) {
    return this.workflowEventSchemaService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiOkData(WorkflowEventSchemaResponseDto, { status: 201 })
  deactivate(@Param('id') id: string) {
    return this.workflowEventSchemaService.deactivate(id);
  }
}
