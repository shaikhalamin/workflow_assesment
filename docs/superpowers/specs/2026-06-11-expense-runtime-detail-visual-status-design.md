# Expense and Runtime Detail Visual Status Design

## Goal

Replace raw JSON-style rendering on the expense detail page and workflow runtime detail page with clear visual workflow status. The pages should show what has happened, who is currently responsible, what is next, and allow the current assigned approver to approve or reject without leaving the detail context.

## Scope

This design applies to:

- `ExpenseDetailPage`
- `WorkflowInstanceDetailPage`

The existing pending approvals page remains the queue view. These two detail pages become the contextual view for understanding and acting on a single workflow.

The implementation should stay in the existing page structure unless a small local component is clearly simpler. Do not introduce a workflow graph library, canvas, global store, route changes, or new backend behavior.

## Current Problem

Both detail pages expose important workflow data through generic object rendering. That makes fields like `steps`, `actions`, `metadataJson`, and expense custom fields hard to understand. A user cannot quickly answer:

- Is this request waiting, active, approved, or rejected?
- Who is supposed to act now?
- What did previous approvers do?
- Who will review next?
- Can I approve or reject this step from here?

## Recommended Experience

Use the same compact operational style already used by the workflow template detail page:

- White bordered cards.
- Small uppercase section labels.
- Compact status badges.
- Ordered vertical step timelines.
- Plain-language summaries instead of raw JSON.
- Technical IDs only as low-priority reference rows.

The user should read each page in this order:

1. Business summary.
2. Current workflow status.
3. Approval step timeline.
4. Current approver action panel, when applicable.
5. Audit or action history.
6. Technical reference.

## Expense Detail Page

The expense detail page should replace the generic object panel with business-first sections.

### Expense Summary

Show a compact summary with:

- Title.
- Amount and currency.
- Category.
- Vendor, when present.
- Quantity, item value, and price, when present.
- Expense status badge.
- Submitted, approved, rejected, paid, created, and updated dates when present.

Descriptions and rejection reasons should render as normal text, not as object strings.

### Custom Fields

Render `customFieldsJson` as readable key/value rows when it is an object. If it is missing or empty, show a small empty state such as "No custom fields recorded."

Do not render raw JSON for custom fields.

### Embedded Workflow Progress

If the expense has a `workflowInstanceId`, fetch that workflow instance and show the shared workflow progress section on the expense page.

If the expense has no workflow instance, show a clear empty state such as "No workflow has been started for this expense."

Keep a secondary link to the full workflow runtime detail page.

## Workflow Runtime Detail Page

The runtime detail page should replace the raw instance object panel with workflow-first sections.

### Instance Summary

Show:

- Runtime status badge.
- Module and event.
- Entity type and entity ID.
- Started, completed, and rejected timestamps when present.
- Requester and department as low-priority rows.

Metadata should be rendered as readable rows when possible. Do not expose nested metadata as raw JSON.

### Workflow Progress

Render steps ordered by `stepOrder`.

Each step should show:

- Step number.
- Step name.
- Step type as a readable label.
- Assignee as readable text.
- Status badge.
- Activated date.
- Acted date.
- Actor user ID when present.
- Comment or rejection reason when present.

Status meaning:

- `APPROVED`: completed successfully.
- `REJECTED`: stopped or rejected at this step.
- `ACTIVE`: currently waiting for action.
- `WAITING`: upcoming step.
- `SKIPPED`: step did not run.

The active step should be visually distinct and easy to scan. Waiting steps should clearly read as upcoming.

### Current and Next Responsibility

Above or beside the timeline, show a small "Current responsibility" summary:

- If an active step exists, show the active step name and assignee.
- If no active step exists and the workflow is approved, show "Workflow completed."
- If no active step exists and the workflow is rejected, show the rejected step or workflow rejection state.
- If there are waiting steps, show the next waiting step and assignee.

## Approve and Reject Actions

The approve/reject panel should appear only when the current logged-in user can act on the active step.

The user can act when:

- The step status is `ACTIVE`.
- `assigneeType` is `USER` and `assignedUserId` matches the logged-in user's `id`.
- Or `assigneeType` is `ROLE` and `assignedRoleSlug` matches one of the logged-in user's role slugs.

For `REQUESTER_MANAGER`, `DEPARTMENT_HEAD`, and `CUSTOM_FIELD_USER`, show the responsibility in the timeline, but do not show the action panel unless the backend also provides an `assignedUserId` that matches the current user.

The panel should reuse the existing approve and reject mutations:

- Approve sends `{ comment }`.
- Reject sends `{ reason }`.

After either action succeeds, invalidate or refetch the relevant workflow and expense queries so the timeline updates.

The action panel should include:

- Current step name.
- Assignee text.
- One comment/reason input.
- Approve button.
- Reject button.
- Mutation error display when present.

The panel should not appear for users who are not assigned to the active step. Those users should still see the active responsibility and current status.

## Action and Audit History

Workflow runtime detail should continue showing audit logs, but in a readable table.

Step-level `actions` should be summarized inside each matching timeline step:

- Action.
- Actor.
- Comment or reason.
- Created date.

If there are no actions or logs, show a small empty state.

## Data Handling

Use generated types where available:

- `ExpenseResponseDto`
- `WorkflowInstanceResponseDto`
- `WorkflowStepResponseDto`
- `WorkflowActionResponseDto`

Because some generated fields are typed as `object`, use small local narrowing helpers with `unknown` and type guards. Do not use `any`.

Unknown values should fall back to existing `formatValue` behavior or an explicit empty state. Malformed object fields should not crash the page.

## Visual Style

Follow the existing workflow template detail page style:

- Compact cards and timelines.
- `Badge` for statuses.
- `SummaryValue`-style tiles for key facts.
- `SectionHeading` and `EmptyState` patterns where practical.
- Restrained semantic color accents for active, approved, rejected, waiting, and skipped states.

Avoid decorative hero sections, nested card-heavy layouts, new navigation patterns, and large visual rewrites unrelated to these two pages.

## Testing

Add focused tests for the two detail pages.

Coverage should verify:

- Expense detail renders business fields instead of raw object JSON.
- Expense detail fetches and displays workflow progress when `workflowInstanceId` exists.
- Runtime detail renders ordered steps with readable statuses and assignees.
- The active step and next waiting step are visible.
- Approve/reject controls appear when the active step is assigned to the logged-in user.
- Approve/reject controls appear when the active step is assigned to one of the logged-in user's roles.
- Approve/reject controls do not appear for unassigned users.
- Raw nested JSON strings such as `"steps"` and `"metadataJson"` are not displayed as page content.

Run typecheck, lint, and the focused page tests after implementation.
