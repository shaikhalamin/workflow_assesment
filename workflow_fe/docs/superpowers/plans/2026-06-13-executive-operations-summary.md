# Executive Operations Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the private `/` dashboard with an Executive Operations Summary backed by filtered dashboard data.

**Architecture:** Extend the existing backend dashboard admin endpoint rather than creating a separate reports module. Regenerate the existing Kubb client from Swagger, then replace the frontend dashboard rendering with summary KPI tiles, CSS charts, date filters, and recent workflow activity.

**Tech Stack:** NestJS, TypeORM repositories, Swagger DTOs, Kubb, React, TanStack Query, TanStack Router, Vitest, Jest, Tailwind CSS utilities.

---

## File Structure

- Modify `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dto/dashboard-response.dto.ts` to document the expanded response and query DTO.
- Modify `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.controller.ts` to accept query filters on `admin`.
- Modify `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.service.ts` to apply `createdAt` filters and return the executive summary.
- Modify `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.service.spec.ts` with focused backend tests.
- Regenerate frontend Kubb files under `src/lib/api/gen` after directly confirming the backend Swagger JSON endpoint is reachable.
- Modify `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/pages/index.tsx` to replace `DashboardPage`.
- Modify or create a frontend page test covering the new dashboard behavior.

## Task 1: Backend Admin Summary Contract

**Files:**
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.service.spec.ts`
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dto/dashboard-response.dto.ts`
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.controller.ts`
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/dashboard/dashboard.service.ts`

- [ ] **Step 1: Write the failing backend test**

Add a test that calls `service.admin({ from: '2026-06-01', to: '2026-06-30' })` and expects:

```ts
expect(result).toEqual({
  workflows: { active: 1, approved: 2, rejected: 3, failed: 4 },
  billing: {
    draft: 5,
    submitted: 6,
    underReview: 7,
    approved: 8,
    rejected: 9,
    invoiced: 10,
    cancelled: 11,
  },
  invoices: { issued: 12, paid: 13, cancelled: 14 },
  payments: { pending: 15, paid: 16, cancelled: 17 },
  recentWorkflowChanges: [
    {
      id: 'workflow-1',
      type: 'BillingRequest',
      title: 'billing.submit',
      createdAt: '2026-06-12T10:00:00.000Z',
    },
  ],
  failedTriggers: 4,
})
```

- [ ] **Step 2: Run the backend test to verify it fails**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_be
pnpm test -- dashboard.service.spec.ts
```

Expected: FAIL because `admin` does not accept filters and does not return all new fields.

- [ ] **Step 3: Add DTO-backed query and response fields**

Add `DashboardDateRangeQueryDto`, `AdminPaymentSummaryDto`, expand `AdminInvoiceSummaryDto`, expand `AdminWorkflowSummaryDto`, expand `BillingSummaryDto`, and export all properties with `@ApiProperty` / `@ApiPropertyOptional`.

- [ ] **Step 4: Wire query DTO into the controller**

Change `admin()` to `admin(@Query() query: DashboardDateRangeQueryDto)` and pass `query` to the service.

- [ ] **Step 5: Implement the filtered service summary**

Use TypeORM `FindOptionsWhere` with `createdAt` filters. Use `Between`, `MoreThanOrEqual`, and `LessThanOrEqual`. Count each required status through repositories. Fetch recent workflow instances with `find({ where, order: { updatedAt: 'DESC' }, take: 5 })`.

- [ ] **Step 6: Run the backend test to verify it passes**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_be
pnpm test -- dashboard.service.spec.ts
```

Expected: PASS.

## Task 2: Regenerate Frontend API Client

**Files:**
- Generated: `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/lib/api/gen/**`

- [ ] **Step 1: Start or reuse the backend dev server**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_be
pnpm dev
```

- [ ] **Step 2: Confirm Swagger JSON directly**

Run:

```bash
curl -fsS http://127.0.0.1:8870/docs-json >/tmp/workflow-swagger.json
```

Expected: exit 0.

- [ ] **Step 3: Regenerate the Kubb client**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm run generate:api
```

Expected: generated dashboard admin query types include optional `from` and `to` params.

## Task 3: Frontend Executive Dashboard

**Files:**
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/pages/index.tsx`
- Test: use the existing relevant page test file or create `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/pages/dashboard.test.tsx`

- [ ] **Step 1: Write the failing frontend test**

Mock `useDashboardControllerAdmin` and assert the page renders:

```ts
expect(screen.getByRole('heading', { name: /executive operations summary/i })).toBeInTheDocument()
expect(screen.getByText('Active workflows')).toBeInTheDocument()
expect(screen.getByText('Billing requests')).toBeInTheDocument()
expect(screen.getByText('Recent workflow activity')).toBeInTheDocument()
```

Then change the `from` input to `2026-06-01` and expect the admin hook to receive:

```ts
expect(adminHook).toHaveBeenLastCalledWith({
  params: { from: '2026-06-01' },
})
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm test -- src/pages/dashboard.test.tsx
```

Expected: FAIL because the current dashboard still renders role-aware widgets and does not pass admin query params.

- [ ] **Step 3: Replace `DashboardPage` with the executive summary**

Implement local helper functions inside `src/pages/index.tsx`:

```ts
function statusTotal(items: Array<{ value: number }>) {
  return items.reduce((total, item) => total + item.value, 0)
}
```

Add simple local chart components `StatusBars` and `RecentActivityList` in the same file. Do not introduce new shared abstractions.

- [ ] **Step 4: Run the frontend test to verify it passes**

Run:

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm test -- src/pages/dashboard.test.tsx
```

Expected: PASS.

## Task 4: Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run targeted backend test**

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_be
pnpm test -- dashboard.service.spec.ts
```

- [ ] **Step 2: Run targeted frontend test**

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm test -- src/pages/dashboard.test.tsx
```

- [ ] **Step 3: Run frontend typecheck**

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm run typecheck
```

- [ ] **Step 4: Run frontend lint**

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm run lint
```

- [ ] **Step 5: Run frontend build**

```bash
cd /home/shaikh/assesments/fiber_at_home/workflow_fe
npm run build
```

## Self-Review

- Spec coverage: The plan covers backend filtering, the expanded executive payload, Kubb regeneration, frontend replacement, charts, recent activity, and verification.
- Placeholder scan: No `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: The response field names match the design and will flow through the regenerated Kubb client.
