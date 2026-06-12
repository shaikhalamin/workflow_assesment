# Executive Operations Summary Design

## Goal

Replace the current private `/` dashboard with an executive operations summary for admin and management users. The page should show workflow, billing, invoice, payment, failed-trigger, and recent workflow activity data with basic date filtering and visual status summaries.

## Scope

- Use `GET /api/dashboard/admin` as the summary endpoint.
- Add optional `from` and `to` query parameters.
- Apply `from` and `to` to `createdAt` for workflows, billing requests, invoices, payments, and recent workflow activity.
- Keep the existing `dashboard.read` permission.
- Do not add a chart dependency unless explicitly requested.
- Do not manually edit generated Kubb files under `src/lib/api/gen`; regenerate after the backend Swagger endpoint exposes the changed API.

## Backend Design

Extend the dashboard admin endpoint to return the full executive summary:

- `workflows`: `active`, `approved`, `rejected`, `failed`
- `billing`: `draft`, `submitted`, `underReview`, `approved`, `rejected`, `invoiced`, `cancelled`
- `invoices`: `issued`, `paid`, `cancelled`
- `payments`: `pending`, `paid`, `cancelled`
- `failedTriggers`: same value as `workflows.failed`
- `recentWorkflowChanges`: latest workflow instances within the date filter, ordered by `updatedAt DESC`, limited to five items

The controller will accept a DTO-backed query object. Dates are ISO date strings. Invalid dates should fail normal validation. If only `from` is supplied, use `createdAt >= from`; if only `to` is supplied, use `createdAt <= to`; if both are supplied, use an inclusive range.

## Frontend Design

Replace `DashboardPage` content in `src/pages/index.tsx`.

The page will:

- Load `useDashboardControllerAdmin` with optional `from` and `to` params.
- Show date inputs for `from` and `to`.
- Provide “Last 30 days” and “Clear” controls.
- Render KPI tiles for active, approved, rejected, failed workflows, pending payments, failed triggers, and invoice states.
- Render simple CSS bar charts for workflow, billing, invoice, and payment status counts.
- Render recent workflow activity as a compact list.

The visual treatment should stay consistent with the existing operational UI: compact, scannable, and table/dashboard oriented.

## Data Flow

1. User opens `/`.
2. Frontend calls `GET /api/dashboard/admin`.
3. User changes date filters.
4. Frontend calls `GET /api/dashboard/admin?from=YYYY-MM-DD&to=YYYY-MM-DD`.
5. Backend applies `createdAt` filters to each repository query and returns the summary envelope.
6. Frontend charts and KPI tiles update from the generated client response.

## Testing

Backend:

- Add service tests proving admin summary includes all required counts.
- Add service tests proving date filters are passed to repository queries.

Frontend:

- Add a dashboard test proving executive KPI/chart labels render from admin data.
- Add a dashboard test proving the date filters are passed to `useDashboardControllerAdmin`.

Verification:

- Backend targeted Jest test for dashboard service.
- Frontend targeted Vitest test for the dashboard page.
- Frontend typecheck, lint, and build if local dependencies allow.

## Open Decisions Resolved

- The current `/` dashboard is replaced, not duplicated.
- `from` and `to` filter `createdAt`, including workflows generated from leave requests.
- Leave business dates such as `fromDate` and `toDate` are not used for this executive operations summary.
