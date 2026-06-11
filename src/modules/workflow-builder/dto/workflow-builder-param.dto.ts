import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WorkflowBuilderIdParamDto {
  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  @IsString()
  id!: string;
}
