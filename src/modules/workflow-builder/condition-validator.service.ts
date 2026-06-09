import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ConditionGroup,
  ConditionOperator,
  WorkflowEventFieldSchema,
} from './condition.types';

const validOperators = new Set<ConditionOperator>([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'not_in',
  'contains',
  'is_empty',
  'is_not_empty',
]);

@Injectable()
export class ConditionValidatorService {
  validateEventSchema(schema: WorkflowEventFieldSchema): void {
    if (!schema || !Array.isArray(schema.fields)) {
      throw new BadRequestException('Field schema must contain fields');
    }

    const keys = new Set<string>();
    for (const field of schema.fields) {
      if (!field.key || keys.has(field.key)) {
        throw new BadRequestException('Field schema keys must be unique');
      }
      keys.add(field.key);

      if (!Array.isArray(field.operators)) {
        throw new BadRequestException('Field operators must be an array');
      }
      for (const operator of field.operators) {
        if (!validOperators.has(operator)) {
          throw new BadRequestException(`Unsupported operator: ${operator}`);
        }
      }
    }
  }

  validateCondition(
    schema: WorkflowEventFieldSchema,
    condition: ConditionGroup | null | undefined,
    required = true,
  ): void {
    this.validateEventSchema(schema);

    if (!condition) {
      if (required) throw new BadRequestException('Condition is required');
      return;
    }
    if (condition.mode !== 'all' && condition.mode !== 'any') {
      throw new BadRequestException('Condition mode must be all or any');
    }
    if (!Array.isArray(condition.conditions) || !condition.conditions.length) {
      throw new BadRequestException('Condition clauses are required');
    }

    const fieldsByKey = new Map(schema.fields.map((field) => [field.key, field]));
    for (const clause of condition.conditions) {
      const field = fieldsByKey.get(clause.field);
      if (!field) {
        throw new BadRequestException(`Unknown condition field: ${clause.field}`);
      }
      if (!field.operators.includes(clause.operator)) {
        throw new BadRequestException(
          `Operator ${clause.operator} is not allowed for ${clause.field}`,
        );
      }
      if (clause.operator === 'between') {
        if (!Array.isArray(clause.value) || clause.value.length !== 2) {
          throw new BadRequestException('Between requires two values');
        }
      }
      if (
        (clause.operator === 'in' || clause.operator === 'not_in') &&
        !Array.isArray(clause.value)
      ) {
        throw new BadRequestException(`${clause.operator} requires an array`);
      }
    }
  }
}
