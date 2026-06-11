# Workflow Template List Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the workflow builder list actions and prevent deactivation of templates already associated with workflow instances.

**Architecture:** The backend owns the association rule and exposes `workflowInstanceCount` on workflow template responses. The frontend uses that count to disable the destructive Deactivate action and show the warning inline in the list.

**Tech Stack:** NestJS, TypeORM, Swagger DTOs, React, TanStack Router/Table, Vitest, Jest.

---

### Task 1: Backend Association State

**Files:**
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/workflow-builder/workflow-builder.module.ts`
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/workflow-builder/workflow-template.service.ts`
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/workflow-builder/dto/workflow-builder-response.dto.ts`
- Test: `/home/shaikh/assesments/fiber_at_home/workflow_be/src/modules/workflow-builder/workflow-template.service.spec.ts`

- [ ] Write failing Jest tests that `list()` attaches `workflowInstanceCount` and `deactivate()` rejects when count is greater than zero.
- [ ] Run `pnpm test -- workflow-template.service.spec.ts` and verify the new tests fail for missing behavior.
- [ ] Inject the workflow instance repository, add counts to list/detail/deactivate responses, and throw `BadRequestException('Workflow already associated can not deactivate')` before status changes.
- [ ] Run `pnpm test -- workflow-template.service.spec.ts` and verify the service tests pass.

### Task 2: Frontend List Actions

**Files:**
- Modify: `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/pages/workspace-pages.tsx`
- Test: `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/pages/workspace-pages.workflow-template-list.test.tsx`

- [ ] Write failing Vitest coverage for no Duplicate button, `View Details`, hidden Publish on `PUBLISHED`, destructive Deactivate, and warning/disabled state when `workflowInstanceCount > 0`.
- [ ] Run `npm test -- src/pages/workspace-pages.workflow-template-list.test.tsx` and verify the new tests fail for missing UI behavior.
- [ ] Update `WorkflowTemplatesPage` action rendering with no duplicate mutation/button, a labeled detail link, conditional Publish, and destructive disabled Deactivate with warning.
- [ ] Run `npm test -- src/pages/workspace-pages.workflow-template-list.test.tsx` and verify the list tests pass.

### Task 3: API Client Verification

**Files:**
- Generated: `/home/shaikh/assesments/fiber_at_home/workflow_fe/src/lib/api/gen/**`

- [ ] Start or reuse the backend server.
- [ ] Hit the backend Swagger/OpenAPI endpoint directly.
- [ ] Run `npm run generate:api` from the frontend if the Swagger response includes the new response field.
- [ ] Do not manually edit generated files.

### Task 4: Final Verification

- [ ] Run focused backend tests.
- [ ] Run focused frontend tests.
- [ ] Run frontend typecheck.
- [ ] Run lint where feasible and report any pre-existing or unrelated failures.
