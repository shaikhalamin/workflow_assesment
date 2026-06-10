# Read-Only Workflow Template Detail Design

## Goal

Replace the generic JSON-style workflow template detail view with a read-only page that explains the workflow in business terms. The page should help a user understand when the workflow runs, which approval path is selected, who approves each step, and what happens after approval or rejection.

## Scope

This design applies only to `WorkflowTemplateDetailPage`. The page remains strictly read-only. It does not add edit, publish, duplicate, deactivate, or inline configuration actions.

## Current Problem

The current page renders the template response through a generic object panel. Nested fields such as `triggerCondition`, `rules`, `steps`, and `outcomeConfig` appear as raw JSON, which is difficult for non-technical users to interpret.

## Recommended Experience

Use a hybrid of:

- Workflow story view: sections ordered by how the workflow executes.
- Lightweight visual flow: cards, connectors, and step timelines that show rule branching without adding a graph library or canvas.

The page should read in this order:

1. Template summary
2. Trigger
3. Workflow flow
4. Rule and approval step details
5. Outcomes
6. Technical metadata

## Template Summary

The header should show the template name and compact badges for:

- Status, such as `DRAFT`
- Module, such as `expenses`
- Event, such as `expense.submitted`
- Priority

Below the header, show a compact summary grid:

- Entity type
- Effective date range
- Resubmission allowed or not
- Number of rules
- Total approval steps
- Last updated date

UUIDs should not be part of the primary summary.

## Trigger Section

Show the trigger in plain language.

When there are no conditions:

> Runs for every `expense.submitted` event.

When conditions exist:

> Runs when all trigger conditions match:

Then render condition chips such as:

- `amount >= 2000`
- `category equals travel`

For condition groups:

- `mode: all` means "All conditions must match".
- `mode: any` means "Any condition can match".

## Workflow Flow Section

Show a simple visual flow using normal layout primitives:

```text
Trigger
  |
Evaluate approval rules by priority
  |
  +-- Priority 1 rule
  |     Step 1 -> Step 2 -> Step 3
  |
  +-- Priority 2 rule
        Step 1
```

In the UI this should be rendered as cards and timelines, not ASCII text. The visual flow should communicate:

- The event starts the workflow.
- Rules are evaluated by priority.
- Each rule has its own approval path.
- Steps run in order inside the matched rule.

Do not introduce a flowchart library, drag canvas, minimap, zoom controls, or editable graph behavior.

## Rule Cards

Rules should be sorted by priority ascending.

Each rule card should show:

- Rule name
- Priority
- Active or inactive state
- Fallback state, if applicable
- Human-readable condition summary
- Number of steps

Example:

```text
Priority 1
Amount Over 2000
Condition: amount is greater than or equal to 2000
Active
3 steps
```

If a rule has no condition and is not fallback, show a clear empty message such as "No rule condition configured."

## Approval Step Timeline

Inside each rule card, show the approval steps as a vertical timeline.

Each step should show:

- Step number
- Step name
- Step type as a readable label
- Assignee as readable text
- SLA, when present
- Relevant flags only

Assignee text should use the existing workflow-builder language where possible:

- `REQUESTER_MANAGER` -> `Requester's manager`
- `DEPARTMENT_HEAD` -> `Department head`
- `ROLE` -> `Role: Finance Admin`
- `USER` -> user name when available, otherwise `User ID: ...`
- `CUSTOM_FIELD_USER` -> `User from event field: customFields.budgetOwnerId`

Only show enabled flags. For example:

- `Required`
- `Can reject`
- `Comment required`
- `Attachment required`
- `Reassign allowed`

Do not show false flags such as "Comment not required" or null assignment fields.

## Outcomes Section

Render `outcomeConfig` as two outcome cards.

Approved card:

- Set status to the configured approved status, such as `APPROVED`
- Notify requester, when enabled
- Create payment request, when enabled

Rejected card:

- Set status to the configured rejected status, such as `REJECTED`
- Require rejection reason, when enabled
- Allow resubmission, when enabled

If an outcome object has extra keys, render them as readable key/value rows instead of raw JSON.

## Technical Metadata

Place low-priority technical data at the bottom:

- Template ID
- Created date
- Updated date
- Created by, if available

Nested rule and step IDs should stay hidden unless there is a clear product requirement to expose them.

## Data Handling

Use the generated workflow template response types where practical. Because some generated JSON fields are typed as `object`, define small local narrowing helpers for condition groups and outcome action maps instead of using `any`.

Unknown or malformed nested objects should fail gracefully:

- Conditions: show "No conditions configured."
- Rules: show "No approval rules configured."
- Steps: show "No approval steps configured."
- Outcomes: show "No outcome actions configured."

## Visual Style

Use existing styling patterns from the app:

- White cards with `var(--border)`
- Compact badges
- Small uppercase section labels
- Timeline circles and connectors similar to the existing workflow preview
- Restrained colors from existing CSS variables

Cards should remain functional and compact. Avoid large decorative hero areas, nested card-heavy layouts, and marketing-style sections.

## Testing

Add focused coverage for the detail page rendering:

- Trigger without conditions renders as "Runs for every event".
- Rules render sorted by priority.
- Step assignees render in readable language.
- Approved and rejected outcomes render as business actions.
- Raw nested JSON strings are not shown for trigger, rules, steps, or outcomes.

Run typecheck and lint after implementation.
