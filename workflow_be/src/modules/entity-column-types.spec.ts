import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import './audit-logs/entities/audit-log.entity';
import './auth/entities/refresh-token-session.entity';
import './billing/entities/billing-request.entity';
import './departments/entities/department.entity';
import './expenses/entities/expense.entity';
import './invoices/entities/invoice.entity';
import './leaves/entities/leave-request.entity';
import './notifications/entities/notification.entity';
import './payments/entities/payment-request.entity';
import './rbac/entities/permission.entity';
import './rbac/entities/role-permission.entity';
import './rbac/entities/role.entity';
import './rbac/entities/user-role.entity';
import './users/entities/user.entity';
import './workflow-builder/entities/workflow-approval-rule.entity';
import './workflow-builder/entities/workflow-approval-step-config.entity';
import './workflow-builder/entities/workflow-event-schema.entity';
import './workflow-builder/entities/workflow-outcome-config.entity';
import './workflow-builder/entities/workflow-template.entity';
import './workflow-builder/entities/workflow-trigger-condition.entity';
import './workflow-runtime/entities/workflow-action.entity';
import './workflow-runtime/entities/workflow-instance.entity';
import './workflow-runtime/entities/workflow-step.entity';

function designType(target: object, propertyName: string): unknown {
  const reflectedType: unknown = Reflect.getMetadata(
    'design:type',
    target,
    propertyName,
  );
  return reflectedType;
}

describe('entity column types', () => {
  it('does not rely on reflected Object column types', () => {
    const unsupportedColumns = getMetadataArgsStorage()
      .columns.map((column) => {
        const reflectedType =
          typeof column.target === 'function'
            ? designType(column.target.prototype as object, column.propertyName)
            : undefined;

        return {
          entity:
            typeof column.target === 'function'
              ? column.target.name
              : String(column.target),
          propertyName: column.propertyName,
          reflectedType,
          explicitType: column.options.type,
        };
      })
      .filter(
        (column) =>
          column.explicitType === undefined && column.reflectedType === Object,
      )
      .map((column) => `${column.entity}.${column.propertyName}`);

    expect(unsupportedColumns).toEqual([]);
  });
});
