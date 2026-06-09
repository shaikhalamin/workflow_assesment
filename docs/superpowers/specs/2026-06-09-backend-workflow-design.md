# Backend Workflow Assessment Design

Date: 2026-06-09

## Context

The existing project is a NestJS backend with TypeORM, PostgreSQL configuration, Swagger setup, response envelopes, validation pipes, pagination helpers, cookie parsing, and development `synchronize` enabled. The PRD describes a configurable ERP workflow builder and runtime where business modules trigger workflow events, the runtime evaluates configured conditions and approval rules, creates dynamic approval steps, tracks actions, and executes final outcomes.

This design finalizes the backend scope for the assessment. It intentionally uses in-process service calls for workflow triggering, TypeORM entities with development synchronization, and seeded data so the demo flow works immediately after startup.

## Decisions

- Implement real authentication instead of the PRD's mock role switcher.
- Use cookie-based Passport JWT auth with access and refresh tokens.
- Store refresh tokens in a `refresh_token_sessions` table.
- Store only hashed refresh tokens.
- Rotate refresh tokens on every refresh.
- Revoke a user's previous refresh sessions on new login, leaving one active refresh session per user.
- Use normalized RBAC tables: `roles`, `permissions`, `role_permissions`, and `user_roles`.
- Use human-readable role display names with stable machine-readable role slugs.
- Use machine-readable permission slugs.
- Do not create a separate `employees` table for this assessment. Store login identity and employee profile basics on `users`.
- Seed users, departments, roles, permissions, role assignments, event schemas, workflow templates, rules, steps, and sample business records automatically on development startup when records are missing.
- Use the shared condition format for trigger conditions and approval rules:

```json
{
  "mode": "all",
  "conditions": [
    { "field": "amount", "operator": "gte", "value": 5000 },
    { "field": "amount", "operator": "lt", "value": 10000 }
  ]
}
```

- Support `mode: "all"` for AND matching and `mode: "any"` for OR matching.
- Save selected frontend approvers as exact `USER` assignees where the UI chooses a specific user from a role-filtered lookup.
- Still support `ROLE`, `REQUESTER_MANAGER`, `DEPARTMENT_HEAD`, and `CUSTOM_FIELD_USER` assignee types because the PRD requires them.
- For `USER` steps, only the exact assigned user can act.
- For `ROLE` steps, any active user with that role can act.
- Use permission-aware request listings: employees see own data, managers see department data, HR sees leave data, accounts and finance see expense/payment data, and admins see all.

## Architecture

The backend will be organized under `src/modules`:

```txt
auth/
users/
departments/
rbac/
seed/
workflow-builder/
workflow-runtime/
expenses/
leaves/
payments/
audit-logs/
notifications/
dashboard/
```

`AppModule` imports these modules. `SeedModule` runs only in development and creates missing baseline data after TypeORM initializes.

The runtime path is:

```txt
Expense or Leave submit
  -> source request saved as UNDER_REVIEW
  -> WorkflowRuntimeService.trigger()
  -> published workflow template lookup
  -> trigger condition evaluation
  -> approval rule evaluation
  -> assignee resolution
  -> workflow instance and steps created
  -> first step activated
  -> audit log written
```

Approval path:

```txt
Approver action
  -> auth and assignment validation
  -> active step approved or rejected
  -> action record written
  -> audit log written
  -> next step activated, or workflow finalized
  -> approved or rejected outcome executed
```

## Auth and RBAC

Entities:

- `User`
- `Department`
- `Role`
- `Permission`
- `RolePermission`
- `UserRole`
- `RefreshTokenSession`

`User` owns both authentication fields and employee profile basics required by workflow rules and assignee resolution: name, email, password hash, employee code, employee grade, designation, active status, department, and manager. A separate employee table is intentionally skipped to keep the assessment focused on workflow behavior.

Auth APIs:

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Implementation details:

- Passwords are hashed with `bcryptjs`.
- Login validates email and password.
- Login revokes existing active refresh sessions for the user.
- Login issues `access_token` and `refresh_token` cookies.
- Refresh validates the refresh JWT, checks the hashed token against the active `refresh_token_sessions` row, revokes the old session, creates a new one, and resets cookies.
- Logout revokes the current refresh session and clears cookies.
- Access JWT contains user id, email, roles, and permissions.
- Guards include JWT auth, role checks, and permission checks.
- Decorators include `@CurrentUser()`, `@Roles()`, and `@Permissions()`.

Seeded users use the development password `Password123!`.

## Workflow Builder

Entities:

- `WorkflowTemplate`
- `WorkflowEventSchema`
- `WorkflowTriggerCondition`
- `WorkflowApprovalRule`
- `WorkflowApprovalStepConfig`
- `WorkflowOutcomeConfig`

Supported APIs:

```txt
GET    /workflow-templates
POST   /workflow-templates
GET    /workflow-templates/:id
PATCH  /workflow-templates/:id
POST   /workflow-templates/:id/publish
POST   /workflow-templates/:id/deactivate
POST   /workflow-templates/:id/duplicate

GET    /workflow-event-schemas
POST   /workflow-event-schemas
GET    /workflow-event-schemas/:id
PATCH  /workflow-event-schemas/:id
POST   /workflow-event-schemas/:id/deactivate

POST   /workflow-templates/:id/rules
PATCH  /workflow-rules/:id
DELETE /workflow-rules/:id

POST   /workflow-rules/:id/steps
PATCH  /workflow-step-configs/:id
DELETE /workflow-step-configs/:id

GET    /users?roleSlug=finance-admin&limit=5
```

The builder supports both:

- A full wizard payload that creates or updates template, trigger condition, approval rules, steps, and outcomes together.
- Granular rule and step endpoints for frontend editing flows.
- Admin-managed event schema endpoints so admins can add or adjust field schemas for supported modules and future modules such as Attendance, Purchase, Payroll, Procurement, and Invoice.

Validation:

- Workflow name, module, event, entity type, status, and priority are required.
- Event schema module name, event name, entity type, and field schema are required.
- Event schema field keys must be unique inside a schema.
- Event schema field operators must be valid for the declared field type.
- Event schema deactivate is soft-state only through `isActive = false`, not physical deletion, so existing workflow templates keep their validation history.
- Published workflows require at least one active approval rule.
- Each non-fallback rule requires a condition.
- Only one fallback rule is allowed per template.
- Rule priorities are unique per template.
- Each rule must have at least one step before publish.
- Step order is unique per rule.
- `ROLE` steps require a role.
- `USER` steps require a user.
- `CUSTOM_FIELD_USER` steps require a field path.
- Condition field names and operators are validated against the selected event schema.

## Workflow Runtime

Entities:

- `WorkflowInstance`
- `WorkflowStep`
- `WorkflowAction`

Services:

- `WorkflowRuntimeService`
- `RuleEngineService`
- `AssigneeResolverService`
- `OutcomeHandlerService`

Runtime APIs:

```txt
POST /workflow-runtime/trigger
GET  /workflow-instances
GET  /workflow-instances/:id
GET  /workflow-tasks/my-pending
POST /workflow-steps/:id/approve
POST /workflow-steps/:id/reject
POST /workflow-steps/:id/comment
```

The rule engine supports:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `in`
- `not_in`
- `contains`
- `is_empty`
- `is_not_empty`

Nested field paths such as `customFields.budgetOwnerId` are supported.

Runtime validation:

- Trigger requests require module name, event name, entity type, entity id, requester id, and metadata.
- A published workflow must exist for the submitted module and event.
- If trigger conditions do not match, runtime returns a skipped result.
- If no approval rule matches, the fallback rule is used when present.
- If no rule or fallback applies, trigger fails with a validation error.
- Approve and reject actions can only be performed against active steps.
- `USER` steps require the actor to match `assignedUserId`.
- `ROLE` steps require the actor to have `assignedRole`.
- Rejection requires a reason.
- Final approval executes approved outcomes.
- Rejection skips remaining waiting steps and executes rejected outcomes.

## Business Modules

Expense APIs:

```txt
POST   /expenses
GET    /expenses
GET    /expenses/:id
PATCH  /expenses/:id
POST   /expenses/:id/submit
POST   /expenses/:id/resubmit
```

Leave APIs:

```txt
POST   /leaves
GET    /leaves
GET    /leaves/:id
PATCH  /leaves/:id
POST   /leaves/:id/submit
POST   /leaves/:id/resubmit
```

Payment APIs:

```txt
GET  /payment-requests
GET  /payment-requests/:id
POST /payment-requests/:id/mark-paid
```

Expense approval outcomes:

- Set expense to `PAYMENT_PENDING`.
- Create a payment request.
- Create audit and notification records.

Expense payment outcome:

- Mark payment request as `PAID`.
- Mark linked expense as `PAID`.

Leave approval outcomes:

- Set leave request to `APPROVED`.
- Store approved leave period metadata on the leave request so the frontend can render an approved leave calendar entry without a separate calendar module.
- Create audit and notification records.

Rejected outcomes:

- Mark the source request `REJECTED`.
- Store rejection reason through workflow action/audit records.
- Allow resubmission when the workflow template permits it.

## Dashboard and Audit

Audit entity:

- `AuditLog`

Notification entity:

- `Notification`

Dashboard APIs:

```txt
GET /dashboard/admin
GET /dashboard/employee
GET /dashboard/approver
GET /dashboard/accounts
GET /dashboard/hr
```

Dashboards return aggregate counts and concise lists for the PRD views:

- Admin: workflow counts, recent workflow changes, failed triggers.
- Employee: own expense and leave status summary.
- Approver: pending tasks, acted tasks, overdue tasks, average approval time.
- Accounts: accounts review tasks, pending payments, paid amount this month.
- HR: leave tasks and leave approval/rejection counts.

Audit APIs will expose workflow and source-entity audit trails with permission-aware filtering.

## Seed Data

Development seeding creates missing records for:

- Departments: Sales, Accounts, Finance, HR, Payroll.
- Roles with display names and slugs: Employee `employee`, Department Reviewer `department-reviewer`, Manager `manager`, Accounts Officer `accounts-officer`, Finance Admin `finance-admin`, HR Officer `hr-officer`, HR Manager `hr-manager`, CFO `cfo`, Payroll Officer `payroll-officer`, Admin `admin`.
- Permissions covering auth profile, users lookup, workflow builder, runtime tasks, expenses, leaves, payments, dashboards, and audit trail.
- Users from the PRD plus an Admin user.
- Published Expense Approval Workflow.
- Published Leave Approval Workflow.
- Draft Attendance Adjustment Workflow.
- Event schemas for Expense, Leave, and Attendance.
- Sample expense requests, leave requests, workflow instances where useful for dashboards, payment requests, audit logs, and notifications.

The seeder is idempotent: it checks for existing records before creating baseline data.

## Phases

### Phase 1: Auth, Users, RBAC, Seeding

Deliver real authentication, user/departments, normalized RBAC, guards/decorators, refresh token sessions, development seeding, and Swagger docs for auth and user lookup.

This phase is complete when a developer can start the app in development, log in as a seeded user, refresh/logout with cookies, call protected APIs, and receive role/permission enforcement.

### Phase 2: Workflow Builder

Deliver workflow builder entities, DTOs, validation, full wizard save/update, granular rule/step APIs, event schema APIs, publish/deactivate/duplicate, seeded Expense/Leave/Attendance workflow definitions, and Swagger docs.

This phase is complete when an admin can create or edit a workflow configuration from frontend-friendly APIs and publish a valid workflow.

### Phase 3: Workflow Runtime

Deliver workflow trigger, rule evaluation, dynamic step creation, assignee resolution, task listing, approve/reject/comment, workflow actions, audit logging, status transitions, and outcome handler hooks.

This phase is complete when a submitted expense or leave request creates the correct dynamic workflow steps and approval/rejection moves the instance through the expected statuses.

### Phase 4: Business Modules, Dashboard, Audit

Deliver expense, leave, payment, dashboard, audit, and notification summary APIs with permission-aware access. Connect approved expense outcomes to payment requests and leave outcomes to final leave status.

This phase is complete when the PRD demo script can run through expense approval, payment completion, leave approval, dashboard views, and audit trail inspection.

## Follow-Up Scope

After the current backend and frontend specs are successfully implemented, the system can be extended with a Billing and Invoice workflow without changing the workflow engine. The follow-up scope is:

```txt
Sales submits a billing request
  -> billing.submitted triggers a configured workflow
  -> Accounts reviews the workflow task
  -> approved outcome creates an invoice
  -> invoice becomes visible in role-based dashboards
```

This requires adding Billing and Invoice business modules, event schemas, source entities, invoice entities, APIs, dashboard summaries, and an approved outcome action. It is intentionally scoped after the first successful implementation of the current assessment specs across both backend and frontend.

## Testing and Verification

Each phase will include focused tests scaled to the risk:

- Auth service and guard tests for login, refresh rotation, revoked token rejection, and permission checks.
- Rule engine tests for condition operators and nested field paths.
- Workflow runtime tests for trigger, rule match, step activation, approval, rejection, and final outcomes.
- Business module tests for submit/resubmit, payment creation, payment paid, and permission-aware listing.

Verification commands:

```bash
pnpm test
pnpm build
```

Where useful, e2e tests will cover the seeded demo flow through HTTP APIs.
