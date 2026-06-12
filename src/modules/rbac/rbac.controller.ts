import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiData } from '../../common/http/swagger';
import {
  RbacPermissionResponseDto,
  RbacRoleResponseDto,
  RbacRoleSlugParamDto,
  UpdateRolePermissionsDto,
} from './dto/rbac-management.dto';
import { RbacService } from './rbac.service';

@ApiTags('rbac')
@ApiCookieAuth('access_token')
@Roles('admin')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @ApiData(RbacRoleResponseDto, {
    isArray: true,
    description: 'Lists roles with assigned permission slugs',
    errors: [401, 403, 429],
  })
  listRoles(): Promise<RbacRoleResponseDto[]> {
    return this.rbacService.listRoles();
  }

  @Get('permissions')
  @ApiData(RbacPermissionResponseDto, {
    isArray: true,
    description: 'Lists editable seeded permissions',
    errors: [401, 403, 429],
  })
  listPermissions(): Promise<RbacPermissionResponseDto[]> {
    return this.rbacService.listPermissions();
  }

  @Put('roles/:roleSlug/permissions')
  @ApiData(RbacRoleResponseDto, {
    description: 'Replaces permission assignments for a non-admin role',
    errors: [400, 401, 403, 404, 429],
  })
  replaceRolePermissions(
    @Param() params: RbacRoleSlugParamDto,
    @Body() dto: UpdateRolePermissionsDto,
  ): Promise<RbacRoleResponseDto> {
    return this.rbacService.replaceRolePermissions(
      params.roleSlug,
      dto.permissionSlugs,
    );
  }
}
