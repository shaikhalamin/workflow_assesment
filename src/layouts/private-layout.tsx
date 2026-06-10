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

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workflow-templates', label: 'Workflow Builder', icon: Settings2 },
  { to: '/workflow-instances', label: 'Runtime', icon: Timer },
  { to: '/tasks', label: 'Approvals', icon: ClipboardCheck },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/leaves', label: 'Leaves', icon: FileText },
  { to: '/payments', label: 'Payments', icon: WalletCards },
  { to: '/event-schemas', label: 'Event Schemas', icon: ScrollText },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
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
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-[var(--border)] bg-white">
        <div className="flex h-16 items-center border-b border-[var(--border)] px-5">
          <Link to="/" className="font-semibold">
            ERP Workflow
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[#405149] hover:bg-[var(--muted)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate font-medium">{user?.name ?? 'Signed in'}</p>
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
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
