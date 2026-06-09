import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RbacService } from './rbac.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
  ],
  providers: [RbacService],
  exports: [TypeOrmModule, RbacService],
})
export class RbacModule {}
