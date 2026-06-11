import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LeaveParamDto {
  @ApiProperty({ example: '27e6335e-2701-405d-838f-48a948a1dbd2' })
  @IsUUID()
  id!: string;
}
