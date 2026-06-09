import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ConditionGroup } from '../condition.types';
import { CreateWorkflowStepConfigDto } from './create-workflow-step-config.dto';

export class CreateWorkflowRuleDto {
  @ApiProperty({ example: 'High value expense' })
  @IsString()
  name!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  priority!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditionJson?: ConditionGroup | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFallback?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateWorkflowStepConfigDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepConfigDto)
  steps?: CreateWorkflowStepConfigDto[];
}
