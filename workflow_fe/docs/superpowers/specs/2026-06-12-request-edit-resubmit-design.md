# Request Edit and Resubmit Design

## Problem

Rejected expense and leave requests currently do not give the requester a proper edit-before-resubmit flow. The frontend list pages expose a one-click `Resubmit` action for rejected rows with `canResubmit: true`, but that sends an empty payload and immediately restarts review without giving the requester a chance to correct the rejected request.

The backend already exposes the required resubmission APIs:

- `POST /expenses/:id/resubmit`
- `POST /leaves/:id/resubmit`

The generated frontend Kubb client already includes the matching hooks and DTO types. Generated files under `src/lib/api/gen` must not be manually edited.

## Scope

Build route-based edit pages for rejected expense and leave requests:

- `/expenses/$expenseId/edit`
- `/leaves/$leaveId/edit`

Each edit page reuses the same user-facing fields as the matching create form, prefills those fields from the rejected request, and submits the edited data through the existing resubmit endpoint. This is resubmission of the original request, not creation of a new request.

Out of scope:

- New backend endpoint design.
- Workflow engine refactor.
- Editing approved, paid, under-review, or draft requests through these resubmission pages.
- Manual edits to generated Kubb client code.

## Backend Behavior

The existing backend behavior is the baseline:

- A request can be resubmitted only when its status is `REJECTED`.
- The requester must own the request.
- The associated workflow template must allow resubmission.
- Resubmission applies the edited fields, clears the rejection reason, changes the request back to draft internally, and submits it again to create a new workflow instance.

Backend verification should focus on tests, not a new implementation, unless a test exposes a defect:

- Expense successful resubmit updates fields and triggers workflow.
- Leave successful resubmit updates fields and triggers workflow.
- Rejected but non-resubmittable requests remain blocked.
- Non-requesters cannot resubmit.
- API response still includes `canResubmit` and `rejectionReason`.

## Frontend Behavior

### Expense List

For a rejected expense row where `canResubmit === true`, replace the direct mutation button with an `Edit and resubmit` link to `/expenses/$expenseId/edit`.

Rows that cannot be resubmitted keep the existing disabled/submitted state.

### Expense Detail

For a rejected expense where `canResubmit === true`, show an `Edit and resubmit` action in the page header that links to `/expenses/$expenseId/edit`.

The rejection reason remains visible in the summary.

### Expense Edit Page

The edit page loads the existing expense by ID, validates that it is rejected and resubmittable, and prefills the same fields currently used by `ExpenseCreatePage`:

- Title
- Amount
- Currency
- Category
- Vendor
- Description

Submitting calls `useExpensesControllerResubmit` with the edited payload. On success, navigate to `/expenses/$expenseId`.

If the request is not rejected or `canResubmit` is false, show an empty/error state instead of the form.

### Leave List

For a rejected leave row where `canResubmit === true`, replace the direct mutation button with an `Edit and resubmit` link to `/leaves/$leaveId/edit`.

Rows that cannot be resubmitted keep the existing disabled/submitted state.

### Leave Detail

For a rejected leave where `canResubmit === true`, show an `Edit and resubmit` action in the page header that links to `/leaves/$leaveId/edit`.

The rejection reason remains visible in the summary.

### Leave Edit Page

The edit page loads the existing leave request by ID, validates that it is rejected and resubmittable, and prefills the same fields currently used by `LeaveCreatePage`:

- Leave type
- Start date
- End date
- Leave days
- Reason

Submitting calls `useLeavesControllerResubmit` with the edited payload. On success, navigate to `/leaves/$leaveId`.

If the request is not rejected or `canResubmit` is false, show an empty/error state instead of the form.

## Routing

Add two TanStack Router file routes:

- `src/routes/_private/expenses.$expenseId.edit.tsx`
- `src/routes/_private/leaves.$leaveId.edit.tsx`

The generated route tree is generated output and should not be manually edited. It should be refreshed through the existing router generation mechanism if the project requires it.

## Component Shape

Keep the implementation simple:

- Reuse the existing create-form markup and option arrays.
- Avoid introducing a shared form abstraction for only two forms.
- Add small page components in `src/pages/index.tsx` to match the current project structure.
- Use precise generated DTO types: `ResubmitExpenseDto` and `ResubmitLeaveDto`.
- Do not use `any`, non-null assertions, or TypeScript suppression comments.

## Error Handling

Use the existing `ErrorNotice` and `EmptyState` patterns:

- API load or mutation errors appear through `ErrorNotice`.
- Not-resubmittable requests show a clear blocked state.
- Missing data renders nothing or the existing empty state until the query resolves.

## Testing

Frontend tests should cover:

- Expense list links rejected resubmittable rows to the edit page instead of calling resubmit directly.
- Leave list links rejected resubmittable rows to the edit page instead of calling resubmit directly.
- Expense detail shows `Edit and resubmit` only for rejected resubmittable requests.
- Leave detail shows `Edit and resubmit` only for rejected resubmittable requests.
- Expense edit page prefills fields and calls `useExpensesControllerResubmit` with edited data.
- Leave edit page prefills fields and calls `useLeavesControllerResubmit` with edited data.

Backend tests should cover successful resubmit flows if they are not already covered.

## Verification

Frontend:

- `npm run typecheck`
- `npm run lint`
- Targeted Vitest page tests

Backend:

- Targeted Jest tests for expenses and leaves services
- `pnpm test -- expenses.service.spec.ts leaves.service.spec.ts` or the project-equivalent targeted command

## Acceptance Criteria

- A requester can open a rejected resubmittable expense, edit the create-form fields, and resubmit the same expense.
- A requester can open a rejected resubmittable leave request, edit the create-form fields, and resubmit the same leave request.
- List pages no longer immediately resubmit rejected requests without editing.
- Non-resubmittable rejected requests do not show a working edit/resubmit path.
- No generated Kubb client code is manually edited.
