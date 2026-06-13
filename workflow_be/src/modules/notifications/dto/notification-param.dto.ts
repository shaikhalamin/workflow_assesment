import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class NotificationParamDto {
  @ApiProperty({
    example: '8b83330a-391d-4e25-9ec4-1f42623f91e4',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;
}
