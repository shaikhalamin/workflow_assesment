import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  ScrollText,
  Settings2,
  Timer,
  WalletCards,
} from 'lucide-react'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuthControllerLogout } from '@/lib/api/gen'
import { useAuthControllerMe } from '@/lib/api/gen'
import { Button } from '@/components/ui/button'
import { apiErrorMessage, unwrapData } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

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

export function PrivateLayout({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuthenticatedUser = useAuthStore((state) => state.login)
  const clearAuthenticatedUser = useAuthStore((state) => state.logout)
  const meQuery = useAuthControllerMe({
    query: { retry: false },
  })
  const logoutMutation = useAuthControllerLogout({
    mutation: {
      onSuccess: async () => {
        await queryClient.clear()
        clearAuthenticatedUser()
        await navigate({ to: '/sign-in' })
      },
    },
  })
  const user = unwrapData(meQuery.data)?.user
  const isPublicPath =
    location.pathname === '/sign-in' || location.pathname === '/sign-up'

  useEffect(() => {
    if (meQuery.isError && !isPublicPath) {
      clearAuthenticatedUser()
      void navigate({
        to: '/sign-in',
        search: { redirect: location.pathname },
        replace: true,
      })
    }
  }, [
    clearAuthenticatedUser,
    isPublicPath,
    location.pathname,
    meQuery.isError,
    navigate,
  ])

  useEffect(() => {
    if (user) setAuthenticatedUser(user)
  }, [setAuthenticatedUser, user])

  if (!user && !meQuery.isError) {
    return (
      <main className="grid min-h-screen place-items-center text-[var(--muted-foreground)]">
        Checking session...
      </main>
    )
  }

  if (meQuery.isError && !isPublicPath) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-medium">Session required</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {apiErrorMessage(meQuery.error)}
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="border-r border-[var(--border)] bg-[var(--card)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
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
}
