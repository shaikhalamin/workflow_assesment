# ERP Workflow Module ==> Task Assesment

This project is an internal ERP-style workflow module for any business operations. The base product is a configurable approval system where employees or business teams create operational requests, approvers act on staged workflow tasks, and final business outcomes are produced with full status tracking and audit history.

The primary implemented flow is Sales billing approval:

1. A Sales/Employee user creates a billing request.
2. The request is submitted into a published workflow when it meets the seeded rule, currently `amount >= 2500 BDT`.
3. Approval moves through requester manager, Accounts Officer, and CFO.
4. When all approval steps pass, the system marks the billing request approved, creates an invoice, links it back to the billing request, records audit logs, and sends simulated notifications.

The product also includes expense approval to payment request and leave approval flows to demonstrate that the workflow engine is reusable, not hard-coded only for billing.

## Run With Docker Compose

Run everything from the repository root:

```bash
docker compose up -d --build
```

Default services:

- Frontend: http://localhost:5173
- Backend health endpoint: http://localhost:8870
- Swagger API docs: http://localhost:8870/docs
- Postgres host port: `5438`
- Redis host port: `6385`

The default environment is already wired through `docker-compose.yml`. Copy `.env.example` to `.env` only if you need to override ports, database credentials, cookie domain, or mailer settings.

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
docker compose down -v
```

Use `docker compose down -v` when you want a fresh database and fresh seed data.

## Demo Login Accounts

Development seed data is created automatically when the backend starts with `NODE_ENV=development`.

All seeded users use this password:

```text
Password123!
```

| Role focus | Email |
| --- | --- |
| Admin / workflow setup | `admin@example.com` |
| Employee / requester | `employee@example.com` |
| Manager / first approver | `manager@example.com` |
| Accounts Officer | `accounts@example.com` |
| Finance Admin | `finance@example.com` |
| HR Officer | `hr.officer@example.com` |
| HR Manager | `hr.manager@example.com` |
| CFO | `cfo@example.com` |
| Payroll Officer | `payroll@example.com` |

## Seeded Review Data

The seed process creates departments, roles, permissions, workflow definitions, users, and draft business records. For quick review, sign in as `employee@example.com` and submit the seeded draft records:

- Billing request: `Seed billing request over 2500 BDT`
- Expense request: `Seed expense request over 2000 BDT`
- Leave request: annual leave from `2026-06-16` to `2026-06-18`

Then sign in as the relevant approvers to complete each active approval step.

## Built Features

### Authentication And Role-Based Access

The app has cookie-based authentication with login, signup, refresh, logout, and current-user profile endpoints. Access is controlled by roles and permissions on both backend routes and frontend navigation. Seeded roles include Employee, Manager, Department Reviewer, Accounts Officer, Finance Admin, HR Officer, HR Manager, CFO, Payroll Officer, and Admin.

Admins can view roles and permissions and update permission assignments for non-admin roles from the permission management area.

### Configurable Workflow Builder

The workflow builder supports reusable workflow templates instead of hard-coded approval chains. An admin can create or update workflow templates, event schemas, rules, step configs, trigger conditions, and outcome configs.

Important capabilities include:

- Template lifecycle: draft, publish, deactivate, duplicate.
- Rule-based routing by request metadata such as amount, category, leave days, department, and custom fields.
- Ordered approval steps with assignee strategies such as requester manager, role, user, department head, and field-based assignee.
- Outcome configuration for approved and rejected workflows.
- Resubmission support for rejected requests when the template allows it.

Seeded workflows:

- Billing Approval Workflow: billing requests over `2500 BDT`.
- Expense Approval Workflow: expense requests over `2000 BDT`.
- Leave Approval Workflow: leave requests of `3` days or more.

### Workflow Runtime And Approval Tasks

When a request is submitted, the runtime engine selects the matching published template and rule, creates a workflow instance, creates ordered workflow steps, activates the first step, and records the trigger event.

Approvers get a task list for active steps assigned directly to them or to one of their roles. They can approve, reject with a required reason, or add comments. Approval activates the next waiting step; rejection closes the workflow, skips remaining steps, updates the source business record, and records the reason.

Workflow instance detail screens show the request summary, active/completed steps, actors, comments, timestamps, and action history.

### Billing Request To Invoice Flow

Billing requests can be created, listed, viewed, updated while draft or rejected, submitted, resubmitted after rejection, and cancelled where allowed. Visibility is role-aware, so requesters see their own records while Accounts, Finance, Manager, and Admin roles can review broader operational data.

On final approval, the billing outcome handler:

- Marks the billing request approved.
- Creates a linked invoice.
- Generates an invoice number using the issue date and sequence.
- Sets invoice due date.
- Updates the billing request to `INVOICED`.
- Records billing and invoice audit entries.
- Sends simulated push/email notifications.

Invoices can be listed, viewed, downloaded from the frontend, cancelled if still issued, or marked paid where the user has invoice write permission.

### Expense To Payment Flow

Employees can create, update, delete draft expenses, submit eligible expenses into workflow, and resubmit rejected expenses. The seeded expense workflow routes over-threshold requests through manager, Accounts Officer, and CFO approval.

On final approval, an expense can move to `PAYMENT_PENDING` and create a payment request. Accounts or Finance users can view payment requests and mark pending payments as paid with a payment reference. Marking a payment paid also updates the linked expense to `PAID`.

### Leave Approval Flow

Employees can create draft leave requests, update or delete drafts, submit leave into workflow, and resubmit rejected leave. The seeded leave workflow handles leave requests of three days or more through manager, HR Officer, and HR Manager approval.

On final approval, the leave request is marked `APPROVED` and stores the approved period. Rejections preserve a reason and return the request to the requester for review and possible resubmission.

### Dashboards And Lists

The frontend includes operational list/detail screens for:

- Dashboard
- Workflow Builder
- Workflow Runtime
- Approval Tasks
- Expenses
- Leaves
- Billing Requests
- Invoices
- Payment Requests
- Permissions
- Audit Logs

Dashboard APIs provide role-focused summaries for Admin, Employee, Approver, Accounts, Finance, and HR users. These summaries include active workflows, approval workload, billing status counts, invoice status counts, payment counts, leave counts, and recent workflow changes.

### Auditability

The backend records audit logs for important events such as request creation, update, submission, workflow trigger, step approval, rejection, comment, cancellation, billing approval, invoice creation, payment completion, and other status changes.

Audit logs can be viewed globally, by business entity, or by workflow instance. The logs preserve actor, entity, workflow instance, workflow step, old status, new status, comments, rejection reasons, metadata, and timestamps.

### Notifications And Simulated Mail

The system creates notifications when tasks are assigned and when important outcomes happen, such as workflow approval/rejection, billing approval, invoice creation, payment creation, and payment completion.

The frontend listens for live notification events over Socket.IO and also reads unread notifications from the API. Email delivery is simulated by default through the console mailer transport, so examiners can inspect backend logs without configuring an external mail provider.

### Validation And Error Handling

The API uses DTO validation, whitelisted request bodies, role/permission guards, and clear business-state checks. Examples include:

- Only requesters can submit or update their own draft/rejected requests.
- Rejection requires a reason.
- Only active workflow steps can be approved or rejected.
- Users can only act on workflow steps assigned to their user account or role.
- Published workflows must have active rules and approval steps.
- Draft-only delete/cancel rules protect already submitted business records.

Responses are wrapped consistently by the backend response interceptor, and the frontend displays loading, empty, and error states across the main workflow screens.

## Technical Shape

- Frontend: React, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Table, Tailwind CSS, generated API hooks.
- Backend: NestJS, TypeScript, TypeORM, PostgreSQL, Redis/BullMQ, Swagger, JWT cookie sessions, Socket.IO notifications.
- Database: PostgreSQL with TypeORM entities for users, roles, permissions, departments, workflow templates, workflow instances, workflow actions, audit logs, billing, invoices, expenses, leave requests, payments, and notifications.
- Infrastructure: root Docker Compose starts frontend, backend, Postgres, and Redis together for review.

## Repository Layout

```text
.
|-- docker-compose.yml
|-- workflow_be/   # NestJS API, workflow engine, seed data, tests
`-- workflow_fe/   # React/Vite frontend and generated API client
```

## Stopping Or Resetting

Stop containers while preserving data:

```bash
docker compose down
```

Reset all local Docker data and rerun seeds:

```bash
docker compose down -v
docker compose up -d --build
```
