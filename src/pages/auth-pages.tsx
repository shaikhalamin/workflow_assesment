import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod/v4'

import { useAuthControllerLogin } from '@/lib/api/gen'
import { useAuthControllerSignup } from '@/lib/api/gen'
import { loginDtoSchema, signupDtoSchema } from '@/lib/api/gen'
import { FormField, FormInput } from '@/components/form'
import { Button } from '@/components/ui/button'
import { getDefaultPrivatePath } from '@/features/auth/auth-routing'
import { apiErrorMessage, unwrapData } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = loginDtoSchema.extend({
  email: z.email(),
  password: z.string().min(8),
})

const signupSchema = signupDtoSchema.extend({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
})

function fieldError(errors: unknown[]) {
  return errors
    .map((error) =>
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error),
    )
    .join(', ')
}

export function SignInPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const queryClient = useQueryClient()
  const setAuthenticatedUser = useAuthStore((state) => state.login)
  const login = useAuthControllerLogin({
    mutation: {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries()
        const user = unwrapData(response)?.user
        if (user) setAuthenticatedUser(user)
        await navigate({
          to:
            search.redirect ||
            getDefaultPrivatePath(user?.roles ?? [], user?.permissions ?? []),
          replace: true,
        })
      },
    },
  })
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: ({ value }) => {
      login.mutate({ data: value })
    },
  })

  return (
    <AuthPanel
      title="Sign in"
      subtitle="Use your workflow account to continue."
      footer={
        <>
          New here?{' '}
          <Link to="/sign-up" className="font-medium text-[var(--primary)]">
            Create an account
          </Link>
        </>
      }
      error={login.error ? apiErrorMessage(login.error) : undefined}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
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
        <form.Field name="password">
          {(field) => (
            <FormField
              label="Password"
              htmlFor={field.name}
              error={fieldError(field.state.meta.errors)}
            >
              <FormInput
                id={field.name}
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthPanel>
  )
}

export function SignUpPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuthenticatedUser = useAuthStore((state) => state.login)
  const signup = useAuthControllerSignup({
    mutation: {
      onSuccess: async (response) => {
        await queryClient.invalidateQueries()
        const user = unwrapData(response)?.user
        if (user) setAuthenticatedUser(user)
        await navigate({
          to: getDefaultPrivatePath(user?.roles ?? [], user?.permissions ?? []),
          replace: true,
        })
      },
    },
  })
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validators: {
      onSubmit: signupSchema,
    },
    onSubmit: ({ value }) => {
      signup.mutate({ data: value })
    },
  })

  return (
    <AuthPanel
      title="Create account"
      subtitle="Signup creates an employee account and starts a cookie session."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-[var(--primary)]">
            Sign in
          </Link>
        </>
      }
      error={signup.error ? apiErrorMessage(signup.error) : undefined}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field name="name">
          {(field) => (
            <FormField
              label="Name"
              htmlFor={field.name}
              error={fieldError(field.state.meta.errors)}
            >
              <FormInput
                id={field.name}
                autoComplete="name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </FormField>
          )}
        </form.Field>
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
        <form.Field name="password">
          {(field) => (
            <FormField
              label="Password"
              htmlFor={field.name}
              error={fieldError(field.state.meta.errors)}
            >
              <FormInput
                id={field.name}
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <Button type="submit" className="w-full" disabled={signup.isPending}>
          Sign up
        </Button>
      </form>
    </AuthPanel>
  )
}

function AuthPanel({
  title,
  subtitle,
  children,
  footer,
  error,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
  error?: string
}) {
  return (
    <div className="w-full max-w-[440px] min-w-0">
      <p className="mb-3 inline-flex rounded-sm border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
        ERP Workflow
      </p>
      <div className="rounded-md border border-[var(--border)] bg-white p-4 shadow-sm sm:p-8">
        <div className="mb-5 min-w-0">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="min-w-0 text-[22px] font-semibold tracking-tight sm:text-[24px]">
              {title}
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-foreground)] sm:text-[10.5px]">
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
}
