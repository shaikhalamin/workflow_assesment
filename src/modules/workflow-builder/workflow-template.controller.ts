import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { WorkflowWizardDto } from './dto/workflow-wizard.dto';
import { WorkflowTemplateService } from './workflow-template.service';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';

@ApiTags('workflow-templates')
@ApiCookieAuth('access_token')
@Controller('workflow-templates')
@Permissions('workflow.builder.manage')
export class WorkflowTemplateController {
  constructor(private readonly workflowTemplateService: WorkflowTemplateService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.workflowTemplateService.list(query);
  }

  @Post()
  create(@Body() dto: CreateWorkflowTemplateDto) {
    return this.workflowTemplateService.create(dto);
  }

  @Post('wizard')
  createWizard(@Body() dto: WorkflowWizardDto) {
    return this.workflowTemplateService.createWizard(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowTemplateService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowTemplateDto) {
    return this.workflowTemplateService.update(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.workflowTemplateService.publish(id);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.workflowTemplateService.deactivate(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.workflowTemplateService.duplicate(id);
  }

  @Post(':id/rules')
  createRule(@Param('id') id: string, @Body() dto: CreateWorkflowRuleDto) {
    return this.workflowTemplateService.createRule(id, dto);
  }
}
