import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateWorkflowRuleDto } from './create-workflow-rule.dto';
import { CreateWorkflowTemplateDto } from './create-workflow-template.dto';

export class WorkflowWizardDto {
  @ApiProperty({ type: CreateWorkflowTemplateDto })
  @ValidateNested()
  @Type(() => CreateWorkflowTemplateDto)
  template!: CreateWorkflowTemplateDto;

  @ApiPropertyOptional({ type: [CreateWorkflowRuleDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowRuleDto)
  rules?: CreateWorkflowRuleDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  approvedActionsJson?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rejectedActionsJson?: Record<string, unknown> | null;
}
