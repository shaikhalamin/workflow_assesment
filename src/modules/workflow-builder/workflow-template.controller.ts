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
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
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
  @ApiOkPaginated(WorkflowTemplateResponseDto)
  list(@Query() query: PaginationQueryDto) {
    return this.workflowTemplateService.list(query);
  }

  @Post()
  @ApiOkData(WorkflowTemplateResponseDto, { status: 201 })
  create(@Body() dto: CreateWorkflowTemplateDto) {
    return this.workflowTemplateService.create(dto);
  }

  @Post('wizard')
  @ApiOkData(WorkflowTemplateResponseDto, { status: 201 })
  createWizard(@Body() dto: WorkflowWizardDto) {
    return this.workflowTemplateService.createWizard(dto);
  }

  @Get(':id')
  @ApiOkData(WorkflowTemplateResponseDto)
  findOne(@Param('id') id: string) {
    return this.workflowTemplateService.findOne(id);
  }

  @Patch(':id')
  @ApiOkData(WorkflowTemplateResponseDto)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowTemplateDto) {
    return this.workflowTemplateService.update(id, dto);
  }

  @Post(':id/publish')
  @ApiOkData(WorkflowTemplateResponseDto, { status: 201 })
  publish(@Param('id') id: string) {
    return this.workflowTemplateService.publish(id);
  }

  @Post(':id/deactivate')
  @ApiOkData(WorkflowTemplateResponseDto, { status: 201 })
  deactivate(@Param('id') id: string) {
    return this.workflowTemplateService.deactivate(id);
  }

  @Post(':id/duplicate')
  @ApiOkData(WorkflowTemplateResponseDto, { status: 201 })
  duplicate(@Param('id') id: string) {
    return this.workflowTemplateService.duplicate(id);
  }

  @Post(':id/rules')
  @ApiOkData(WorkflowApprovalRuleResponseDto, { status: 201 })
  createRule(@Param('id') id: string, @Body() dto: CreateWorkflowRuleDto) {
    return this.workflowTemplateService.createRule(id, dto);
  }
}
