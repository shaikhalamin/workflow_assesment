# Backend Workflow Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the assessment backend for authenticated ERP workflow configuration, runtime approvals, expense/leave/payment flows, dashboards, audit logs, notifications, and idempotent development seed data.

**Architecture:** Add focused NestJS modules under `src/modules` and register them from `AppModule`. Use TypeORM entities with development `synchronize`, cookie-based Passport JWT auth, normalized RBAC, a workflow-builder configuration layer, a workflow-runtime execution layer, and business modules that trigger workflows through in-process service calls.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Passport JWT, `@nestjs/jwt`, `bcryptjs`, class-validator, Swagger, Jest, Supertest.

---

## File Structure

Install dependency:
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

Shared auth and access control:
- Modify: `src/common/types/express.d.ts` so `Express.User` contains `userId`, `email`, `roles`, `permissions`, and refresh `sid`.
- Keep: `src/common/decorators/current-user.decorator.ts`
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/decorators/permissions.decorator.ts`
- Create: `src/common/guards/jwt-auth.guard.ts`
- Create: `src/common/guards/roles.guard.ts`
- Create: `src/common/guards/permissions.guard.ts`

Application composition:
- Modify: `src/app.module.ts`

Modules and key responsibilities:
- Create `src/modules/departments/*`: department entity and lookup service.
- Create `src/modules/rbac/*`: role, permission, join entities, decorators, permission lookup helpers.
- Create `src/modules/users/*`: user entity, user lookup, role-filtered `/users` endpoint.
- Create `src/modules/auth/*`: login, refresh rotation, logout, cookie issuing, JWT strategy.
- Create `src/modules/seed/*`: idempotent development seeding.
- Create `src/modules/workflow-builder/*`: templates, event schemas, conditions, rules, steps, outcomes, validation, publish/deactivate/duplicate.
- Create `src/modules/workflow-runtime/*`: rule engine, trigger, assignee resolution, step actions, workflow actions, runtime listings.
- Create `src/modules/expenses/*`: expense CRUD, submit, resubmit, permission-aware listing.
- Create `src/modules/leaves/*`: leave CRUD, submit, resubmit, permission-aware listing.
- Create `src/modules/payments/*`: payment requests and mark-paid.
- Create `src/modules/audit-logs/*`: audit trail entity and filtered listing.
- Create `src/modules/notifications/*`: notification entity and summary helpers.
- Create `src/modules/dashboard/*`: role-specific aggregate endpoints.

Test files:
- Create focused specs next to each service: `*.service.spec.ts`.
- Modify or replace `test/app.e2e-spec.ts` with seeded demo HTTP flows after the modules compile.

Conventions to preserve:
- Controllers return raw values; `TransformInterceptor` wraps responses.
- List endpoints return `Paginated` via `paginateRepo` or `paginateQb`.
- All HTTP paths are under the existing global `/api` prefix.
- Swagger decorators should describe cookies and DTO fields, but controller return values remain normal NestJS values.

---

## Shared Constants

Use these enum values exactly across entities, DTO validation, seed data, and tests:

```ts
export enum WorkflowTemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkflowInstanceStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum WorkflowStepStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
}

export enum WorkflowActionType {
  TRIGGERED = 'TRIGGERED',
  STEP_ACTIVATED = 'STEP_ACTIVATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMMENTED = 'COMMENTED',
  REASSIGNED = 'REASSIGNED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum WorkflowStepType {
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  FINANCE_CHECK = 'FINANCE_CHECK',
  HR_CHECK = 'HR_CHECK',
  MANAGEMENT_APPROVAL = 'MANAGEMENT_APPROVAL',
  FINAL_VERIFICATION = 'FINAL_VERIFICATION',
}

export enum WorkflowAssigneeType {
  ROLE = 'ROLE',
  USER = 'USER',
  REQUESTER_MANAGER = 'REQUESTER_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  CUSTOM_FIELD_USER = 'CUSTOM_FIELD_USER',
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum LeaveRequestStatus {
  DRAFT = 'DRAFT',
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentRequestStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
```

---

### Task 1: Dependencies and Auth/RBAC Entities

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/common/types/express.d.ts`
- Create: `src/modules/departments/entities/department.entity.ts`
- Create: `src/modules/users/entities/user.entity.ts`
- Create: `src/modules/rbac/entities/role.entity.ts`
- Create: `src/modules/rbac/entities/permission.entity.ts`
- Create: `src/modules/rbac/entities/role-permission.entity.ts`
- Create: `src/modules/rbac/entities/user-role.entity.ts`
- Create: `src/modules/auth/entities/refresh-token-session.entity.ts`
- Create: `src/modules/users/users.module.ts`
- Create: `src/modules/rbac/rbac.module.ts`
- Create: `src/modules/departments/departments.module.ts`
- Create: `src/modules/auth/auth.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Install password hashing dependency**

Run:

```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

Expected: `package.json` contains `bcryptjs` in dependencies and `@types/bcryptjs` in devDependencies.

- [ ] **Step 2: Write entity metadata tests**

Create `src/modules/auth/auth-entities.spec.ts`:

```ts
import { getMetadataArgsStorage } from 'typeorm';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { Department } from '../departments/entities/department.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';

describe('auth and rbac entities', () => {
  it('registers the expected tables', () => {
    const tables = getMetadataArgsStorage().tables.map((table) => table.target);
    expect(tables).toEqual(
      expect.arrayContaining([
        Department,
        User,
        Role,
        Permission,
        RolePermission,
        UserRole,
        RefreshTokenSession,
      ]),
    );
  });

  it('keeps stable role and permission slug columns unique', () => {
    const uniques = getMetadataArgsStorage().uniques.map((unique) => ({
      target: unique.target,
      columns: unique.columns,
    }));
    expect(uniques).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: Role, columns: ['slug'] }),
        expect.objectContaining({ target: Permission, columns: ['slug'] }),
        expect.objectContaining({ target: Department, columns: ['slug'] }),
      ]),
    );
  });
});
```

- [ ] **Step 3: Run the failing entity test**

Run:

```bash
pnpm test -- auth-entities.spec.ts
```

Expected: FAIL because the entity files do not exist.

- [ ] **Step 4: Implement entities**

Create entities with UUID primary keys, `@CreateDateColumn`, `@UpdateDateColumn` where the catalog includes `updatedAt`, explicit table names from the spec, `jsonb` for JSON fields, and `numeric` columns represented as strings when precision matters.

Use this base pattern for each entity:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'roles' })
@Unique(['slug'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ default: false })
  isSystem!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

Entity-specific columns:
- `Department`: `name`, unique `slug`, nullable `headUserId`.
- `User`: `name`, unique `email`, `passwordHash`, unique nullable `employeeCode`, nullable `employeeGrade`, nullable `designation`, nullable `departmentId`, nullable `managerId`, `isActive`, nullable `lastLoginAt`.
- `Permission`: `name`, unique `slug`, nullable `description`, `resource`, `action`.
- `RolePermission`: `roleId`, `permissionId`, relations to `Role` and `Permission`, unique pair.
- `UserRole`: `userId`, `roleId`, relations to `User` and `Role`, unique pair.
- `RefreshTokenSession`: `userId`, `tokenHash`, unique `jti`, `expiresAt`, nullable `revokedAt`, nullable `replacedBySessionId`, nullable `userAgent`, nullable `ipAddress`.

- [ ] **Step 5: Update Express user type**

Set `src/common/types/express.d.ts` to:

```ts
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      roles: string[];
      permissions: string[];
      sid: string | null;
    }
  }
}

export {};
```

- [ ] **Step 6: Register modules**

Create module shells exporting their TypeORM repositories, then import them from `AppModule`:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
```

Run:

```bash
pnpm test -- auth-entities.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Verify build and commit**

Run:

```bash
pnpm build
git add package.json pnpm-lock.yaml src/common/types/express.d.ts src/modules src/app.module.ts
git commit -m "feat: add auth rbac base entities"
```

Expected: build succeeds and commit is created.

---

### Task 2: Auth Services, Cookies, Guards, and `/auth` APIs

**Files:**
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/decorators/permissions.decorator.ts`
- Create: `src/common/guards/jwt-auth.guard.ts`
- Create: `src/common/guards/roles.guard.ts`
- Create: `src/common/guards/permissions.guard.ts`
- Create: `src/modules/auth/dto/login.dto.ts`
- Create: `src/modules/auth/dto/auth-response.dto.ts`
- Create: `src/modules/auth/jwt.strategy.ts`
- Create: `src/modules/auth/auth.service.ts`
- Create: `src/modules/auth/auth.controller.ts`
- Modify: `src/modules/auth/auth.module.ts`
- Create: `src/modules/users/users.service.ts`
- Create: `src/modules/rbac/rbac.service.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write auth service tests**

Create `src/modules/auth/auth.service.spec.ts`:

```ts
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'employee@example.com',
    passwordHash: '',
    isActive: true,
    roles: ['employee'],
    permissions: ['auth.profile.read'],
  };

  it('rejects invalid passwords', async () => {
    user.passwordHash = await bcrypt.hash('Password123!', 10);
    const service = new AuthService(
      { findByEmailWithAccess: jest.fn().mockResolvedValue(user) } as never,
      { revokeActiveSessionsForUser: jest.fn() } as never,
      new JwtService({ secret: 'a'.repeat(32) }),
      { domain: 'localhost' } as never,
    );

    await expect(
      service.login({ email: user.email, password: 'wrong' }, {} as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run the failing auth test**

Run:

```bash
pnpm test -- auth.service.spec.ts
```

Expected: FAIL because `AuthService` does not exist.

- [ ] **Step 3: Implement DTOs and decorators**

Create:

```ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

`LoginDto` contains validated `email` and `password`. `AuthResponseDto` contains `user: { id, name, email, roles, permissions }`.

- [ ] **Step 4: Implement `UsersService` and `RbacService`**

`UsersService.findByEmailWithAccess(email)` loads an active user plus roles and permissions using joins over `user_roles`, `roles`, `role_permissions`, and `permissions`, and returns:

```ts
{
  id: user.id,
  name: user.name,
  email: user.email,
  passwordHash: user.passwordHash,
  isActive: user.isActive,
  roles: roleSlugs,
  permissions: permissionSlugs,
}
```

`RbacService.userHasRole(userId, roleSlug)` returns true when a matching `user_roles` row exists. `RbacService.permissionsForUser(userId)` returns distinct permission slugs.

- [ ] **Step 5: Implement `AuthService`**

Required methods:
- `login(dto, request)`: validates password, revokes active sessions for the user, creates access and refresh JWTs, stores a hashed refresh token session, returns cookies and user summary.
- `refresh(refreshToken, request)`: validates refresh JWT, checks active session by `sid` and `jti`, compares hash, revokes old session, creates replacement session, returns new cookies and user summary.
- `logout(refreshToken)`: revokes the matching active refresh session.
- `buildCookieOptions(maxAgeMs)`: returns `httpOnly: true`, `sameSite: 'lax'`, `secure: false` outside production, configured domain.

Use payloads:

```ts
type AccessPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type RefreshPayload = {
  sub: string;
  sid: string;
  jti: string;
};
```

- [ ] **Step 6: Implement Passport strategy and guards**

`JwtStrategy` extracts `access_token` from `req.cookies`, validates payload, and returns `Express.User`.

`JwtAuthGuard` extends Passport `AuthGuard('jwt')`, allows routes decorated with `@Public()`, and throws unauthorized otherwise.

`RolesGuard` checks `@Roles()` metadata against `request.user.roles`.

`PermissionsGuard` checks `@Permissions()` metadata against `request.user.permissions`.

Register global guards in `AppModule` after `ThrottlerGuard`:

```ts
providers: [
  AppService,
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
  { provide: APP_GUARD, useClass: PermissionsGuard },
]
```

- [ ] **Step 7: Implement controller**

Routes:
- `POST /auth/login` public, sets `access_token` and `refresh_token` cookies.
- `POST /auth/refresh` public, reads `refresh_token`, rotates cookies.
- `POST /auth/logout` protected, revokes refresh session and clears cookies.
- `GET /auth/me` protected, returns current user summary.

- [ ] **Step 8: Run auth tests and commit**

Run:

```bash
pnpm test -- auth.service.spec.ts
pnpm build
git add src/common src/modules/auth src/modules/users src/modules/rbac src/app.module.ts
git commit -m "feat: add cookie jwt authentication"
```

Expected: tests and build pass.

---

### Task 3: Seed Data and User Lookup

**Files:**
- Create: `src/modules/seed/seed.module.ts`
- Create: `src/modules/seed/seed.service.ts`
- Create: `src/modules/users/dto/user-query.dto.ts`
- Create: `src/modules/users/users.controller.ts`
- Modify: `src/modules/users/users.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write seed idempotency test**

Create `src/modules/seed/seed.service.spec.ts`:

```ts
import { SeedService } from './seed.service';

describe('SeedService', () => {
  it('uses stable role slugs required by the assessment', () => {
    expect(SeedService.roleSeeds.map((role) => role.slug)).toEqual([
      'employee',
      'department-reviewer',
      'manager',
      'accounts-officer',
      'finance-admin',
      'hr-officer',
      'hr-manager',
      'cfo',
      'payroll-officer',
      'admin',
    ]);
  });

  it('uses the shared development password marker', () => {
    expect(SeedService.developmentPassword).toBe('Password123!');
  });
});
```

- [ ] **Step 2: Run the failing seed test**

Run:

```bash
pnpm test -- seed.service.spec.ts
```

Expected: FAIL because `SeedService` does not exist.

- [ ] **Step 3: Implement `SeedService`**

Implement `OnApplicationBootstrap`. Exit immediately unless `NODE_ENV === 'development'`.

Static seed arrays:
- Departments: Sales, Accounts, Finance, HR, Payroll.
- Roles: exact slugs from the test.
- Permissions: `auth.profile.read`, `users.read`, `workflow.builder.manage`, `workflow.runtime.act`, `expenses.read`, `expenses.write`, `leaves.read`, `leaves.write`, `payments.read`, `payments.write`, `dashboard.read`, `audit.read`.
- Users: admin, employee, manager, accounts officer, finance admin, HR officer, HR manager, CFO, payroll officer with password `Password123!`.

For idempotency, every insert checks by stable slug, email, or unique pair before saving.

- [ ] **Step 4: Implement `/users?roleSlug=&limit=`**

`UserQueryDto` extends pagination with optional `roleSlug`.

`UsersController.getUsers()` requires `users.read`; when `roleSlug` is present, join through `user_roles` and `roles`; select `id`, `name`, `email`, `employeeCode`, `designation`, `departmentId`, `isActive`; return `Paginated`.

- [ ] **Step 5: Register seed module only in development**

In `AppModule`, conditionally include `SeedModule`:

```ts
const devModules = process.env.NODE_ENV === 'production' ? [] : [SeedModule];
```

Then spread `...devModules` in imports after all seeded modules.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm test -- seed.service.spec.ts
pnpm build
git add src/modules/seed src/modules/users src/app.module.ts
git commit -m "feat: seed baseline users and rbac"
```

Expected: tests and build pass.

---

### Task 4: Workflow Builder Entities and Condition Validation

**Files:**
- Create: `src/modules/workflow-builder/enums/workflow-builder.enums.ts`
- Create: `src/modules/workflow-builder/entities/workflow-template.entity.ts`
- Create: `src/modules/workflow-builder/entities/workflow-event-schema.entity.ts`
- Create: `src/modules/workflow-builder/entities/workflow-trigger-condition.entity.ts`
- Create: `src/modules/workflow-builder/entities/workflow-approval-rule.entity.ts`
- Create: `src/modules/workflow-builder/entities/workflow-approval-step-config.entity.ts`
- Create: `src/modules/workflow-builder/entities/workflow-outcome-config.entity.ts`
- Create: `src/modules/workflow-builder/condition.types.ts`
- Create: `src/modules/workflow-builder/condition-validator.service.ts`
- Create: `src/modules/workflow-builder/workflow-builder.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write condition validator tests**

Create `src/modules/workflow-builder/condition-validator.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { ConditionValidatorService } from './condition-validator.service';

describe('ConditionValidatorService', () => {
  const service = new ConditionValidatorService();
  const schema = {
    fields: [
      { key: 'amount', type: 'number', operators: ['gte', 'lt', 'between'] },
      { key: 'category', type: 'select', operators: ['eq', 'in'] },
      { key: 'customFields.budgetOwnerId', type: 'user', operators: ['eq'] },
    ],
  };

  it('accepts valid all-mode conditions', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [
          { field: 'amount', operator: 'gte', value: 5000 },
          { field: 'amount', operator: 'lt', value: 10000 },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [{ field: 'missing', operator: 'eq', value: 'x' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects operators that field schemas do not allow', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [{ field: 'category', operator: 'gte', value: 1 }],
      }),
    ).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run the failing condition test**

Run:

```bash
pnpm test -- condition-validator.service.spec.ts
```

Expected: FAIL because `ConditionValidatorService` does not exist.

- [ ] **Step 3: Implement workflow-builder enums and condition types**

Create `workflow-builder.enums.ts` with workflow template status, step type, assignee type, condition operators, field types, and condition modes from the spec.

Create `condition.types.ts`:

```ts
export type ConditionMode = 'all' | 'any';
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionClause {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  mode: ConditionMode;
  conditions: ConditionClause[];
}

export interface EventFieldSchema {
  key: string;
  type: string;
  operators: ConditionOperator[];
}

export interface WorkflowEventFieldSchema {
  fields: EventFieldSchema[];
}
```

- [ ] **Step 4: Implement `ConditionValidatorService`**

Validate:
- `mode` is `all` or `any`.
- `conditions` is a non-empty array when required.
- field keys are unique inside event schema.
- every condition field exists in schema.
- every condition operator is valid for that field.
- `between` has a two-item array value.
- `in` and `not_in` have array values.

- [ ] **Step 5: Implement builder entities**

Use table names and field catalog exactly:
- `workflow_templates`
- `workflow_event_schemas`
- `workflow_trigger_conditions`
- `workflow_approval_rules`
- `workflow_approval_step_configs`
- `workflow_outcome_configs`

Relationships:
- Template has trigger condition, rules, and outcome config.
- Rule belongs to template and has many step configs.
- Step config belongs to rule.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm test -- condition-validator.service.spec.ts
pnpm build
git add src/modules/workflow-builder src/app.module.ts
git commit -m "feat: add workflow builder model"
```

Expected: tests and build pass.

---

### Task 5: Workflow Builder APIs

**Files:**
- Create: `src/modules/workflow-builder/dto/create-workflow-template.dto.ts`
- Create: `src/modules/workflow-builder/dto/update-workflow-template.dto.ts`
- Create: `src/modules/workflow-builder/dto/create-workflow-event-schema.dto.ts`
- Create: `src/modules/workflow-builder/dto/update-workflow-event-schema.dto.ts`
- Create: `src/modules/workflow-builder/dto/create-workflow-rule.dto.ts`
- Create: `src/modules/workflow-builder/dto/update-workflow-rule.dto.ts`
- Create: `src/modules/workflow-builder/dto/create-workflow-step-config.dto.ts`
- Create: `src/modules/workflow-builder/dto/update-workflow-step-config.dto.ts`
- Create: `src/modules/workflow-builder/dto/workflow-wizard.dto.ts`
- Create: `src/modules/workflow-builder/workflow-template.service.ts`
- Create: `src/modules/workflow-builder/workflow-template.controller.ts`
- Create: `src/modules/workflow-builder/workflow-event-schema.service.ts`
- Create: `src/modules/workflow-builder/workflow-event-schema.controller.ts`
- Create: `src/modules/workflow-builder/workflow-rule.service.ts`
- Create: `src/modules/workflow-builder/workflow-rule.controller.ts`
- Create: `src/modules/workflow-builder/workflow-step-config.controller.ts`
- Modify: `src/modules/workflow-builder/workflow-builder.module.ts`

- [ ] **Step 1: Write publish validation tests**

Create `src/modules/workflow-builder/workflow-template.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { WorkflowTemplateService } from './workflow-template.service';

describe('WorkflowTemplateService publish validation', () => {
  it('rejects publishing templates without active rules', async () => {
    const service = new WorkflowTemplateService(
      { findOne: jest.fn().mockResolvedValue({ id: 'tpl-1', rules: [] }) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.publish('tpl-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
```

- [ ] **Step 2: Run the failing publish test**

Run:

```bash
pnpm test -- workflow-template.service.spec.ts
```

Expected: FAIL because `WorkflowTemplateService` does not exist.

- [ ] **Step 3: Implement DTOs**

Create class-validator DTOs for:
- `CreateWorkflowTemplateDto`
- `UpdateWorkflowTemplateDto`
- `CreateWorkflowEventSchemaDto`
- `UpdateWorkflowEventSchemaDto`
- `CreateWorkflowRuleDto`
- `UpdateWorkflowRuleDto`
- `CreateWorkflowStepConfigDto`
- `UpdateWorkflowStepConfigDto`
- `WorkflowWizardDto`

Use `@IsEnum`, `@IsString`, `@IsUUID`, `@IsOptional`, `@IsBoolean`, `@IsInt`, `@Min`, `@ValidateNested`, `@IsObject`, and `@Type(() => NestedDto)` explicitly.

- [ ] **Step 4: Implement services**

Service behavior:
- List templates with pagination.
- Create/update full wizard payloads transactionally.
- Create/update event schemas after validating unique field keys.
- Deactivate event schema by setting `isActive = false`.
- Create/update/delete rules and step configs.
- Enforce one fallback rule per template.
- Enforce unique rule priority per template.
- Enforce unique step order per rule.
- Validate step assignee fields: `ROLE` requires `assigneeRoleSlug`, `USER` requires `assigneeUserId`, `CUSTOM_FIELD_USER` requires `assigneeFieldPath`.
- Publish only when every active rule has at least one step and non-fallback rules have a valid condition.
- Duplicate templates as `DRAFT` with copied trigger condition, rules, step configs, and outcomes.

- [ ] **Step 5: Implement controllers**

Routes:
- `GET /workflow-templates`
- `POST /workflow-templates`
- `GET /workflow-templates/:id`
- `PATCH /workflow-templates/:id`
- `POST /workflow-templates/:id/publish`
- `POST /workflow-templates/:id/deactivate`
- `POST /workflow-templates/:id/duplicate`
- `GET /workflow-event-schemas`
- `POST /workflow-event-schemas`
- `GET /workflow-event-schemas/:id`
- `PATCH /workflow-event-schemas/:id`
- `POST /workflow-event-schemas/:id/deactivate`
- `POST /workflow-templates/:id/rules`
- `PATCH /workflow-rules/:id`
- `DELETE /workflow-rules/:id`
- `POST /workflow-rules/:id/steps`
- `PATCH /workflow-step-configs/:id`
- `DELETE /workflow-step-configs/:id`

Protect all routes with `workflow.builder.manage`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm test -- workflow-template.service.spec.ts
pnpm build
git add src/modules/workflow-builder
git commit -m "feat: add workflow builder api"
```

Expected: tests and build pass.

---

### Task 6: Workflow Runtime Rule Engine and Entities

**Files:**
- Create: `src/modules/workflow-runtime/enums/workflow-runtime.enums.ts`
- Create: `src/modules/workflow-runtime/entities/workflow-instance.entity.ts`
- Create: `src/modules/workflow-runtime/entities/workflow-step.entity.ts`
- Create: `src/modules/workflow-runtime/entities/workflow-action.entity.ts`
- Create: `src/modules/workflow-runtime/rule-engine.service.ts`
- Create: `src/modules/workflow-runtime/workflow-runtime.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write rule engine tests**

Create `src/modules/workflow-runtime/rule-engine.service.spec.ts`:

```ts
import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  const service = new RuleEngineService();
  const data = {
    amount: 7500,
    category: 'travel',
    vendor: 'ACME',
    customFields: { budgetOwnerId: 'user-2' },
  };

  it('matches all-mode conditions', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          { field: 'amount', operator: 'gte', value: 5000 },
          { field: 'amount', operator: 'lt', value: 10000 },
        ],
      }),
    ).toBe(true);
  });

  it('matches nested field paths', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          {
            field: 'customFields.budgetOwnerId',
            operator: 'eq',
            value: 'user-2',
          },
        ],
      }),
    ).toBe(true);
  });

  it('supports in, not_in, contains, and empty operators', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          { field: 'category', operator: 'in', value: ['travel', 'meal'] },
          { field: 'category', operator: 'not_in', value: ['hardware'] },
          { field: 'vendor', operator: 'contains', value: 'CM' },
          { field: 'missing', operator: 'is_empty' },
        ],
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing rule engine test**

Run:

```bash
pnpm test -- rule-engine.service.spec.ts
```

Expected: FAIL because `RuleEngineService` does not exist.

- [ ] **Step 3: Implement runtime entities**

Create `workflow_instances`, `workflow_steps`, and `workflow_actions` entities with fields from the spec. Use enum columns for statuses/actions, `jsonb` for metadata, nullable dates for completion/rejection/acted fields, and relations back to template/rule/user where useful.

- [ ] **Step 4: Implement `RuleEngineService`**

Implement:
- `matches(data, conditionGroup)` using `all` for `every` and `any` for `some`.
- `getValue(data, path)` for dot paths.
- Operator functions for `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `in`, `not_in`, `contains`, `is_empty`, `is_not_empty`.

Use strict equality for `eq`; convert numeric comparisons with `Number(value)` and return false when either side is `NaN`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test -- rule-engine.service.spec.ts
pnpm build
git add src/modules/workflow-runtime src/app.module.ts
git commit -m "feat: add workflow runtime base"
```

Expected: tests and build pass.

---

### Task 7: Workflow Runtime Trigger, Assignees, Actions, and Outcomes

**Files:**
- Create: `src/modules/workflow-runtime/dto/trigger-workflow.dto.ts`
- Create: `src/modules/workflow-runtime/dto/workflow-action.dto.ts`
- Create: `src/modules/workflow-runtime/assignee-resolver.service.ts`
- Create: `src/modules/workflow-runtime/outcome-handler.service.ts`
- Create: `src/modules/workflow-runtime/workflow-runtime.service.ts`
- Create: `src/modules/workflow-runtime/workflow-runtime.controller.ts`
- Modify: `src/modules/workflow-runtime/workflow-runtime.module.ts`

- [ ] **Step 1: Write assignee resolver tests**

Create `src/modules/workflow-runtime/assignee-resolver.service.spec.ts`:

```ts
import { AssigneeResolverService } from './assignee-resolver.service';
import { WorkflowAssigneeType } from '../workflow-builder/enums/workflow-builder.enums';

describe('AssigneeResolverService', () => {
  it('resolves exact user steps', async () => {
    const service = new AssigneeResolverService({} as never, {} as never);
    await expect(
      service.resolve(
        {
          assigneeType: WorkflowAssigneeType.USER,
          assigneeUserId: 'user-1',
        } as never,
        { requesterId: 'requester-1', metadata: {} } as never,
      ),
    ).resolves.toEqual({ assignedUserId: 'user-1', assignedRoleSlug: null });
  });
});
```

- [ ] **Step 2: Run the failing assignee resolver test**

Run:

```bash
pnpm test -- assignee-resolver.service.spec.ts
```

Expected: FAIL because `AssigneeResolverService` does not exist.

- [ ] **Step 3: Implement assignee resolution**

Behavior:
- `USER`: return exact `assignedUserId`.
- `ROLE`: return `assignedRoleSlug`.
- `REQUESTER_MANAGER`: load requester and return `requester.managerId`.
- `DEPARTMENT_HEAD`: load department and return `department.headUserId`.
- `CUSTOM_FIELD_USER`: read user id from metadata using `assigneeFieldPath`.

Throw `BadRequestException` when a resolver has no concrete assignee.

- [ ] **Step 4: Implement runtime trigger**

`WorkflowRuntimeService.trigger(dto)`:
- Finds published templates for `moduleName`, `eventName`, and `entityType`, ordered by priority descending.
- Evaluates trigger condition; returns `{ status: 'skipped' }` when no trigger condition matches.
- Selects first active approval rule whose condition matches; uses fallback when no normal rule matches.
- Throws `BadRequestException` when no rule applies.
- Creates `WorkflowInstance` as `ACTIVE`.
- Creates waiting `WorkflowStep` rows from selected rule steps.
- Activates the first step.
- Writes `WorkflowAction` rows for `TRIGGERED` and `STEP_ACTIVATED`.
- Returns instance id and active step summary.

- [ ] **Step 5: Implement approve/reject/comment**

`approveStep(stepId, actor, dto)`:
- Requires active step.
- Validates exact user or role assignment.
- Marks step approved.
- Activates next waiting step, or finalizes instance approved and calls `OutcomeHandlerService.handleApproved(instance)`.

`rejectStep(stepId, actor, dto)`:
- Requires active step and `reason`.
- Validates assignment.
- Marks step and instance rejected.
- Marks remaining waiting steps skipped.
- Calls `OutcomeHandlerService.handleRejected(instance, reason)`.

`commentStep(stepId, actor, dto)` writes a `COMMENTED` action without status changes.

- [ ] **Step 6: Implement runtime controller**

Routes:
- `POST /workflow-runtime/trigger` protected by `workflow.builder.manage` for admin testing.
- `GET /workflow-instances` protected by `workflow.runtime.act`.
- `GET /workflow-instances/:id` protected by `workflow.runtime.act`.
- `GET /workflow-tasks/my-pending` protected by `workflow.runtime.act`.
- `POST /workflow-steps/:id/approve` protected by `workflow.runtime.act`.
- `POST /workflow-steps/:id/reject` protected by `workflow.runtime.act`.
- `POST /workflow-steps/:id/comment` protected by `workflow.runtime.act`.

- [ ] **Step 7: Verify and commit**

Run:

```bash
pnpm test -- assignee-resolver.service.spec.ts
pnpm build
git add src/modules/workflow-runtime
git commit -m "feat: execute workflow approvals"
```

Expected: tests and build pass.

---

### Task 8: Audit Logs and Notifications

**Files:**
- Create: `src/modules/audit-logs/entities/audit-log.entity.ts`
- Create: `src/modules/audit-logs/audit-logs.service.ts`
- Create: `src/modules/audit-logs/audit-logs.controller.ts`
- Create: `src/modules/audit-logs/audit-logs.module.ts`
- Create: `src/modules/notifications/entities/notification.entity.ts`
- Create: `src/modules/notifications/notifications.service.ts`
- Create: `src/modules/notifications/notifications.module.ts`
- Modify: `src/modules/workflow-runtime/workflow-runtime.service.ts`
- Modify: `src/modules/workflow-runtime/workflow-runtime.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write audit service test**

Create `src/modules/audit-logs/audit-logs.service.spec.ts`:

```ts
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  it('records actor, action, entity, workflow, and status transition', async () => {
    const save = jest.fn().mockImplementation((value) => Promise.resolve(value));
    const service = new AuditLogsService({ create: (v: unknown) => v, save } as never);

    await service.record({
      actorUserId: 'user-1',
      action: 'WORKFLOW_STEP_APPROVED',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'instance-1',
      workflowStepId: 'step-1',
      oldStatus: 'ACTIVE',
      newStatus: 'APPROVED',
      comment: 'ok',
      reason: null,
      metadataJson: { amount: 100 },
    });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'WORKFLOW_STEP_APPROVED',
        entityType: 'Expense',
      }),
    );
  });
});
```

- [ ] **Step 2: Run the failing audit test**

Run:

```bash
pnpm test -- audit-logs.service.spec.ts
```

Expected: FAIL because `AuditLogsService` does not exist.

- [ ] **Step 3: Implement entities and services**

`AuditLog` fields match the spec. `Notification` fields match the spec.

`AuditLogsService.record(input)` saves one audit log. `AuditLogsService.list(query, actor)` applies permission-aware filters:
- admin permission sees all.
- users without admin permission see records where `actorUserId` is themselves or source entity visibility services later add entity-specific constraints.

`NotificationsService.createTaskAssigned`, `createWorkflowApproved`, `createWorkflowRejected`, `createPaymentCreated`, and `createPaymentPaid` create concise notification rows.

- [ ] **Step 4: Wire runtime audit and notifications**

On trigger: record `WORKFLOW_TRIGGERED`, notify first assignee.

On approve: record `WORKFLOW_STEP_APPROVED`, notify next assignee or requester when complete.

On reject: record `WORKFLOW_STEP_REJECTED`, notify requester.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test -- audit-logs.service.spec.ts
pnpm build
git add src/modules/audit-logs src/modules/notifications src/modules/workflow-runtime src/app.module.ts
git commit -m "feat: record workflow audit events"
```

Expected: tests and build pass.

---

### Task 9: Expenses, Payments, and Expense Outcomes

**Files:**
- Create: `src/modules/expenses/entities/expense.entity.ts`
- Create: `src/modules/expenses/dto/create-expense.dto.ts`
- Create: `src/modules/expenses/dto/update-expense.dto.ts`
- Create: `src/modules/expenses/dto/expense-query.dto.ts`
- Create: `src/modules/expenses/dto/resubmit-expense.dto.ts`
- Create: `src/modules/expenses/expenses.service.ts`
- Create: `src/modules/expenses/expenses.controller.ts`
- Create: `src/modules/expenses/expenses.module.ts`
- Create: `src/modules/payments/entities/payment-request.entity.ts`
- Create: `src/modules/payments/payments.service.ts`
- Create: `src/modules/payments/payments.controller.ts`
- Create: `src/modules/payments/payments.module.ts`
- Modify: `src/modules/workflow-runtime/outcome-handler.service.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write expense submit test**

Create `src/modules/expenses/expenses.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseStatus } from './entities/expense.entity';

describe('ExpensesService', () => {
  it('submits a draft expense and triggers workflow metadata', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      amount: '7500',
      currency: 'BDT',
      category: 'travel',
      status: ExpenseStatus.DRAFT,
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ workflowInstanceId: 'wi-1' }),
    };
    const service = new ExpensesService(repo as never, runtime as never, {} as never);

    await service.submit('expense-1', { userId: 'user-1' } as never);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.UNDER_REVIEW,
        workflowInstanceId: 'wi-1',
      }),
    );
  });

  it('rejects submit by a non-owner', async () => {
    const service = new ExpensesService(
      { findOneBy: jest.fn().mockResolvedValue({ requesterId: 'owner-1' }) } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.submit('expense-1', { userId: 'other-1' } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
```

- [ ] **Step 2: Run the failing expense test**

Run:

```bash
pnpm test -- expenses.service.spec.ts
```

Expected: FAIL because `ExpensesService` does not exist.

- [ ] **Step 3: Implement expense module**

`Expense` fields match the spec. Controllers:
- `POST /expenses`
- `GET /expenses`
- `GET /expenses/:id`
- `PATCH /expenses/:id`
- `POST /expenses/:id/submit`
- `POST /expenses/:id/resubmit`

Permissions:
- write routes require `expenses.write`.
- read routes require `expenses.read`.

Listing rules:
- admin sees all.
- requester sees own expenses.
- manager sees own department expenses.
- accounts and finance roles see expense/payment data.

- [ ] **Step 4: Implement payment module**

`PaymentRequest` fields match the spec. Controllers:
- `GET /payment-requests`
- `GET /payment-requests/:id`
- `POST /payment-requests/:id/mark-paid`

`markPaid` sets payment status `PAID`, sets linked expense `PAID`, sets `paidById`, `paidAt`, `paymentReference`, and records audit/notification.

- [ ] **Step 5: Implement expense outcome handler**

When expense workflow approved:
- Set expense status to `PAYMENT_PENDING`.
- Set `approvedAt`.
- Create one pending payment request.
- Notify requester and accounts role.

When rejected:
- Set expense status to `REJECTED`.
- Store rejection reason.
- Set `rejectedAt`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm test -- expenses.service.spec.ts
pnpm build
git add src/modules/expenses src/modules/payments src/modules/workflow-runtime src/app.module.ts
git commit -m "feat: add expense and payment workflows"
```

Expected: tests and build pass.

---

### Task 10: Leave Requests and Leave Outcomes

**Files:**
- Create: `src/modules/leaves/entities/leave-request.entity.ts`
- Create: `src/modules/leaves/dto/create-leave.dto.ts`
- Create: `src/modules/leaves/dto/update-leave.dto.ts`
- Create: `src/modules/leaves/dto/leave-query.dto.ts`
- Create: `src/modules/leaves/dto/resubmit-leave.dto.ts`
- Create: `src/modules/leaves/leaves.service.ts`
- Create: `src/modules/leaves/leaves.controller.ts`
- Create: `src/modules/leaves/leaves.module.ts`
- Modify: `src/modules/workflow-runtime/outcome-handler.service.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write leave submit test**

Create `src/modules/leaves/leaves.service.spec.ts`:

```ts
import { LeavesService } from './leaves.service';
import { LeaveRequestStatus } from './entities/leave-request.entity';

describe('LeavesService', () => {
  it('submits a draft leave request and triggers workflow metadata', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      status: LeaveRequestStatus.DRAFT,
      employeeGrade: 'G5',
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ workflowInstanceId: 'wi-2' }),
    };
    const service = new LeavesService(repo as never, runtime as never, {} as never);

    await service.submit('leave-1', { userId: 'user-1' } as never);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LeaveRequestStatus.UNDER_REVIEW,
        workflowInstanceId: 'wi-2',
      }),
    );
  });
});
```

- [ ] **Step 2: Run the failing leave test**

Run:

```bash
pnpm test -- leaves.service.spec.ts
```

Expected: FAIL because `LeavesService` does not exist.

- [ ] **Step 3: Implement leave module**

`LeaveRequest` fields match the spec. Controllers:
- `POST /leaves`
- `GET /leaves`
- `GET /leaves/:id`
- `PATCH /leaves/:id`
- `POST /leaves/:id/submit`
- `POST /leaves/:id/resubmit`

Permissions:
- write routes require `leaves.write`.
- read routes require `leaves.read`.

Listing rules:
- employee sees own leaves.
- manager sees department leaves.
- HR roles see leave data.
- admin sees all.

- [ ] **Step 4: Implement leave outcome handler**

When approved:
- Set leave status `APPROVED`.
- Set `approvedAt`.
- Store `approvedPeriodJson` with `startDate`, `endDate`, and `leaveDays`.
- Notify requester.

When rejected:
- Set leave status `REJECTED`.
- Store rejection reason.
- Set `rejectedAt`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test -- leaves.service.spec.ts
pnpm build
git add src/modules/leaves src/modules/workflow-runtime src/app.module.ts
git commit -m "feat: add leave approval workflow"
```

Expected: tests and build pass.

---

### Task 11: Seed Workflow Definitions and Demo Records

**Files:**
- Modify: `src/modules/seed/seed.service.ts`

- [ ] **Step 1: Write workflow seed test**

Extend `src/modules/seed/seed.service.spec.ts`:

```ts
it('defines seeded workflow templates for expense, leave, and attendance', () => {
  expect(SeedService.workflowTemplateSeeds.map((workflow) => workflow.name)).toEqual([
    'Expense Approval Workflow',
    'Leave Approval Workflow',
    'Attendance Adjustment Workflow',
  ]);
});
```

- [ ] **Step 2: Run the failing seed workflow test**

Run:

```bash
pnpm test -- seed.service.spec.ts
```

Expected: FAIL because `workflowTemplateSeeds` is not defined.

- [ ] **Step 3: Seed event schemas**

Create event schemas for:
- Expense: module `expenses`, event `expense.submitted`, entity `Expense`, fields `amount`, `currency`, `category`, `vendor`, `itemValue`, `price`, `quantity`, `departmentId`, `customFields.budgetOwnerId`.
- Leave: module `leaves`, event `leave.submitted`, entity `LeaveRequest`, fields `leaveType`, `leaveDays`, `startDate`, `endDate`, `employeeGrade`, `departmentId`.
- Attendance: module `attendance`, event `attendance.adjustment_submitted`, entity `AttendanceAdjustment`, fields `adjustmentType`, `employeeGrade`, `departmentId`.

- [ ] **Step 4: Seed workflow templates**

Create:
- Published Expense Approval Workflow with trigger amount `gte 1`, normal rule for amount `gte 5000`, fallback rule, department review step, finance admin step, and approved/rejected outcome JSON.
- Published Leave Approval Workflow with manager step and HR manager step, approved/rejected outcome JSON.
- Draft Attendance Adjustment Workflow with one HR officer step.

- [ ] **Step 5: Seed sample records**

Create missing sample expenses, leaves, payment requests, audit logs, notifications, and workflow instances only when source tables have no demo rows. Use seeded users and departments by slug/email lookup.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm test -- seed.service.spec.ts
pnpm build
git add src/modules/seed
git commit -m "feat: seed workflow demo data"
```

Expected: tests and build pass.

---

### Task 12: Dashboards and Audit Listing

**Files:**
- Create: `src/modules/dashboard/dashboard.service.ts`
- Create: `src/modules/dashboard/dashboard.controller.ts`
- Create: `src/modules/dashboard/dashboard.module.ts`
- Modify: `src/modules/audit-logs/audit-logs.controller.ts`
- Modify: `src/modules/audit-logs/audit-logs.service.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write dashboard service test**

Create `src/modules/dashboard/dashboard.service.spec.ts`:

```ts
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns employee summary shape', async () => {
    const service = new DashboardService(
      { countBy: jest.fn().mockResolvedValue(2) } as never,
      { countBy: jest.fn().mockResolvedValue(1) } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.employee({ userId: 'user-1', roles: ['employee'], permissions: [] } as never),
    ).resolves.toEqual({
      expenses: expect.any(Object),
      leaves: expect.any(Object),
      recentItems: expect.any(Array),
    });
  });
});
```

- [ ] **Step 2: Run the failing dashboard test**

Run:

```bash
pnpm test -- dashboard.service.spec.ts
```

Expected: FAIL because `DashboardService` does not exist.

- [ ] **Step 3: Implement dashboard endpoints**

Routes:
- `GET /dashboard/admin`: workflow counts, recent workflow changes, failed triggers.
- `GET /dashboard/employee`: own expense and leave status summary.
- `GET /dashboard/approver`: pending tasks, acted tasks, overdue tasks, average approval time.
- `GET /dashboard/accounts`: accounts review tasks, pending payments, paid amount this month.
- `GET /dashboard/hr`: leave tasks and leave approval/rejection counts.

All routes require `dashboard.read`; service methods also limit data by the actor's role and user id.

- [ ] **Step 4: Implement audit listing endpoint**

Add:
- `GET /audit-logs`
- `GET /audit-logs/entity/:entityType/:entityId`
- `GET /audit-logs/workflow/:workflowInstanceId`

All routes require `audit.read`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test -- dashboard.service.spec.ts audit-logs.service.spec.ts
pnpm build
git add src/modules/dashboard src/modules/audit-logs src/app.module.ts
git commit -m "feat: add dashboards and audit listing"
```

Expected: tests and build pass.

---

### Task 13: HTTP E2E Demo Flow

**Files:**
- Modify: `test/app.e2e-spec.ts`

- [ ] **Step 1: Replace default e2e test**

Replace the default hello-world e2e test with a seeded demo flow:

```ts
describe('workflow demo flow (e2e)', () => {
  it('logs in, creates expense, submits it, and lists pending tasks', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: 'employee@example.com', password: 'Password123!' })
      .expect(201);

    const created = await agent
      .post('/api/expenses')
      .send({
        title: 'Travel reimbursement',
        description: 'Client visit',
        amount: 7500,
        currency: 'BDT',
        category: 'travel',
        vendor: 'ACME',
        itemValue: 7500,
        price: 7500,
        quantity: 1,
      })
      .expect(201);

    await agent
      .post(`/api/expenses/${created.body.data.id}/submit`)
      .send({})
      .expect(201);

    await agent.get('/api/workflow-tasks/my-pending').expect(200);
  });
});
```

- [ ] **Step 2: Run the e2e test**

Run:

```bash
pnpm test:e2e
```

Expected: PASS when PostgreSQL is available and development seed data has run.

- [ ] **Step 3: Verify full project**

Run:

```bash
pnpm test
pnpm build
```

Expected: all unit tests pass and build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add test/app.e2e-spec.ts
git commit -m "test: cover workflow demo flow"
```

Expected: commit is created.

---

## Self-Review Notes

Spec coverage:
- Auth, refresh token sessions, hashed and rotated refresh tokens, JWT cookies, guards, roles, and permissions are covered in Tasks 1-3.
- Normalized RBAC, users, departments, and seeded baseline data are covered in Tasks 1 and 3.
- Workflow builder entities, validation, full wizard behavior, granular APIs, publish/deactivate/duplicate, and event schemas are covered in Tasks 4-5 and Task 11.
- Runtime trigger, rule engine, dynamic steps, assignment validation, approve/reject/comment, action records, audit, notification, and outcomes are covered in Tasks 6-8.
- Expenses, leaves, payments, resubmission, permission-aware listings, and approved/rejected outcomes are covered in Tasks 9-10.
- Dashboards and audit trail APIs are covered in Task 12.
- Seeded demo workflows and sample records are covered in Task 11.
- End-to-end demo verification is covered in Task 13.

Implementation risks to check during execution:
- `package.json` currently pins `typeorm` as `^1.0.0`; if TypeORM decorators/types fail during build, inspect the installed lockfile version before changing dependency versions.
- `test:e2e` requires a valid `.env` and reachable PostgreSQL because `AppModule` loads the real `DatabaseModule`.
- Development seed data must run after all entities are registered through `TypeOrmModule.forFeature` and `autoLoadEntities`.
