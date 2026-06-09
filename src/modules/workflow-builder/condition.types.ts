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
