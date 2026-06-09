export enum WorkflowTemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
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

export enum ConditionFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SELECT = 'select',
  USER = 'user',
}

export enum ConditionModeEnum {
  ALL = 'all',
  ANY = 'any',
}

export enum ConditionOperatorEnum {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}
