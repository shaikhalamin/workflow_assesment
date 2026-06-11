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
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { CreateWorkflowEventSchemaDto } from './dto/create-workflow-event-schema.dto';
import { UpdateWorkflowEventSchemaDto } from './dto/update-workflow-event-schema.dto';
import { WorkflowBuilderIdParamDto } from './dto/workflow-builder-param.dto';
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
  @ApiPaginatedData(WorkflowEventSchemaResponseDto, {
    errors: [400, 401, 403],
  })
  list(@Query() query: PaginationQueryDto) {
    return this.workflowEventSchemaService.list(query);
  }

  @Post()
  @ApiData(WorkflowEventSchemaResponseDto, {
    status: 201,
    errors: [400, 401, 403],
  })
  create(@Body() dto: CreateWorkflowEventSchemaDto) {
    return this.workflowEventSchemaService.create(dto);
  }

  @Get(':id')
  @ApiData(WorkflowEventSchemaResponseDto, {
    errors: [400, 401, 403, 404],
  })
  findOne(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowEventSchemaService.findOne(params.id);
  }

  @Patch(':id')
  @ApiData(WorkflowEventSchemaResponseDto, {
    errors: [400, 401, 403, 404],
  })
  update(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: UpdateWorkflowEventSchemaDto,
  ) {
    return this.workflowEventSchemaService.update(params.id, dto);
  }

  @Post(':id/deactivate')
  @ApiData(WorkflowEventSchemaResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  deactivate(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowEventSchemaService.deactivate(params.id);
  }
}
