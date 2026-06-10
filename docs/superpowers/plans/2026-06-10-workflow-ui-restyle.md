# Workflow UI Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the workflow frontend to follow the Inspectio operational UI language while keeping current routes, API hooks, auth behavior, and simple file structure.

**Architecture:** Keep the app shell and feature screens in their current files. Add one small first-party form primitives module under `src/components/form`, then restyle the public auth screens, private chrome, new-form routes, and dashboard through direct JSX/class changes. Avoid new stores, providers, generated API edits, and unrelated route refactors.

**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query, TanStack Form, Tailwind CSS v4 utilities, lucide-react, Vitest.

---

## Source References

- Inspectio tokens: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/styles/globals.css`
- Inspectio auth card pattern: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/features/auth/LoginScreen.tsx`
- Inspectio signup visual pattern: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/features/auth/SignupLandingScreen.tsx`
- Inspectio chrome pattern: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/components/layouts/IQSidebar.tsx` and `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/components/layouts/IQTopBar.tsx`
- Inspectio new-form section pattern: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/features/scheduling/ScheduleNewScreen.tsx`
- Inspectio list/table pattern: `/home/shaikh/my_projects/Inspectio_project/inspectio-fe/src/features/inspections/InspectionsListScreen.tsx`

Do not import Inspectio code, stores, icon wrappers, auth funnel state, SSO flows, or generated API artifacts. Use those files only as visual references.

## File Structure

- Modify `src/index.css`: Replace the current small token set with Inspectio-like light tokens adapted away from Inspectio blue. Keep `@import 'tailwindcss';`, system font fallbacks, `box-sizing`, body reset, and `#root`.
- Create `src/components/form/index.tsx`: Export `FormField`, `FormInput`, `FormSelect`, `FormTextarea`, `FormCheckbox`, `FormSection`, and `FormShell`. Keep this as one small module to avoid unnecessary abstraction spread.
- Create `src/components/form/form-primitives.test.tsx`: Render-test the new form primitives with React Testing Library.
- Modify `src/pages/auth-pages.tsx`: Keep `useAuthControllerLogin`, `useAuthControllerSignup`, `useAuthStore`, validation schemas, and navigation. Restyle `AuthPanel` and replace imports from `src/components/ui/form-controls` with `src/components/form`.
- Modify `src/layouts/public-layout.tsx`: Keep the public route outlet. Branch the right-side visual treatment by pathname with `useLocation`; do not add a store.
- Modify `src/layouts/private-layout.tsx`: Keep session checks, auth query, logout mutation, route list, and single-file layout. Restyle sidebar/topbar only.
- Modify `src/pages/workspace-pages.tsx`: Restyle `DashboardPage`, `Metric`, `TaskTable`, `WorkflowBuilderPage`, `ExpenseCreatePage`, `LeaveCreatePage`, and the local create/new-form helpers. Import generated `CreateExpenseDto`, `CreateLeaveDto`, and `WorkflowStepResponseDto` types to remove `as never` casts on create payloads.
- Modify `src/components/data-table.tsx`: Restyle shared table surfaces only if the dashboard still uses this shared component after Task 7. Do not change its public props unless the dashboard is converted to a local table.

## Task 1: Baseline And Global Tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Capture the current baseline**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Expected: Each command exits 0 before source edits. If a command fails before edits, stop and record the exact failing file and message in the handoff before changing source.

- [ ] **Step 2: Replace global tokens**

In `src/index.css`, keep the existing reset structure and replace the current `:root` with this token set:

```css
:root {
  color-scheme: light;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;

  --background: #f6f6f1;
  --foreground: #18221e;
  --card: #ffffff;
  --card-foreground: #18221e;
  --popover: #ffffff;
  --popover-foreground: #18221e;
  --primary: #285c4d;
  --primary-foreground: #ffffff;
  --secondary: #eef1ea;
  --secondary-foreground: #243a33;
  --muted: #ecefe8;
  --muted-foreground: #68746f;
  --accent: #b7791f;
  --accent-foreground: #271a08;
  --destructive: #b42318;
  --destructive-foreground: #ffffff;
  --border: #d7ddd4;
  --input: #d7ddd4;
  --ring: #3f7b68;
  --radius: 0.5rem;

  --ink-1: var(--foreground);
  --ink-2: #33463f;
  --ink-3: #6a766f;
  --surface-2: #f1f3ed;
  --surface-3: #e7ebe4;
  --border-strong: #c7d0c5;
  --brand-soft: #e5eee8;
  --brand-emphasis: #204b3f;
  --accent-soft: #f4ecd8;
  --success: #2f7d4f;
  --success-soft: #e1f0e6;
  --warning: #b7791f;
  --warning-soft: #f5ead0;
  --info: #3d6f88;
}
```

Then update the `body` rule to use the compact operational baseline:

```css
body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: var(--foreground);
  background:
    linear-gradient(rgba(24, 34, 30, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(24, 34, 30, 0.03) 1px, transparent 1px),
    var(--background);
  background-size: 28px 28px;
  font-size: 14px;
  letter-spacing: 0;
}
```

- [ ] **Step 3: Verify token-only change**

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: update workflow design tokens"
```

## Task 2: First-Party Form Primitives

**Files:**
- Create: `src/components/form/index.tsx`
- Create: `src/components/form/form-primitives.test.tsx`

- [ ] **Step 1: Add a focused render test**

Create `src/components/form/form-primitives.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  FormCheckbox,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from './index'

describe('form primitives', () => {
  it('renders labels, helper text, errors, and controls', () => {
    render(
      <FormShell
        title="New request"
        kicker="Operations"
        description="Create a workflow request."
        actions={<button type="button">Action</button>}
      >
        <FormSection index="01" title="Details" hint="Required">
          <FormField label="Title" htmlFor="title" error="Title is required">
            <FormInput id="title" value="" onChange={() => undefined} />
          </FormField>
          <FormField label="Type" htmlFor="type" description="Pick one type.">
            <FormSelect id="type" value="annual" onChange={() => undefined}>
              <option value="annual">Annual</option>
            </FormSelect>
          </FormField>
          <FormField label="Reason" htmlFor="reason">
            <FormTextarea id="reason" value="Family event" onChange={() => undefined} />
          </FormField>
          <FormCheckbox label="Allow resubmission" checked onChange={() => undefined} />
        </FormSection>
      </FormShell>,
    )

    expect(screen.getByRole('heading', { name: 'New request' })).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Pick one type.')).toBeInTheDocument()
    expect(screen.getByLabelText('Allow resubmission')).toBeChecked()
  })
})
```

- [ ] **Step 2: Run the new test and confirm it fails**

Run:

```bash
npm run test -- src/components/form/form-primitives.test.tsx
```

Expected: FAIL because `src/components/form/index.tsx` does not exist.

- [ ] **Step 3: Create the primitives**

Create `src/components/form/index.tsx`:

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]"
      >
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {error ? <p className="text-xs text-[var(--destructive)]">{error}</p> : null}
    </div>
  )
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export function FormSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-[var(--input)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

type FormCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string
  description?: string
}

export function FormCheckbox({
  label,
  description,
  className,
  ...props
}: FormCheckboxProps) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-[var(--ink-2)]">
      <input
        type="checkbox"
        className={cn('mt-0.5 h-4 w-4 accent-[var(--primary)]', className)}
        {...props}
      />
      <span>
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="block text-xs leading-5 text-[var(--muted-foreground)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

type FormSectionProps = {
  index: string
  title: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  index,
  title,
  hint,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-end gap-2">
        <span className="font-mono text-[11px] text-[var(--ink-3)]">{index}</span>
        <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {hint ? (
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        {children}
      </div>
    </section>
  )
}

type FormShellProps = {
  kicker: string
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
}

export function FormShell({
  kicker,
  title,
  description,
  actions,
  children,
  aside,
}: FormShellProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
            {kicker}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </header>
      <div className={aside ? 'grid gap-6 lg:grid-cols-[1fr_320px]' : ''}>
        <div className="space-y-6">{children}</div>
        {aside ? <aside className="space-y-3">{aside}</aside> : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the new test**

Run:

```bash
npm run test -- src/components/form/form-primitives.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: Both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/form
git commit -m "feat: add workflow form primitives"
```

## Task 3: Public Auth Restyle

**Files:**
- Modify: `src/layouts/public-layout.tsx`
- Modify: `src/pages/auth-pages.tsx`

- [ ] **Step 1: Update the public layout visual shell**

In `src/layouts/public-layout.tsx`, import `useLocation` and make the right panel branch by pathname:

```tsx
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const authPanels = {
  signIn: {
    kicker: 'Runtime control',
    title: 'Approve work with a clear audit trail.',
    copy: 'Sign in to review tasks, route approvals, and keep expense, leave, payment, and event-schema activity visible.',
    className: 'from-[var(--brand-soft)] to-white',
  },
  signUp: {
    kicker: 'Configurable workflow',
    title: 'Model approval paths once, run them across ERP events.',
    copy: 'Create workflows for runtime tasks, audit history, expenses, leave, payments, and event schemas without changing backend behavior.',
    className: 'from-[var(--accent-soft)] to-white',
  },
} as const

export function PublicLayout({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const panel = location.pathname === '/sign-up' ? authPanels.signUp : authPanels.signIn

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[var(--background)] lg:grid-cols-[minmax(360px,500px)_1fr]">
      <section className="flex items-center justify-center px-5 py-8 sm:px-6 lg:px-10">
        {children ?? <Outlet />}
      </section>
      <section
        className={`hidden overflow-hidden bg-gradient-to-br ${panel.className} px-12 py-10 lg:flex lg:flex-col lg:justify-between`}
      >
        <Link to="/sign-in" className="text-lg font-semibold tracking-tight">
          ERP Workflow
        </Link>
        <div className="relative max-w-2xl">
          <div className="absolute -inset-8 rounded-[32px] border border-white/70 bg-white/35" />
          <div className="relative">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
              {panel.kicker}
            </p>
            <h1 className="text-5xl font-semibold leading-tight text-[var(--foreground)]">
              {panel.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-2)]">
              {panel.copy}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-[var(--ink-3)]">
          <div className="rounded-md border border-white/70 bg-white/50 p-3">Approvals</div>
          <div className="rounded-md border border-white/70 bg-white/50 p-3">Audit</div>
          <div className="rounded-md border border-white/70 bg-white/50 p-3">Runtime</div>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Switch auth pages to the new form primitives**

In `src/pages/auth-pages.tsx`, replace:

```tsx
import { FieldError, Input, Label } from '@/components/ui/form-controls'
```

with:

```tsx
import { FormField, FormInput } from '@/components/form'
```

Then replace each field block with the new primitive. Example for sign-in email:

```tsx
<form.Field name="email">
  {(field) => (
    <FormField
      label="Work email"
      htmlFor={field.name}
      error={fieldError(field.state.meta.errors)}
    >
      <FormInput
        id={field.name}
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </FormField>
  )}
</form.Field>
```

Use the same pattern for `password`, `name`, and sign-up `email`.

- [ ] **Step 3: Restyle `AuthPanel`**

Replace the returned JSX inside `AuthPanel` with:

```tsx
return (
  <div className="w-full max-w-[440px]">
    <p className="mb-3 inline-flex rounded-sm border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
      ERP Workflow
    </p>
    <div className="rounded-md border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <div className="mb-1.5 flex items-baseline justify-between gap-4">
          <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Email · Password
          </span>
        </div>
        <p className="text-[13px] leading-5 text-[var(--ink-3)]">{subtitle}</p>
      </div>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {children}
      <div className="mt-5 border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
        {footer}
      </div>
    </div>
  </div>
)
```

- [ ] **Step 4: Preserve auth behavior**

Confirm these lines still exist in `src/pages/auth-pages.tsx` after the restyle:

```tsx
login.mutate({ data: value })
signup.mutate({ data: value })
setAuthenticatedUser(user)
getDefaultPrivatePath(user?.roles ?? [])
apiErrorMessage(login.error)
apiErrorMessage(signup.error)
```

- [ ] **Step 5: Verify auth restyle**

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All commands exit 0.

Manual verification after starting the dev server in the final task:

- `/sign-in`: Compact auth card, sign-in panel copy, API error area still inside the card.
- `/sign-up`: Compact auth card, sign-up panel copy about workflow project capabilities, no slider.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/public-layout.tsx src/pages/auth-pages.tsx
git commit -m "style: restyle public auth screens"
```

## Task 4: Private Chrome Restyle

**Files:**
- Modify: `src/layouts/private-layout.tsx`

- [ ] **Step 1: Add route grouping metadata**

Replace `navItems` with grouped items while preserving current route targets and labels:

```tsx
const navGroups = [
  {
    label: 'Work',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-teal-600' },
      { to: '/workflow-templates', label: 'Workflow Builder', icon: Settings2, color: 'text-emerald-600' },
      { to: '/workflow-instances', label: 'Runtime', icon: Timer, color: 'text-sky-700' },
      { to: '/tasks', label: 'Approvals', icon: ClipboardCheck, color: 'text-amber-700' },
    ],
  },
  {
    label: 'Modules',
    items: [
      { to: '/expenses', label: 'Expenses', icon: Receipt, color: 'text-orange-700' },
      { to: '/leaves', label: 'Leaves', icon: FileText, color: 'text-lime-700' },
      { to: '/payments', label: 'Payments', icon: WalletCards, color: 'text-cyan-700' },
      { to: '/event-schemas', label: 'Event Schemas', icon: ScrollText, color: 'text-indigo-700' },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, color: 'text-violet-700' },
    ],
  },
] as const
```

- [ ] **Step 2: Restyle the layout grid, sidebar, nav rows, profile block, and topbar**

Keep the two existing `useEffect` blocks and the loading/session-required branches. Replace only the final return block with this structure:

```tsx
return (
  <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[244px_1fr]">
    <aside className="border-r border-[var(--border)] bg-[var(--card)] lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-16 items-center border-b border-[var(--border)] px-4">
        <Link to="/" className="rounded-md text-sm font-semibold tracking-tight">
          ERP Workflow
        </Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {navGroups.map((group) => (
          <div key={group.label} className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-1">
            <p className="hidden px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] lg:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex min-w-max items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition ${
                    active
                      ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                      : 'text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {active ? (
                    <span className="absolute bottom-1 left-1 top-1 hidden w-[3px] rounded-full bg-[var(--primary)] lg:block" />
                  ) : null}
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="hidden px-3 pb-4 lg:mt-auto lg:block">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="truncate text-sm font-medium">{user?.name ?? 'Signed in'}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {user?.email}
          </p>
        </div>
      </div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 backdrop-blur lg:px-7">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            Workflow operations
          </p>
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {user?.name ?? 'Signed in'}
          </p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {user?.email}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-7 lg:py-7">
        {children ?? <Outlet />}
      </main>
    </div>
  </div>
)
```

- [ ] **Step 3: Verify chrome behavior**

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All commands exit 0. Confirm the logout mutation and `useAuthControllerMe` session checks are unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/private-layout.tsx
git commit -m "style: restyle private app chrome"
```

## Task 5: New-Form Shell In `workspace-pages`

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Update imports**

Replace:

```tsx
import { Input, Label, Select, Textarea } from '@/components/ui/form-controls'
```

with:

```tsx
import {
  FormCheckbox,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from '@/components/form'
```

Add generated DTO imports to the existing `@/lib/api/gen` import group:

```tsx
import type {
  CreateExpenseDto,
  CreateLeaveDto,
  WorkflowStepResponseDto,
} from '@/lib/api/gen'
```

- [ ] **Step 2: Replace the local `Field` helper**

Replace the existing local `Field` function with this compatibility wrapper so the workflow builder can be restyled incrementally inside the same file:

```tsx
function Field({
  label,
  children,
  description,
}: {
  label: string
  children: React.ReactNode
  description?: string
}) {
  return (
    <FormField label={label} description={description}>
      {children}
    </FormField>
  )
}
```

- [ ] **Step 3: Add a small summary card helper near `CreatePanel`**

Add this local helper above `CreatePanel`:

```tsx
function SummaryCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-[var(--muted-foreground)]">{row.label}</span>
            <span className="text-right font-medium text-[var(--foreground)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace `CreatePanel`**

Replace `CreatePanel` with:

```tsx
function CreatePanel({
  title,
  kicker,
  description,
  children,
  aside,
  error,
  onSubmit,
  submitLabel = 'Save',
}: {
  title: string
  kicker: string
  description: string
  children: React.ReactNode
  aside?: React.ReactNode
  error: unknown
  onSubmit: () => void
  submitLabel?: string
}) {
  return (
    <FormShell
      kicker={kicker}
      title={title}
      description={description}
      aside={aside}
    >
      <ErrorNotice error={error} />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {children}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-[var(--ink-3)]">
            API payload and navigation stay unchanged.
          </p>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </FormShell>
  )
}
```

- [ ] **Step 5: Verify helper-only changes**

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "style: add workflow form shell"
```

## Task 6: Restyle Workflow Builder New Route

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Replace the workflow builder outer structure**

In `WorkflowBuilderPage`, replace the fragment content with this structure while keeping `createWizard.mutate({ data: toWorkflowWizardPayload(draft) })` unchanged:

```tsx
<FormShell
  kicker="Workflow templates"
  title="Create workflow"
  description="Seven-step workflow configuration from module event to final outcomes."
  actions={
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-3)]">
        Step {step} of 7
      </span>
    </div>
  }
  aside={
    <SummaryCard
      title="Template preview"
      rows={[
        { label: 'Name', value: draft.template.name || 'Untitled' },
        { label: 'Module', value: draft.template.moduleName },
        { label: 'Event', value: draft.template.eventName },
        { label: 'Rules', value: draft.rules.length },
        { label: 'Status', value: draft.template.status },
      ]}
    />
  }
>
  <ErrorNotice error={createWizard.error} />
  <div className="flex flex-wrap gap-1.5">
    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
      <button
        key={item}
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${
          step === item
            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
            : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
        }`}
        onClick={() => setStep(item)}
      >
        <span className="font-mono text-[10.5px]">{String(item).padStart(2, '0')}</span>
        Step
      </button>
    ))}
  </div>
  <div className="rounded-md border border-[var(--border)] bg-white p-4">
    {step === 1 ? <BasicInfo draft={draft} setDraft={setDraft} /> : null}
    {step === 2 ? <ModuleEvent draft={draft} setDraft={setDraft} /> : null}
    {step === 3 ? <TriggerConditions draft={draft} setDraft={setDraft} /> : null}
    {step === 4 ? <ApprovalRules draft={draft} setDraft={setDraft} /> : null}
    {step === 5 ? <ApprovalSteps draft={draft} setDraft={setDraft} /> : null}
    {step === 6 ? <Outcomes draft={draft} setDraft={setDraft} /> : null}
    {step === 7 ? <ReviewWorkflow draft={draft} /> : null}
    <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-4">
      <Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
        Back
      </Button>
      {step < 7 ? (
        <Button type="button" onClick={() => setStep(step + 1)}>
          Next
        </Button>
      ) : (
        <Button
          type="button"
          disabled={!draft.template.name || createWizard.isPending}
          onClick={() =>
            createWizard.mutate({ data: toWorkflowWizardPayload(draft) })
          }
        >
          Save workflow
        </Button>
      )}
    </div>
  </div>
</FormShell>
```

- [ ] **Step 2: Swap controls inside builder sections**

Inside `BasicInfo`, `ModuleEvent`, `TriggerConditions`, `ApprovalRules`, `ApprovalSteps`, and `Outcomes`, replace `Input`, `Select`, `Textarea`, and raw checkbox labels with `FormInput`, `FormSelect`, `FormTextarea`, and `FormCheckbox`.

Example conversion:

```tsx
<Field label="Workflow Name">
  <FormInput
    value={draft.template.name}
    onChange={(event) =>
      setDraft({
        ...draft,
        template: { ...draft.template, name: event.target.value },
      })
    }
  />
</Field>
```

Example checkbox conversion:

```tsx
<FormCheckbox
  label="Allow resubmission after rejection"
  checked={draft.template.allowResubmission}
  onChange={(event) =>
    setDraft({
      ...draft,
      template: {
        ...draft.template,
        allowResubmission: event.target.checked,
      },
    })
  }
/>
```

- [ ] **Step 3: Verify workflow payload behavior**

Run:

```bash
npm run test -- src/features/workflows/workflow-builder.test.ts
npm run typecheck
npm run lint
```

Expected: All commands exit 0. The workflow builder payload test must still pass because payload creation is unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "style: restyle workflow builder form"
```

## Task 7: Restyle Expense And Leave New Routes

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Type expense state and payload**

In `ExpenseCreatePage`, type the form state and replace the `as never` create payload with a `CreateExpenseDto`:

```tsx
const [form, setForm] = useState({
  title: '',
  amount: 0,
  category: '',
  description: '',
  currency: 'BDT',
  vendor: '',
})

const expensePayload: CreateExpenseDto = {
  title: form.title,
  amount: form.amount,
  category: form.category,
  currency: form.currency,
  description: form.description ? { text: form.description } : undefined,
  vendor: form.vendor ? { name: form.vendor } : undefined,
}
```

Use this payload in submit:

```tsx
onSubmit={() => createExpense.mutate({ data: expensePayload })}
```

- [ ] **Step 2: Replace expense create JSX**

Replace the `ExpenseCreatePage` return with:

```tsx
return (
  <CreatePanel
    title="New expense"
    kicker="Expense request"
    description="Capture request details, vendor context, and notes before submitting for approval."
    error={createExpense.error}
    onSubmit={() => createExpense.mutate({ data: expensePayload })}
    submitLabel={createExpense.isPending ? 'Saving...' : 'Save expense'}
    aside={
      <SummaryCard
        title="Expense preview"
        rows={[
          { label: 'Title', value: form.title || 'Untitled' },
          { label: 'Amount', value: `${form.amount || 0} ${form.currency}` },
          { label: 'Category', value: form.category || '-' },
          { label: 'Vendor', value: form.vendor || '-' },
        ]}
      />
    }
  >
    <FormSection index="01" title="Expense details" hint="Required for approval routing.">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Title">
          <FormInput
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </FormField>
        <FormField label="Amount">
          <FormInput
            type="number"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
          />
        </FormField>
        <FormField label="Currency">
          <FormInput
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
          />
        </FormField>
      </div>
    </FormSection>
    <FormSection index="02" title="Vendor and category">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Category">
          <FormInput
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
        </FormField>
        <FormField label="Vendor">
          <FormInput
            value={form.vendor}
            onChange={(event) => setForm({ ...form, vendor: event.target.value })}
          />
        </FormField>
      </div>
    </FormSection>
    <FormSection index="03" title="Notes">
      <FormField label="Description">
        <FormTextarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </FormField>
    </FormSection>
  </CreatePanel>
)
```

- [ ] **Step 3: Type leave state and payload**

In `LeaveCreatePage`, replace the `as never` create payload with a `CreateLeaveDto`:

```tsx
const leavePayload: CreateLeaveDto = {
  leaveType: form.leaveType,
  leaveDays: form.leaveDays,
  startDate: form.startDate,
  endDate: form.endDate,
  reason: form.reason ? { text: form.reason } : undefined,
}
```

Use this payload in submit:

```tsx
onSubmit={() => createLeave.mutate({ data: leavePayload })}
```

- [ ] **Step 4: Replace leave create JSX**

Replace the `LeaveCreatePage` return with:

```tsx
return (
  <CreatePanel
    title="New leave"
    kicker="Leave request"
    description="Capture leave type, dates, duration, and reason before sending through workflow."
    error={createLeave.error}
    onSubmit={() => createLeave.mutate({ data: leavePayload })}
    submitLabel={createLeave.isPending ? 'Saving...' : 'Save leave'}
    aside={
      <SummaryCard
        title="Leave preview"
        rows={[
          { label: 'Type', value: form.leaveType },
          { label: 'Days', value: form.leaveDays },
          { label: 'Start', value: form.startDate || '-' },
          { label: 'End', value: form.endDate || '-' },
        ]}
      />
    }
  >
    <FormSection index="01" title="Leave type">
      <FormField label="Type">
        <FormSelect
          value={form.leaveType}
          onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
        >
          <option value="ANNUAL">Annual</option>
          <option value="SICK">Sick</option>
          <option value="CASUAL">Casual</option>
          <option value="UNPAID">Unpaid</option>
        </FormSelect>
      </FormField>
    </FormSection>
    <FormSection index="02" title="Dates and duration">
      <div className="grid gap-3 md:grid-cols-3">
        <FormField label="Start date">
          <FormInput
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />
        </FormField>
        <FormField label="End date">
          <FormInput
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
        </FormField>
        <FormField label="Leave days">
          <FormInput
            type="number"
            value={form.leaveDays}
            onChange={(event) => setForm({ ...form, leaveDays: Number(event.target.value) })}
          />
        </FormField>
      </div>
    </FormSection>
    <FormSection index="03" title="Reason">
      <FormField label="Reason">
        <FormTextarea
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
        />
      </FormField>
    </FormSection>
  </CreatePanel>
)
```

- [ ] **Step 5: Verify create payload typing and route behavior**

Run:

```bash
rg "as never" src --glob '!lib/api/gen/**'
npm run typecheck
npm run lint
npm run test
```

Expected: `rg` prints no matches. All npm commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "style: restyle request creation forms"
```

## Task 8: Dashboard And Pending Approvals Table

**Files:**
- Modify: `src/pages/workspace-pages.tsx`
- Modify: `src/components/data-table.tsx` only if the dashboard still renders through `DataTable`

- [ ] **Step 1: Add dashboard filter state**

Inside `DashboardPage`, add local filter state after the API data constants:

```tsx
const [statusFilter, setStatusFilter] = useState('all')
const [query, setQuery] = useState('')
const pendingRows = (unwrapData(pending.data) as WorkflowStepResponseDto[] | undefined) ?? []
const filteredPendingRows = pendingRows.filter((row) => {
  const matchesStatus = statusFilter === 'all' || row.status === statusFilter
  const searchable = [
    row.stepName,
    row.stepType,
    row.assigneeType,
    row.status,
    formatValue(row.assignedRoleSlug),
    formatValue(row.assignedUserId),
  ]
    .join(' ')
    .toLowerCase()
  return matchesStatus && searchable.includes(query.toLowerCase())
})
```

- [ ] **Step 2: Replace metric cards with compact operational cards**

Update `Metric` to:

```tsx
function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number | undefined
  tone?: 'default' | 'success' | 'warning'
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[var(--success-soft)]'
      : tone === 'warning'
        ? 'bg-[var(--warning-soft)]'
        : 'bg-[var(--surface-2)]'

  return (
    <div className={`rounded-md border border-transparent ${toneClass} p-4`}>
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value ?? '-'}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Replace dashboard JSX**

Replace the current `DashboardPage` return with:

```tsx
return (
  <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
          Operations
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">
          Dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
          Role-aware operational summary across workflow configuration, approvals, HR, and accounts.
        </p>
      </div>
    </header>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Published workflows" value={adminData?.workflows?.active} tone="success" />
      <Metric label="Pending approvals" value={approverData?.pendingTasks} tone="warning" />
      <Metric label="Expense drafts" value={employeeData?.expenses?.draft} />
      <Metric label="Pending payments" value={accountsData?.pendingPayments} tone="warning" />
      <Metric label="HR leave tasks" value={hrData?.leaveTasks} />
      <Metric label="Failed triggers" value={adminData?.failedTriggers} tone="warning" />
      <Metric label="Acted tasks" value={approverData?.actedTasks} tone="success" />
      <Metric label="Leave under review" value={employeeData?.leaves?.underReview} />
    </div>
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
            Pending approvals
          </p>
          <h2 className="text-lg font-semibold tracking-tight">My approval queue</h2>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'ACTIVE', 'WAITING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${
              statusFilter === status
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {status === 'all' ? 'All' : status.replaceAll('_', ' ')}
          </button>
        ))}
        <div className="ml-0 flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 sm:ml-auto sm:max-w-[280px]">
          <FormInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search task, type, assignee"
            className="h-7 border-0 px-0 focus:ring-0"
          />
        </div>
      </div>
      <TaskTable rows={filteredPendingRows} />
    </section>
  </div>
)
```

- [ ] **Step 4: Update `TaskTable` typing and compact row styles**

Change the signature to accept workflow step rows where possible:

```tsx
function TaskTable({
  rows,
  withActions = false,
}: {
  rows: Array<Row | WorkflowStepResponseDto>
  withActions?: boolean
}) {
```

Keep the existing action mutations. Replace the action input with `FormInput`:

```tsx
<FormInput
  placeholder="Comment or rejection reason"
  value={comment}
  onChange={(event) => setComment(event.target.value)}
/>
```

Leave `TaskTable` on `DataTable` unless converting it to a local responsive list is necessary during visual QA.

- [ ] **Step 5: Restyle `DataTable` if dashboard still uses it**

In `src/components/data-table.tsx`, keep the same props and table behavior. Change only classes:

```tsx
<div className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
      <thead className="bg-[var(--surface-2)]">
```

Use compact header and row classes:

```tsx
className="px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
```

```tsx
<tr key={row.id} className="border-t border-[var(--border)] transition hover:bg-[var(--surface-2)]">
```

```tsx
<td key={cell.id} className="px-4 py-2.5 align-top text-[13px]">
```

- [ ] **Step 6: Verify dashboard**

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/pages/workspace-pages.tsx src/components/data-table.tsx
git commit -m "style: restyle dashboard approval queue"
```

## Task 9: Constraint Scan And Build Verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Scan for forbidden source escapes**

Run:

```bash
rg "eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|as never|\\bany\\b" src --glob '!lib/api/gen/**'
```

Expected: No matches in first-party source outside `src/lib/api/gen`.

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Expected: All commands exit 0.

- [ ] **Step 3: Start the dev server for manual visual verification**

Run:

```bash
npm run dev -- --host 0.0.0.0
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`. If port 5173 is busy, use the URL Vite prints.

- [ ] **Step 4: Manually verify scoped routes**

Open these routes in the browser:

- `/sign-in`
- `/sign-up`
- `/`
- `/workflow-templates/new`
- `/expenses/new`
- `/leaves/new`

Expected:

- Auth pages use compact cards, in-card API errors, and distinct right-panel copy/treatment.
- Private chrome has grouped nav rows, active left rail on desktop, compact sticky topbar, and a bottom user block.
- Workflow builder keeps all seven steps, can move forward and back, and still saves through `toWorkflowWizardPayload(draft)`.
- Expense and leave forms keep create navigation to `/expenses` and `/leaves`.
- Dashboard uses existing dashboard and pending-task hooks, metric cards, status filters, search, compact approval table/list, and readable empty state.

- [ ] **Step 5: Final commit**

```bash
git status --short
git add src/index.css src/components/form src/pages/auth-pages.tsx src/layouts/public-layout.tsx src/layouts/private-layout.tsx src/pages/workspace-pages.tsx src/components/data-table.tsx
git commit -m "style: apply workflow UI restyle"
```

If every earlier task has already been committed, skip the final commit and leave the working tree clean.

## Self-Review Checklist

- Spec coverage:
  - Global styling: Task 1.
  - Public auth and public layout: Task 3.
  - Private sidebar/topbar: Task 4.
  - Shared first-party form components: Task 2.
  - `/workflow-templates/new`: Task 6.
  - `/expenses/new` and `/leaves/new`: Task 7.
  - Dashboard metrics, filters, search, pending approval table/list: Task 8.
  - No API contract changes and generated hooks retained: Tasks 3, 4, 6, 7, and 8.
  - Verification commands and manual routes: Task 9.
- Placeholder scan:
  - No placeholder markers or deferred-work phrasing.
  - Every changed file has exact path references.
  - Code-changing steps include concrete snippets.
- Type consistency:
  - `CreateExpenseDto`, `CreateLeaveDto`, and `WorkflowStepResponseDto` are imported from `@/lib/api/gen`.
  - New source avoids `any`, `as never`, TypeScript suppression comments, non-null assertions, and ESLint disable comments.
  - Generated API files remain untouched.
