import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateWorkflowRuleDto } from './create-workflow-rule.dto';
import { CreateWorkflowTemplateDto } from './create-workflow-template.dto';

export class WorkflowWizardDto {
  @ApiProperty({
    type: CreateWorkflowTemplateDto,
    example: {
      name: 'Expense approval workflow',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
    },
  })
  @ValidateNested()
  @Type(() => CreateWorkflowTemplateDto)
  template!: CreateWorkflowTemplateDto;

  @ApiPropertyOptional({
    type: [CreateWorkflowRuleDto],
    example: [
      {
        name: 'High value expense',
        priority: 10,
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 50000 }],
        },
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowRuleDto)
  rules?: CreateWorkflowRuleDto[];

  @ApiPropertyOptional({
    example: { setStatus: 'APPROVED', createPaymentRequest: true },
  })
  @IsOptional()
  @IsObject()
  approvedActionsJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { setStatus: 'REJECTED' } })
  @IsOptional()
  @IsObject()
  rejectedActionsJson?: Record<string, unknown> | null;
}
