import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WorkflowInstanceParamDto {
  @ApiProperty({ example: '9f527490-d2a2-44aa-994c-ffb91adf9df2' })
  @IsString()
  id!: string;
}

export class WorkflowStepParamDto {
  @ApiProperty({ example: 'e7c883f6-90e7-465e-8abc-4c7f8e5e7d4a' })
  @IsString()
  id!: string;
}
