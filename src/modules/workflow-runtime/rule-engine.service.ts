import { Injectable } from '@nestjs/common';
import type {
  ConditionClause,
  ConditionGroup,
} from '../workflow-builder/condition.types';

@Injectable()
export class RuleEngineService {
  matches(
    data: Record<string, unknown>,
    conditionGroup?: ConditionGroup | null,
  ): boolean {
    if (!conditionGroup?.conditions?.length) return true;
    const checks = conditionGroup.conditions.map((condition) =>
      this.matchesClause(data, condition),
    );
    return conditionGroup.mode === 'any'
      ? checks.some(Boolean)
      : checks.every(Boolean);
  }

  getValue(data: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, segment) => {
      if (
        current !== null &&
        typeof current === 'object' &&
        segment in current
      ) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, data);
  }

  private matchesClause(
    data: Record<string, unknown>,
    condition: ConditionClause,
  ): boolean {
    const actual = this.getValue(data, condition.field);
    const expected = condition.value;

    switch (condition.operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return this.compareNumbers(actual, expected, (a, b) => a > b);
      case 'gte':
        return this.compareNumbers(actual, expected, (a, b) => a >= b);
      case 'lt':
        return this.compareNumbers(actual, expected, (a, b) => a < b);
      case 'lte':
        return this.compareNumbers(actual, expected, (a, b) => a <= b);
      case 'between':
        if (!Array.isArray(expected) || expected.length !== 2) return false;
        return (
          this.compareNumbers(actual, expected[0], (a, b) => a >= b) &&
          this.compareNumbers(actual, expected[1], (a, b) => a <= b)
        );
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'contains':
        return this.toComparableText(actual).includes(
          this.toComparableText(expected),
        );
      case 'is_empty':
        return actual === undefined || actual === null || actual === '';
      case 'is_not_empty':
        return actual !== undefined && actual !== null && actual !== '';
      default:
        return false;
    }
  }

  private compareNumbers(
    actual: unknown,
    expected: unknown,
    compare: (actualNumber: number, expectedNumber: number) => boolean,
  ): boolean {
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
      return false;
    }
    return compare(actualNumber, expectedNumber);
  }

  private toComparableText(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }
    const json = JSON.stringify(value);
    return json ?? '';
  }
}
