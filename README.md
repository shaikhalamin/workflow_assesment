# ERP Workflow Module Assessment

An internal ERP-style workflow module for creating business requests, routing them through approvals, and tracking the final outcome with audit history.

The main implemented flow is sales billing approval. The app also includes expense approval and leave approval examples to show that the workflow engine is reusable.

## What Is Included

- Role-based access for employees, approvers, finance/accounts users, HR users, and admins.
- Configurable workflow templates with approval rules and ordered approval steps.
- Request flows for billing, expenses, and leave.
- Approval task screens where assigned users can approve, reject, or comment.
- Billing approval that creates a linked invoice after final approval.
- Expense approval that can create a payment request.
- Audit logs, workflow history, dashboard summaries, and in-app notifications.
- Seed data for quick review.

## Run The App

From the repository root:

```bash
docker compose up --build -d
```

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8870
- Swagger docs: http://localhost:8870/docs
- Postgres: `localhost:5438`
- Redis: `localhost:6385`

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

To reset local data and run fresh seed data:

```bash
docker compose down -v
docker compose up --build -d
```

## Demo Accounts

All seeded users use this password:

```text
Password123!
```

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Employee | `employee@example.com` |
| Manager | `manager@example.com` |
| Accounts Officer | `accounts@example.com` |
| Finance Admin | `finance@example.com` |
| HR Officer | `hr.officer@example.com` |
| HR Manager | `hr.manager@example.com` |
| CFO | `cfo@example.com` |
| Payroll Officer | `payroll@example.com` |

## Quick Review Flow

1. Sign in as `employee@example.com`.
2. Submit one of the seeded draft requests:
   - Billing request over `2500 BDT`
   - Expense request over `2000 BDT`
   - Leave request from `2026-06-16` to `2026-06-18`
3. Sign in as the assigned approvers, such as Manager, Accounts Officer, CFO, HR Officer, or HR Manager.
4. Approve or reject each active approval task.
5. Review the workflow history, audit logs, generated invoice, or payment request.

For the main billing flow, a submitted billing request moves through Manager, Accounts Officer, and CFO approval. After final approval, the system marks the billing request approved, creates an invoice, records audit logs, and sends simulated notifications.

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Table, Tailwind CSS.
- Backend: NestJS, TypeScript, TypeORM, PostgreSQL, Redis/BullMQ, Swagger, JWT cookie sessions, Socket.IO.
- Infrastructure: Docker Compose for frontend, backend, Postgres, and Redis.

## Repository Layout

```text
.
|-- docker-compose.yml
|-- workflow_be/   # NestJS backend, workflow engine, seed data
`-- workflow_fe/   # React/Vite frontend
```

## Notes

The default Docker environment is already configured in `docker-compose.yml`. Copy `.env.example` to `.env` only if you need to override ports, database credentials, cookie settings, or mailer settings.

Email delivery is simulated by default in backend logs, so no external mail provider is required for review.
