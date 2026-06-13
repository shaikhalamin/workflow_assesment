import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '2b26f21a-2451-42ec-8f44-25c0f40b3a9b' })
  id!: string;

  @ApiProperty({ example: 'Demo Employee' })
  name!: string;

  @ApiProperty({ example: 'employee@fiberathome.net' })
  email!: string;

  @ApiProperty({ example: ['employee'] })
  roles!: string[];

  @ApiProperty({ example: ['expenses.read', 'expenses.write'] })
  permissions!: string[];
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
