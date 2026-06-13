# Backend Billing and Invoice Workflow Design

Date: 2026-06-10

## Context

This is the next backend phase after `2026-06-09-backend-workflow-design.md` and the implementation plan in `2026-06-09-backend-workflow-assessment.md`.

The assessment backend already defines authentication, RBAC, workflow builder, workflow runtime, expense, leave, payment, dashboard, audit, notification, and development seed data. This phase adds a Billing and Invoice business flow without changing the workflow engine.

The target demo flow is:

```txt
Sales submits a billing request
  -> billing.submitted triggers a configured workflow
  -> Accounts reviews the workflow task
  -> approved outcome creates an invoice
  -> invoice becomes visible in role-based dashboards
```

## Decisions

- Add Billing and Invoice as regular business modules under `src/modules`.
- Reuse the existing workflow builder and runtime.
- Do not add a second workflow engine or billing-specific approval engine.
- Do not add a separate customer module for this phase. Store customer snapshot fields on billing requests and invoices.
- Do not add invoice payment collection in this phase. Invoice payment can be a later extension.
- Sales users create and submit billing requests.
- Accounts users approve billing workflow tasks through the existing workflow task APIs.
- Approved billing outcomes create exactly one invoice per billing request.
- Rejected billing outcomes mark the billing request as rejected and keep invoice creation blocked.
- Resubmission is allowed only when the selected workflow template allows resubmission.
- All CRUD operations must use TypeORM repositories.
- Controller request and response bodies must use named DTO classes with explicit Swagger metadata and shared envelope helpers.

## Architecture

Add two modules:

```txt
billing/
invoices/
```

`BillingModule` owns billing request creation, updates, submission, resubmission, listing, and workflow triggering.

`InvoicesModule` owns invoice records created by approved billing outcomes, invoice lookup, invoice status updates that are in scope, and dashboard summaries.

The runtime path is:

```txt
Billing request submit
  -> billing request saved as UNDER_REVIEW
  -> WorkflowRuntimeService.trigger()
  -> published Billing Request workflow template lookup
  -> trigger condition evaluation
  -> approval rule evaluation
  -> Accounts approval step activated
  -> audit log written
```

Approved outcome path:

```txt
Accounts approves active workflow step
  -> workflow instance finalized as APPROVED
  -> billing request marked APPROVED
  -> invoice created as ISSUED
  -> billing request linked to invoice
  -> requester and accounts notifications written
  -> audit log written
```

Rejected outcome path:

```txt
Accounts rejects active workflow step
  -> workflow instance finalized as REJECTED
  -> billing request marked REJECTED
  -> rejection reason stored
  -> requester notification written
  -> audit log written
```

## Entity Field Catalog

### Billing

`BillingRequest`:

```txt
id
requesterId
departmentId
customerName
customerEmail
customerAddress
title
description
amount
currency
billingCategory
status
workflowInstanceId
invoiceId
rejectionReason
customFieldsJson
submittedAt
approvedAt
rejectedAt
createdAt
updatedAt
```

### Invoices

`Invoice`:

```txt
id
billingRequestId
invoiceNumber
requesterId
departmentId
customerName
customerEmail
customerAddress
title
description
amount
currency
dueDate
status
issuedAt
cancelledAt
createdAt
updatedAt
```

## Status and Enum Catalog

`BillingRequestStatus`:

```txt
DRAFT
SUBMITTED
UNDER_REVIEW
REJECTED
APPROVED
INVOICED
CANCELLED
```

`InvoiceStatus`:

```txt
ISSUED
CANCELLED
PAID
```

`AuditAction` additions:

```txt
BILLING_REQUEST_CREATED
BILLING_REQUEST_UPDATED
BILLING_REQUEST_SUBMITTED
BILLING_REQUEST_RESUBMITTED
BILLING_REQUEST_APPROVED
BILLING_REQUEST_REJECTED
INVOICE_CREATED
INVOICE_CANCELLED
INVOICE_PAID
```

`NotificationType` additions:

```txt
BILLING_REQUEST_APPROVED
BILLING_REQUEST_REJECTED
INVOICE_CREATED
```

## Permissions

Add these permission slugs:

```txt
billing.read
billing.write
invoices.read
invoices.write
```

Role defaults:

- `employee`: no billing or invoice permissions by default.
- `department-reviewer`: no billing or invoice permissions by default.
- `sales-officer`: `billing.read`, `billing.write`.
- `manager`: `billing.read`.
- `accounts-officer`: `billing.read`, `invoices.read`.
- `finance-admin`: `billing.read`, `invoices.read`, `invoices.write`.
- `admin`: all billing and invoice permissions.

For the demo seed, assign the seeded Sales user the `sales-officer` role.

Listing rules:

- Admin sees all billing requests and invoices.
- Requesters see their own billing requests and invoices created from their requests.
- Managers see billing requests and invoices for their department.
- Accounts and finance roles see all billing requests under review and all issued invoices.

## Billing APIs

```txt
POST   /billing-requests
GET    /billing-requests
GET    /billing-requests/:id
PATCH  /billing-requests/:id
POST   /billing-requests/:id/submit
POST   /billing-requests/:id/resubmit
POST   /billing-requests/:id/cancel
```

Behavior:

- Create starts in `DRAFT`.
- Update is allowed only for draft or rejected requests owned by the requester, unless the actor is admin.
- Submit is allowed only from `DRAFT` or resubmittable `REJECTED`.
- Submit sets status to `UNDER_REVIEW`, sets `submittedAt`, and triggers `billing.submitted`.
- Cancel is allowed only before invoice creation.
- Read/list endpoints apply permission-aware filters.

## Invoice APIs

```txt
GET  /invoices
GET  /invoices/:id
POST /invoices/:id/cancel
POST /invoices/:id/mark-paid
```

Behavior:

- Invoices are created only by approved workflow outcomes.
- Invoice numbers are generated by the backend using a stable prefix and sequence-like timestamp format, for example `INV-20260610-0001`.
- `cancel` is allowed only for `ISSUED` invoices.
- `mark-paid` is allowed only for `ISSUED` invoices and sets status to `PAID`.
- Payment collection details are out of scope; `mark-paid` is a simple status transition.

## Workflow Builder Additions

Seed one active event schema:

```txt
moduleName: billing
eventName: billing.submitted
entityType: BillingRequest
```

Fields:

```txt
amount
currency
billingCategory
customerName
departmentId
customFields.projectCode
customFields.accountOwnerId
```

Seed one published workflow template:

```txt
name: Billing Approval Workflow
moduleName: billing
eventName: billing.submitted
entityType: BillingRequest
status: PUBLISHED
```

Default trigger condition:

```json
{
  "mode": "all",
  "conditions": [
    { "field": "amount", "operator": "gte", "value": 1 }
  ]
}
```

Default approval rule:

```txt
name: Accounts Review
priority: 100
isFallback: true
step 1: Accounts Review, assigneeType ROLE, assigneeRoleSlug accounts-officer
```

Approved outcome JSON:

```json
{
  "actions": [
    { "type": "MARK_BILLING_APPROVED" },
    { "type": "CREATE_INVOICE" }
  ]
}
```

Rejected outcome JSON:

```json
{
  "actions": [
    { "type": "MARK_BILLING_REJECTED" }
  ]
}
```

## Outcome Handling

Extend `OutcomeHandlerService` for `BillingRequest` outcomes:

- `MARK_BILLING_APPROVED`: set billing request status to `APPROVED`, set `approvedAt`, clear rejection reason.
- `CREATE_INVOICE`: create one invoice if the billing request has no `invoiceId`, set billing request status to `INVOICED`, link `invoiceId`, and write audit/notification records.
- `MARK_BILLING_REJECTED`: set billing request status to `REJECTED`, set `rejectedAt`, store rejection reason, and write audit/notification records.

The invoice creation action must be idempotent for a completed workflow instance. If an invoice already exists for the billing request, return the existing invoice instead of creating another one.

## Dashboard and Audit Additions

Dashboard additions:

- Admin dashboard includes billing request counts by status and issued invoice count.
- Employee dashboard includes the requester's billing request status summary and recent invoices.
- Accounts dashboard includes pending billing approval tasks and issued invoices.
- Finance dashboard includes issued, paid, and cancelled invoice counts.

Audit listing should support:

```txt
GET /audit-logs/entity/BillingRequest/:id
GET /audit-logs/entity/Invoice/:id
```

## Seed Data

Development seeding creates missing records for:

- Sales Officer role with slug `sales-officer`.
- Billing and invoice permissions.
- Role permission mappings for `sales-officer`, `accounts-officer`, `finance-admin`, and `admin`.
- Sales user role assignment for `sales-officer`.
- Billing event schema.
- Published Billing Approval Workflow.
- One draft billing request for the Sales seeded user.
- One submitted billing request with an active Accounts approval task, when useful for dashboards.
- One approved and invoiced billing request with an issued invoice.
- Audit logs and notifications for the sample billing records.

The seeder remains idempotent and checks stable fields before saving:

- Permission slug.
- Event schema module, event, and entity type.
- Workflow template name.
- Billing request title plus requester.
- Invoice number or billing request id.

## Out of Scope

- Customer master data.
- Invoice line-item catalog.
- Tax calculation.
- Payment gateway integration.
- Recurring invoices.
- Email delivery.
- PDF invoice rendering.
- Any new scheduling behavior.

## Testing and Verification

Focused tests:

- Billing submit service test for status transition and workflow trigger payload.
- Billing ownership and permission-aware listing tests.
- Invoice creation outcome test proving one invoice is created and repeated handling is idempotent.
- Invoice cancel and mark-paid service tests.
- Seed test proving Billing Approval Workflow and billing event schema exist.
- Dashboard shape test for billing and invoice summaries.

E2E demo flow:

```txt
login as Sales user
create billing request
submit billing request
login as Accounts user
approve pending billing workflow task
login as Sales user
fetch created invoice
fetch employee dashboard and verify invoice visibility
```

Verification commands:

```bash
pnpm test
pnpm build
```

Where PostgreSQL is available and development seed data has run:

```bash
pnpm test:e2e
```

## Completion Criteria

This phase is complete when:

- A Sales user can create and submit a billing request.
- Submission triggers the seeded Billing Approval Workflow.
- An Accounts user can approve or reject the active billing task.
- Approval creates one invoice and links it to the billing request.
- Rejection marks the billing request rejected and creates no invoice.
- Billing requests and invoices appear in permission-aware listings and dashboards.
- Swagger documents all new controller request and response DTOs with shared response envelope helpers.
- Unit tests pass with `pnpm test`.
- The project builds with `pnpm build`.
