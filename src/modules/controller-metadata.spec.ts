import { Type } from '@nestjs/common';
import {
  METHOD_METADATA,
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLogsController } from './audit-logs/audit-logs.controller';
import { AuditLogResponseDto } from './audit-logs/dto/audit-log-response.dto';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensesController } from './expenses/expenses.controller';
import { CreateExpenseDto } from './expenses/dto/create-expense.dto';
import { ExpenseResponseDto } from './expenses/dto/expense-response.dto';
import { LeavesModule } from './leaves/leaves.module';
import { LeavesController } from './leaves/leaves.controller';
import { CreateLeaveDto } from './leaves/dto/create-leave.dto';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsController } from './payments/payments.controller';
import { PaymentRequestResponseDto } from './payments/dto/payment-request-response.dto';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UserResponseDto } from './users/dto/user-response.dto';
import { WorkflowBuilderModule } from './workflow-builder/workflow-builder.module';
import { CreateWorkflowStepConfigDto } from './workflow-builder/dto/create-workflow-step-config.dto';
import { CreateWorkflowTemplateDto } from './workflow-builder/dto/create-workflow-template.dto';
import {
  WorkflowApprovalStepConfigResponseDto,
  WorkflowTemplateResponseDto,
} from './workflow-builder/dto/workflow-builder-response.dto';
import { WorkflowEventSchemaController } from './workflow-builder/workflow-event-schema.controller';
import { WorkflowRuleController } from './workflow-builder/workflow-rule.controller';
import { WorkflowStepConfigController } from './workflow-builder/workflow-step-config.controller';
import { WorkflowTemplateController } from './workflow-builder/workflow-template.controller';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';
import { TriggerWorkflowDto } from './workflow-runtime/dto/trigger-workflow.dto';
import {
  WorkflowActionResponseDto,
  WorkflowInstanceResponseDto,
  WorkflowStepResponseDto,
} from './workflow-runtime/dto/workflow-runtime-response.dto';
import { WorkflowRuntimeController } from './workflow-runtime/workflow-runtime.controller';

type ControllerMethod = (...args: unknown[]) => unknown;

const SWAGGER_RESPONSE_METADATA = 'swagger/apiResponse';
const SWAGGER_MODEL_PROPERTIES_METADATA = 'swagger/apiModelProperties';
const SWAGGER_MODEL_PROPERTIES_ARRAY_METADATA =
  'swagger/apiModelPropertiesArray';

interface RouteArgMetadata {
  index: number;
}

interface SwaggerPropertyMetadata {
  example?: unknown;
  default?: unknown;
  enum?: unknown;
  type?: unknown;
}

interface SwaggerResponseMetadata {
  schema?: unknown;
}

const modules = [
  AuditLogsModule,
  AuthModule,
  DashboardModule,
  ExpensesModule,
  LeavesModule,
  PaymentsModule,
  UsersModule,
  WorkflowBuilderModule,
  WorkflowRuntimeModule,
];

const controllers: Type<unknown>[] = [
  AuditLogsController,
  AuthController,
  DashboardController,
  ExpensesController,
  LeavesController,
  PaymentsController,
  UsersController,
  WorkflowEventSchemaController,
  WorkflowRuleController,
  WorkflowStepConfigController,
  WorkflowTemplateController,
  WorkflowRuntimeController,
];

function routeMethods(controller: Type<unknown>) {
  const prototype = prototypeOf(controller) as Record<string, unknown>;
  return Object.getOwnPropertyNames(prototype)
    .filter((propertyName) => propertyName !== 'constructor')
    .map((propertyName) => ({
      propertyName,
      handler: prototype[propertyName],
    }))
    .filter(
      (route): route is { propertyName: string; handler: ControllerMethod } =>
        typeof route.handler === 'function' &&
        metadata(METHOD_METADATA, route.handler) !== undefined,
    );
}

function prototypeOf(type: Type<unknown>): object {
  return type.prototype as object;
}

function metadata(key: string, target: object, propertyKey?: string): unknown {
  const value: unknown =
    propertyKey === undefined
      ? Reflect.getMetadata(key, target)
      : Reflect.getMetadata(key, target, propertyKey);
  return value;
}

function typedMetadata<T>(
  key: string,
  target: object,
  propertyKey?: string,
): T | undefined {
  return metadata(key, target, propertyKey) as T | undefined;
}

describe('module controller metadata', () => {
  it('only registers classes decorated with @Controller()', () => {
    const invalidControllers = modules.flatMap((moduleClass) => {
      const moduleControllers =
        typedMetadata<Type<unknown>[]>(
          MODULE_METADATA.CONTROLLERS,
          moduleClass,
        ) ?? [];

      return moduleControllers
        .filter(
          (controller) => metadata(PATH_METADATA, controller) === undefined,
        )
        .map(
          (controller) =>
            `${moduleClass.name}.${controller.name ?? 'AnonymousController'}`,
        );
    });

    expect(invalidControllers).toEqual([]);
  });

  it('documents every route with a wrapped success response', () => {
    const missingResponses = controllers.flatMap((controller) =>
      routeMethods(controller)
        .filter(({ handler }) => {
          const responses = typedMetadata<
            Record<string, SwaggerResponseMetadata>
          >(SWAGGER_RESPONSE_METADATA, handler);
          return !Object.keys(responses ?? {}).some((status) => {
            const statusCode = Number(status);
            return statusCode >= 200 && statusCode < 300;
          });
        })
        .map(({ propertyName }) => `${controller.name}.${propertyName}`),
    );

    expect(missingResponses).toEqual([]);
  });

  it('documents every request body DTO with Swagger examples', () => {
    const missingExamples = controllers.flatMap((controller) =>
      routeMethods(controller).flatMap(({ propertyName }) => {
        const routeArgs = typedMetadata<Record<string, RouteArgMetadata>>(
          ROUTE_ARGS_METADATA,
          controller,
          propertyName,
        );
        const bodyIndexes = Object.entries(routeArgs ?? {})
          .filter(([key]) => key.startsWith(`${RouteParamtypes.BODY}:`))
          .map(([, metadata]) => metadata.index);
        const paramTypes = typedMetadata<Type<unknown>[]>(
          PARAMTYPES_METADATA,
          prototypeOf(controller),
          propertyName,
        );

        return bodyIndexes.flatMap((index) => {
          const bodyType = paramTypes?.[index];
          if (!bodyType) {
            return [`${controller.name}.${propertyName} body`];
          }
          const propertyKeys = typedMetadata<string[]>(
            SWAGGER_MODEL_PROPERTIES_ARRAY_METADATA,
            prototypeOf(bodyType),
          );

          if (!propertyKeys?.length) {
            return [`${controller.name}.${propertyName} body`];
          }

          return propertyKeys
            .map((key) => key.replace(/^:/, ''))
            .filter((key) => {
              const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
                SWAGGER_MODEL_PROPERTIES_METADATA,
                prototypeOf(bodyType),
                key,
              );
              return (
                !propertyMetadata ||
                (propertyMetadata.example === undefined &&
                  propertyMetadata.default === undefined &&
                  propertyMetadata.enum === undefined)
              );
            })
            .map((key) => `${bodyType.name}.${key}`);
        });
      }),
    );

    expect(missingExamples).toEqual([]);
  });

  it('documents expense create primitive fields with concrete Swagger types for generated clients', () => {
    const expectedTypes = new Map<string, unknown>([
      ['description', String],
      ['vendor', String],
      ['itemValue', Number],
      ['price', Number],
      ['quantity', Number],
      ['departmentId', String],
    ]);

    const incorrectlyTypedFields = [...expectedTypes].filter(
      ([field, type]) => {
        const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
          SWAGGER_MODEL_PROPERTIES_METADATA,
          prototypeOf(CreateExpenseDto),
          field,
        );

        return propertyMetadata?.type !== type;
      },
    );

    expect(incorrectlyTypedFields).toEqual([]);
  });

  it('documents leave create primitive fields with concrete Swagger types for generated clients', () => {
    const expectedTypes = new Map<string, unknown>([
      ['reason', String],
      ['employeeGrade', String],
      ['departmentId', String],
    ]);

    const incorrectlyTypedFields = [...expectedTypes].filter(
      ([field, type]) => {
        const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
          SWAGGER_MODEL_PROPERTIES_METADATA,
          prototypeOf(CreateLeaveDto),
          field,
        );

        return propertyMetadata?.type !== type;
      },
    );

    expect(incorrectlyTypedFields).toEqual([]);
  });

  it('documents workflow request primitive fields with concrete Swagger types for generated clients', () => {
    const expectedTypes = new Map<Type<unknown>, Map<string, unknown>>([
      [
        TriggerWorkflowDto,
        new Map<string, unknown>([['departmentId', String]]),
      ],
      [
        CreateWorkflowTemplateDto,
        new Map<string, unknown>([
          ['description', String],
          ['effectiveFrom', String],
          ['effectiveTo', String],
          ['createdById', String],
        ]),
      ],
      [
        CreateWorkflowStepConfigDto,
        new Map<string, unknown>([
          ['assigneeRoleSlug', String],
          ['assigneeUserId', String],
          ['assigneeFieldPath', String],
          ['slaHours', Number],
          ['escalationAssigneeRoleSlug', String],
          ['escalationAssigneeUserId', String],
        ]),
      ],
    ]);

    const incorrectlyTypedFields = [...expectedTypes].flatMap(([dto, fields]) =>
      [...fields]
        .filter(([field, type]) => {
          const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
            SWAGGER_MODEL_PROPERTIES_METADATA,
            prototypeOf(dto),
            field,
          );

          return propertyMetadata?.type !== type;
        })
        .map(([field]) => `${dto.name}.${field}`),
    );

    expect(incorrectlyTypedFields).toEqual([]);
  });

  it('documents workflow response primitive fields with concrete Swagger types for generated clients', () => {
    const expectedTypes = new Map<Type<unknown>, Map<string, unknown>>([
      [
        WorkflowActionResponseDto,
        new Map<string, unknown>([
          ['workflowStepId', String],
          ['actorUserId', String],
          ['comment', String],
          ['reason', String],
        ]),
      ],
      [
        WorkflowStepResponseDto,
        new Map<string, unknown>([
          ['assignedUserId', String],
          ['assignedRoleSlug', String],
          ['activatedAt', String],
          ['actedAt', String],
          ['actionByUserId', String],
          ['comment', String],
          ['rejectionReason', String],
        ]),
      ],
      [
        WorkflowInstanceResponseDto,
        new Map<string, unknown>([
          ['departmentId', String],
          ['startedAt', String],
          ['completedAt', String],
          ['rejectedAt', String],
        ]),
      ],
      [
        WorkflowApprovalStepConfigResponseDto,
        new Map<string, unknown>([
          ['assigneeRoleSlug', String],
          ['assigneeUserId', String],
          ['assigneeFieldPath', String],
          ['slaHours', Number],
          ['escalationAssigneeRoleSlug', String],
          ['escalationAssigneeUserId', String],
        ]),
      ],
      [
        WorkflowTemplateResponseDto,
        new Map<string, unknown>([
          ['description', String],
          ['effectiveFrom', String],
          ['effectiveTo', String],
          ['createdById', String],
        ]),
      ],
    ]);

    const incorrectlyTypedFields = [...expectedTypes].flatMap(([dto, fields]) =>
      [...fields]
        .filter(([field, type]) => {
          const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
            SWAGGER_MODEL_PROPERTIES_METADATA,
            prototypeOf(dto),
            field,
          );

          return propertyMetadata?.type !== type;
        })
        .map(([field]) => `${dto.name}.${field}`),
    );

    expect(incorrectlyTypedFields).toEqual([]);
  });

  it('documents shared response primitive fields with concrete Swagger types for generated clients', () => {
    const expectedTypes = new Map<Type<unknown>, Map<string, unknown>>([
      [
        AuditLogResponseDto,
        new Map<string, unknown>([
          ['actorUserId', String],
          ['workflowInstanceId', String],
          ['workflowStepId', String],
          ['oldStatus', String],
          ['newStatus', String],
          ['comment', String],
          ['reason', String],
        ]),
      ],
      [
        ExpenseResponseDto,
        new Map<string, unknown>([
          ['departmentId', String],
          ['description', String],
          ['vendor', String],
          ['itemValue', String],
          ['price', String],
          ['quantity', String],
          ['workflowInstanceId', String],
          ['rejectionReason', String],
          ['submittedAt', String],
          ['approvedAt', String],
          ['rejectedAt', String],
          ['paidAt', String],
        ]),
      ],
      [
        PaymentRequestResponseDto,
        new Map<string, unknown>([
          ['paymentReference', String],
          ['paidById', String],
          ['paidAt', String],
        ]),
      ],
      [
        UserResponseDto,
        new Map<string, unknown>([
          ['employeeCode', String],
          ['employeeGrade', String],
          ['designation', String],
          ['departmentId', String],
          ['managerId', String],
          ['lastLoginAt', String],
        ]),
      ],
    ]);

    const incorrectlyTypedFields = [...expectedTypes].flatMap(([dto, fields]) =>
      [...fields]
        .filter(([field, type]) => {
          const propertyMetadata = typedMetadata<SwaggerPropertyMetadata>(
            SWAGGER_MODEL_PROPERTIES_METADATA,
            prototypeOf(dto),
            field,
          );

          return propertyMetadata?.type !== type;
        })
        .map(([field]) => `${dto.name}.${field}`),
    );

    expect(incorrectlyTypedFields).toEqual([]);
  });
});
