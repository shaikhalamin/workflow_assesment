import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class RbacRoleResponseDto {
  @ApiProperty({ example: '2efdbf50-2d43-4a44-bd48-4f9f05fe9b32' })
  id!: string;

  @ApiProperty({ example: 'Employee' })
  name!: string;

  @ApiProperty({ example: 'employee' })
  slug!: string;

  @ApiProperty({
    type: String,
    example: 'Default employee role',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: true })
  isSystem!: boolean;

  @ApiProperty({ example: false })
  isLocked!: boolean;

  @ApiProperty({
    example: ['auth.profile.read', 'expenses.read', 'expenses.write'],
    type: [String],
  })
  permissionSlugs!: string[];

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  updatedAt!: string;
}

export class RbacPermissionResponseDto {
  @ApiProperty({ example: '1f8fd6c2-aef2-4f65-b58a-9f145d66a011' })
  id!: string;

  @ApiProperty({ example: 'Read expenses' })
  name!: string;

  @ApiProperty({ example: 'expenses.read' })
  slug!: string;

  @ApiProperty({
    type: String,
    example: 'Allows viewing expense requests',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'expenses' })
  resource!: string;

  @ApiProperty({ example: 'read' })
  action!: string;

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  updatedAt!: string;
}

export class RbacRoleSlugParamDto {
  @ApiProperty({ example: 'employee' })
  @IsString()
  roleSlug!: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({
    example: ['expenses.read', 'expenses.write'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  permissionSlugs!: string[];
}
