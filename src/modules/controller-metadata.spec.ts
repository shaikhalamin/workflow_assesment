import { Type } from '@nestjs/common';
import {
  METHOD_METADATA,
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLogsController } from './audit-logs/audit-logs.controller';
import { AuditLogsService } from './audit-logs/audit-logs.service';
import { AuditLogResponseDto } from './audit-logs/dto/audit-log-response.dto';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensesController } from './expenses/expenses.controller';
import { CreateExpenseDto } from './expenses/dto/create-expense.dto';
import { ExpenseResponseDto } from './expenses/dto/expense-response.dto';
import { ExpensesService } from './expenses/expenses.service';
import { LeavesModule } from './leaves/leaves.module';
import { LeavesController } from './leaves/leaves.controller';
import { CreateLeaveDto } from './leaves/dto/create-leave.dto';
import { LeavesService } from './leaves/leaves.service';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsController } from './payments/payments.controller';
import { PaymentRequestResponseDto } from './payments/dto/payment-request-response.dto';
import { PaymentsService } from './payments/payments.service';
import {
  RbacPermissionResponseDto,
  RbacRoleResponseDto,
  UpdateRolePermissionsDto,
} from './rbac/dto/rbac-management.dto';
import { RbacController } from './rbac/rbac.controller';
import { RbacModule } from './rbac/rbac.module';
import { RbacService } from './rbac/rbac.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UserResponseDto } from './users/dto/user-response.dto';
import { UsersService } from './users/users.service';
import { WorkflowBuilderModule } from './workflow-builder/workflow-builder.module';
import { CreateWorkflowStepConfigDto } from './workflow-builder/dto/create-workflow-step-config.dto';
import { CreateWorkflowTemplateDto } from './workflow-builder/dto/create-workflow-template.dto';
import {
  WorkflowApprovalStepConfigResponseDto,
  WorkflowTemplateResponseDto,
} from './workflow-builder/dto/workflow-builder-response.dto';
import { WorkflowEventSchemaController } from './workflow-builder/workflow-event-schema.controller';
import { WorkflowEventSchemaService } from './workflow-builder/workflow-event-schema.service';
import { WorkflowRuleController } from './workflow-builder/workflow-rule.controller';
import { WorkflowRuleService } from './workflow-builder/workflow-rule.service';
import { WorkflowStepConfigController } from './workflow-builder/workflow-step-config.controller';
import { WorkflowTemplateController } from './workflow-builder/workflow-template.controller';
import { WorkflowTemplateService } from './workflow-builder/workflow-template.service';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';
import { TriggerWorkflowDto } from './workflow-runtime/dto/trigger-workflow.dto';
import {
  WorkflowActionResponseDto,
  WorkflowInstanceResponseDto,
  WorkflowStepResponseDto,
} from './workflow-runtime/dto/workflow-runtime-response.dto';
import { WorkflowRuntimeController } from './workflow-runtime/workflow-runtime.controller';
import { WorkflowRuntimeService } from './workflow-runtime/workflow-runtime.service';
import { ENVELOPE_EXTRA_MODELS } from '../common/http/swagger';

type ControllerMethod = (...args: unknown[]) => unknown;

const SWAGGER_RESPONSE_METADATA = 'swagger/apiResponse';
const SWAGGER_MODEL_PROPERTIES_METADATA = 'swagger/apiModelProperties';
const SWAGGER_MODEL_PROPERTIES_ARRAY_METADATA =
  'swagger/apiModelPropertiesArray';

interface RouteArgMetadata {
  data?: unknown;
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

interface SwaggerReference {
  $ref: string;
}

interface SwaggerSchema {
  $ref?: string;
  allOf?: unknown[];
}

interface SwaggerMediaType {
  schema?: SwaggerSchema;
}

interface SwaggerRequestBody {
  content: Record<string, SwaggerMediaType>;
}

interface SwaggerResponse {
  content?: Record<string, SwaggerMediaType>;
}

interface SwaggerOperation {
  requestBody?: SwaggerReference | SwaggerRequestBody;
  responses: Record<string, SwaggerReference | SwaggerResponse>;
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type SwaggerPathItem = Partial<Record<HttpMethod, SwaggerOperation>>;

interface SwaggerDocument {
  paths: Record<string, SwaggerPathItem>;
}

const modules = [
  AuditLogsModule,
  AuthModule,
  DashboardModule,
  ExpensesModule,
  LeavesModule,
  NotificationsModule,
  PaymentsModule,
  RbacModule,
  UsersModule,
  WorkflowBuilderModule,
  WorkflowRuntimeModule,
];

const controllers: Type<unknown>[] = [
  AppController,
  AuditLogsController,
  AuthController,
  DashboardController,
  ExpensesController,
  LeavesController,
  NotificationsController,
  PaymentsController,
  RbacController,
  UsersController,
  WorkflowEventSchemaController,
  WorkflowRuleController,
  WorkflowStepConfigController,
  WorkflowTemplateController,
  WorkflowRuntimeController,
];

const controllerServices: Type<unknown>[] = [
  AppService,
  AuditLogsService,
  AuthService,
  DashboardService,
  ExpensesService,
  LeavesService,
  NotificationsService,
  PaymentsService,
  RbacService,
  UsersService,
  WorkflowEventSchemaService,
  WorkflowRuleService,
  WorkflowTemplateService,
  WorkflowRuntimeService,
];

const httpMethods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

interface DocumentedOperation {
  method: string;
  operation: SwaggerOperation;
  path: string;
}

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

function documentedOperations(
  paths: Record<string, SwaggerPathItem>,
): DocumentedOperation[] {
  return Object.entries(paths).flatMap(([path, pathItem]) =>
    httpMethods.flatMap((method) => {
      const operation = pathItem[method];
      return operation ? [{ method, operation, path }] : [];
    }),
  );
}

function isReferenceObject(
  value: SwaggerReference | SwaggerRequestBody | SwaggerResponse,
): value is SwaggerReference {
  return '$ref' in value;
}

function jsonSchemaFromRequestBody(
  requestBody: SwaggerOperation['requestBody'],
): SwaggerSchema | undefined {
  if (!requestBody || isReferenceObject(requestBody)) return undefined;
  return requestBody.content['application/json']?.schema;
}

function jsonSchemaFromResponse(
  response: SwaggerReference | SwaggerResponse,
): SwaggerSchema | undefined {
  if (isReferenceObject(response)) return undefined;
  return response.content?.['application/json']?.schema;
}

async function createSwaggerDocument() {
  const moduleRef = await Test.createTestingModule({
    controllers,
    providers: controllerServices.map((service) => ({
      provide: service,
      useValue: {},
    })),
  }).compile();
  const app = moduleRef.createNestApplication();
  const config = new DocumentBuilder()
    .setTitle('Workflow API')
    .setDescription('Workflow API endpoints')
    .setVersion('0.1.0')
    .addCookieAuth(
      'access_token',
      { type: 'apiKey', in: 'cookie', name: 'access_token' },
      'access_token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [...ENVELOPE_EXTRA_MODELS],
  }) as SwaggerDocument;

  await app.close();
  return document;
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

  it('documents every route with wrapped error responses', () => {
    const missingResponses = controllers.flatMap((controller) =>
      routeMethods(controller)
        .filter(({ handler }) => {
          const responses = typedMetadata<
            Record<string, SwaggerResponseMetadata>
          >(SWAGGER_RESPONSE_METADATA, handler);
          return !Object.keys(responses ?? {}).some((status) => {
            const statusCode = Number(status);
            return statusCode >= 400;
          });
        })
        .map(({ propertyName }) => `${controller.name}.${propertyName}`),
    );

    expect(missingResponses).toEqual([]);
  });

  it('uses DTO-backed path parameter objects', () => {
    const primitiveParams = controllers.flatMap((controller) =>
      routeMethods(controller).flatMap(({ propertyName }) => {
        const routeArgs = typedMetadata<Record<string, RouteArgMetadata>>(
          ROUTE_ARGS_METADATA,
          controller,
          propertyName,
        );

        return Object.entries(routeArgs ?? {})
          .filter(
            ([key, routeArg]) =>
              key.startsWith(`${RouteParamtypes.PARAM}:`) &&
              routeArg.data !== undefined,
          )
          .map(() => `${controller.name}.${propertyName}`);
      }),
    );

    expect(primitiveParams).toEqual([]);
  });

  it('generates Swagger JSON with envelope responses and DTO request bodies', async () => {
    const document = await createSwaggerDocument();
    const operations = documentedOperations(document.paths);

    const missingResponseShapes = operations.flatMap(
      ({ method, operation, path }) =>
        Object.entries(operation.responses)
          .filter(([status]) => {
            const statusCode = Number(status);
            return (statusCode >= 200 && statusCode < 300) || statusCode >= 400;
          })
          .filter(([, response]) => {
            const schema = jsonSchemaFromResponse(response);
            return !schema || schema.$ref !== undefined || !schema.allOf;
          })
          .map(([status]) => `${method.toUpperCase()} ${path} ${status}`),
    );

    const primitiveRequestBodies = operations
      .filter(({ operation }) => {
        const schema = jsonSchemaFromRequestBody(operation.requestBody);
        return schema && schema.$ref === undefined && !schema.allOf;
      })
      .map(({ method, path }) => `${method.toUpperCase()} ${path}`);

    expect(missingResponseShapes).toEqual([]);
    expect(primitiveRequestBodies).toEqual([]);
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
      [
        UpdateRolePermissionsDto,
        new Map<string, unknown>([['permissionSlugs', String]]),
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
        RbacPermissionResponseDto,
        new Map<string, unknown>([
          ['description', String],
          ['createdAt', String],
          ['updatedAt', String],
        ]),
      ],
      [
        RbacRoleResponseDto,
        new Map<string, unknown>([
          ['description', String],
          ['permissionSlugs', String],
          ['createdAt', String],
          ['updatedAt', String],
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
