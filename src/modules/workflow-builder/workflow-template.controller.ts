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
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { WorkflowBuilderIdParamDto } from './dto/workflow-builder-param.dto';
import {
  WorkflowApprovalRuleResponseDto,
  WorkflowTemplateResponseDto,
} from './dto/workflow-builder-response.dto';
import { WorkflowWizardDto } from './dto/workflow-wizard.dto';
import { WorkflowTemplateService } from './workflow-template.service';

@ApiTags('workflow-templates')
@ApiCookieAuth('access_token')
@Controller('workflow-templates')
@Permissions('workflow.builder.manage')
export class WorkflowTemplateController {
  constructor(
    private readonly workflowTemplateService: WorkflowTemplateService,
  ) {}

  @Get()
  @ApiPaginatedData(WorkflowTemplateResponseDto, {
    errors: [400, 401, 403],
  })
  list(@Query() query: PaginationQueryDto) {
    return this.workflowTemplateService.list(query);
  }

  @Post()
  @ApiData(WorkflowTemplateResponseDto, {
    status: 201,
    errors: [400, 401, 403],
  })
  create(@Body() dto: CreateWorkflowTemplateDto) {
    return this.workflowTemplateService.create(dto);
  }

  @Post('wizard')
  @ApiData(WorkflowTemplateResponseDto, {
    status: 201,
    errors: [400, 401, 403],
  })
  createWizard(@Body() dto: WorkflowWizardDto) {
    return this.workflowTemplateService.createWizard(dto);
  }

  @Get(':id')
  @ApiData(WorkflowTemplateResponseDto, { errors: [400, 401, 403, 404] })
  findOne(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowTemplateService.findOne(params.id);
  }

  @Patch(':id')
  @ApiData(WorkflowTemplateResponseDto, { errors: [400, 401, 403, 404] })
  update(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: UpdateWorkflowTemplateDto,
  ) {
    return this.workflowTemplateService.update(params.id, dto);
  }

  @Post(':id/publish')
  @ApiData(WorkflowTemplateResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  publish(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowTemplateService.publish(params.id);
  }

  @Post(':id/deactivate')
  @ApiData(WorkflowTemplateResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  deactivate(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowTemplateService.deactivate(params.id);
  }

  @Post(':id/duplicate')
  @ApiData(WorkflowTemplateResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  duplicate(@Param() params: WorkflowBuilderIdParamDto) {
    return this.workflowTemplateService.duplicate(params.id);
  }

  @Post(':id/rules')
  @ApiData(WorkflowApprovalRuleResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  createRule(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: CreateWorkflowRuleDto,
  ) {
    return this.workflowTemplateService.createRule(params.id, dto);
  }
}
