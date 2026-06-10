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
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensesController } from './expenses/expenses.controller';
import { CreateExpenseDto } from './expenses/dto/create-expense.dto';
import { LeavesModule } from './leaves/leaves.module';
import { LeavesController } from './leaves/leaves.controller';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsController } from './payments/payments.controller';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { WorkflowBuilderModule } from './workflow-builder/workflow-builder.module';
import { WorkflowEventSchemaController } from './workflow-builder/workflow-event-schema.controller';
import { WorkflowRuleController } from './workflow-builder/workflow-rule.controller';
import { WorkflowStepConfigController } from './workflow-builder/workflow-step-config.controller';
import { WorkflowTemplateController } from './workflow-builder/workflow-template.controller';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';
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
});
