# Workflow UI Restyle Design

Date: 2026-06-10

## Goal

Restyle the workflow frontend to follow the visual system and screen patterns from `/home/shaikh/my_projects/Inspectio_project/inspectio-fe`, adapted for this workflow project. The implementation should keep this app's current routing, data fetching, and simple component structure.

## Source Patterns

- Design tokens, compact surfaces, typography, borders, and muted operational palette from Inspectio's global styles.
- Public auth shell/card pattern from Inspectio's sign-in and sign-up screens.
- Sidebar and topbar visual pattern from Inspectio's private app chrome.
- New-form layout pattern from Inspectio's `schedule.new` flow.
- Dashboard/table pattern from Inspectio's inspections list.

## Scope

Update these areas:

- Global styling in `src/index.css`.
- Sign-in and sign-up screens in `src/pages/auth-pages.tsx` and public auth layout in `src/layouts/public-layout.tsx`.
- Private sidebar/topbar in `src/layouts/private-layout.tsx`.
- Shared first-party form components under a new `src/components/form` folder.
- Private `*.new` form routes:
  - `/workflow-templates/new`
  - `/expenses/new`
  - `/leaves/new`
- Dashboard at `/`, including top cards and the pending-approval table/list.

Out of scope:

- Importing Inspectio's stores, chrome state architecture, full icon wrapper, auth funnel, or SSO flows.
- Restyling non-new detail/edit pages unless touched by shared table/form styles.
- Adding speculative workflow features or new backend behavior.

## Design System

`src/index.css` will be updated with Inspectio-like design tokens: light background, white card surfaces, compact muted surfaces, stronger border variables, primary/accent/status colors, and consistent radii. The palette will be adapted away from Inspectio's blue-heavy identity so this workflow app has a separate color direction.

Font handling will prefer the Inspectio font stack style but stay robust with local/system fallbacks. No external font dependency is required for the first pass.

Existing Tailwind utility usage will remain. Components will continue to use CSS variables such as `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, and added variables such as `--surface-2`, `--surface-3`, `--ink-2`, `--ink-3`, `--brand-soft`, `--accent-soft`, and `--success`.

## Public Auth

The public auth pages will use an Inspectio-style operational entry layout:

- Centered authentication card with compact title, metadata label, form fields, submit button, error alert, and footer link.
- Static technical background treatment with a subtle grid or image-backed panel.
- Sign-up will use one simple background image section, no slider.
- Sign-up copy will describe this workflow project: configurable approvals, runtime tasks, audit history, expenses, leave, payments, and event schemas.
- Sign-in will use the same card pattern but with a different image and color treatment from sign-up.

Auth behavior remains unchanged:

- Sign-in uses `useAuthControllerLogin`.
- Sign-up uses `useAuthControllerSignup`.
- Successful auth stores the user and navigates to the default private path.
- Validation remains based on the current generated DTO schemas plus local zod constraints.

## Private Chrome

`src/layouts/private-layout.tsx` will keep the current single-file layout and current auth/session behavior.

The sidebar will be restyled to match Inspectio's compact private nav:

- Card-colored sidebar, subtle border, grouped nav sections, compact rows, icon color accents, active left rail, and user profile block near the bottom.
- Current workflow routes and labels remain.
- No new collapsible sidebar store will be added.

The topbar will be restyled to match the Inspectio topbar pattern:

- Sticky compact header with title/user context, muted subtitle/email, and right-side sign-out action.
- Mobile behavior remains simple and consistent with the existing layout.

## Shared Form Components

Create `src/components/form` as the single first-party location for reusable form primitives. It will contain simple components only:

- `FormField`
- `FormInput`
- `FormSelect`
- `FormTextarea`
- `FormCheckbox`
- `FormSection`
- `FormShell`

These components will be typed with React and TypeScript without `any`. New and restyled form surfaces must import form primitives from `src/components/form`. Existing `src/components/ui/form-controls.tsx` may remain only for untouched screens.

## Private New Forms

All private `*.new` form pages will use the Inspectio `schedule.new` layout pattern:

- A compact page header with uppercase kicker, title, and right-side actions.
- Numbered sections with small monospace indexes and concise hints.
- Dense field grids with uppercase field labels.
- A clear bottom action area.
- A right-side summary/preview card when useful.

`/workflow-templates/new` will retain the seven-step builder behavior but present each step inside the new section/card language.

`/expenses/new` will be organized into sections for expense details, vendor/category, and notes, with a summary preview.

`/leaves/new` will be organized into sections for leave type, dates/duration, and reason, with a summary preview.

Create behavior and navigation remain unchanged.

## Dashboard

The dashboard will be restyled using the Inspectio inspections-list pattern:

- Compact operations header.
- Top metric cards with current dashboard values.
- Filter/search control row tailored to workflow statuses and pending tasks.
- Pending approvals table/list styled with compact rows, badges, status emphasis, and mobile-friendly stacked rows.

The dashboard will continue to use existing dashboard and pending-task API hooks. Empty states should stay simple and readable.

## Data Flow

No API contracts change.

Auth, dashboard metrics, tasks, workflow builder, expense create, and leave create continue to use the current generated React Query hooks. UI changes should not alter payloads except where existing code already sends current form state.

## Error Handling

Existing error behavior remains:

- Auth pages show API errors in-card.
- Private create pages show API errors near the form header or action area.
- Dashboard tables show empty states when data is missing.

Error messages should continue to use `apiErrorMessage` where it is already available.

## Testing And Verification

Run:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual visual verification should include:

- `/sign-in`
- `/sign-up`
- `/`
- `/workflow-templates/new`
- `/expenses/new`
- `/leaves/new`

## Constraints

- Keep the simplest implementation that solves the request.
- Do not introduce `any`, TypeScript suppression comments, non-null assertions to hide errors, or ESLint disables.
- Do not search or edit generated/third-party output directories.
- Do not silently add unrelated refactors.
