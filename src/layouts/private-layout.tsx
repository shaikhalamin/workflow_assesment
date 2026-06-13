import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ScrollText,
  Settings2,
  ShieldCheck,
  Timer,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

import type { NotificationResponseDto } from '@/lib/api/gen'
import {
  useAuthControllerLogout,
  useAuthControllerMe,
  useNotificationsControllerList,
  useNotificationsControllerMarkRead,
} from '@/lib/api/gen'
import { Button } from '@/components/ui/button'
import { canAccessPrivatePath } from '@/features/auth/auth-routing'
import { apiErrorMessage, unwrapData } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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
    label: 'Administration',
    items: [
      {
        to: '/permissions',
        label: 'Permissions',
        icon: ShieldCheck,
        color: 'text-emerald-700',
      },
    ],
  },
  {
    label: 'Modules',
    items: [
      { to: '/expenses', label: 'Expenses', icon: Receipt, color: 'text-orange-700' },
      { to: '/leaves', label: 'Leaves', icon: FileText, color: 'text-lime-700' },
      { to: '/billing', label: 'Billing', icon: ScrollText, color: 'text-rose-700' },
      { to: '/invoices', label: 'Invoices', icon: FileText, color: 'text-blue-700' },
      { to: '/payments', label: 'Payments', icon: WalletCards, color: 'text-cyan-700' },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, color: 'text-violet-700' },
    ],
  },
] as const

export function PrivateLayout({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState<
    NotificationResponseDto[]
  >([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    string[]
  >([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const notificationMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const setAuthenticatedUser = useAuthStore((state) => state.login)
  const clearAuthenticatedUser = useAuthStore((state) => state.logout)
  const meQuery = useAuthControllerMe({
    query: { retry: false },
  })
  const logoutMutation = useAuthControllerLogout()
  const user = unwrapData(meQuery.data)?.user
  const unreadNotificationsQuery = useNotificationsControllerList(
    { params: { unreadOnly: true } },
    { query: { enabled: Boolean(user), retry: false } },
  )
  const unreadNotifications = unreadNotificationsQuery.data?.data
  const markNotificationRead = useNotificationsControllerMarkRead()
  const notifications = useMemo(() => {
    const merged = [...liveNotifications]

    for (const notification of unreadNotifications ?? []) {
      if (!merged.some((item) => item.id === notification.id)) {
        merged.push(notification)
      }
    }

    return merged.filter(
      (notification) => !dismissedNotificationIds.includes(notification.id),
    )
  }, [dismissedNotificationIds, liveNotifications, unreadNotifications])
  const isPublicPath =
    location.pathname === '/sign-in' || location.pathname === '/sign-up'

  const handleLogout = () => {
    setUserMenuOpen(false)
    setNotificationMenuOpen(false)
    logoutMutation.mutate()
    queryClient.clear()
    clearAuthenticatedUser()
    void navigate({ to: '/sign-in' })
  }

  const handleNotificationClick = (notification: NotificationResponseDto) => {
    setDismissedNotificationIds((ids) => [...ids, notification.id])
    setLiveNotifications((items) =>
      items.filter((item) => item.id !== notification.id),
    )
    setNotificationMenuOpen(false)
    markNotificationRead.mutate({ id: notification.id })

    if (notification.entityType === 'Expense') {
      void navigate({
        to: '/expenses/$expenseId',
        params: { expenseId: notification.entityId },
      })
      return
    }

    if (notification.entityType === 'BillingRequest') {
      void navigate({
        to: '/billing/$billingId',
        params: { billingId: notification.entityId },
      })
      return
    }

    if (notification.entityType === 'LeaveRequest') {
      void navigate({
        to: '/leaves/$leaveId',
        params: { leaveId: notification.entityId },
      })
      return
    }

    if (notification.workflowInstanceId) {
      void navigate({
        to: '/workflow-instances/$instanceId',
        params: { instanceId: notification.workflowInstanceId },
      })
    }
  }

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

  useEffect(() => {
    if (!user) return

    const socket = io(`${API_BASE_URL}/notifications`, {
      withCredentials: true,
    })

    socket.on('notification', (notification: NotificationResponseDto) => {
      setLiveNotifications((items) => [
        notification,
        ...items.filter((item) => item.id !== notification.id),
      ])
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (!mobileSidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileSidebarOpen])

  useEffect(() => {
    if (!notificationMenuOpen && !userMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) return
      if (notificationMenuRef.current?.contains(target)) return
      if (userMenuRef.current?.contains(target)) return

      setNotificationMenuOpen(false)
      setUserMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [notificationMenuOpen, userMenuOpen])

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

  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#020817]/40 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface-2)] transition-transform duration-200 ease-out xl:sticky xl:top-0 xl:h-screen xl:w-[232px] xl:translate-x-0 xl:transition-none ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-[var(--border)] px-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#07111f] text-[11px] font-bold text-white">
              IW
            </span>
            <span>
              <span className="block leading-4">WorkflowIQ</span>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                ERP · Approvals
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            className="ml-auto grid h-8 w-8 place-items-center rounded-md text-[var(--ink-3)] hover:bg-[var(--surface-3)] xl:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 overflow-visible p-3">
          {navGroups.map((group) => (
            <div key={group.label} className="flex min-w-0 flex-col gap-1">
              <p className="px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                {group.label}
              </p>
              {group.items
                .filter((item) =>
                  canAccessPrivatePath(
                    item.to,
                    user?.roles ?? [],
                    user?.permissions ?? [],
                  ),
                )
                .map((item) => {
                  const Icon = item.icon
                  const active =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`relative flex min-w-max items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition ${
                        active
                          ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                          : 'text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {active ? (
                        <span className="absolute bottom-1 left-1 top-1 w-[3px] rounded-full bg-[var(--primary)]" />
                      ) : null}
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      {item.label}
                    </Link>
                  )
                })}
            </div>
          ))}
        </nav>
        <div className="mt-auto px-3 pb-4">
          <div className="rounded-md border border-[var(--border)] bg-white p-3">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Signed in'}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
              {user?.email}
            </p>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b border-[var(--border)] bg-white/95 px-3 backdrop-blur lg:gap-3 lg:px-7 xl:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="xl:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center justify-end gap-1 lg:gap-3">
            <div ref={notificationMenuRef} className="relative">
              <button
                type="button"
                className="relative grid h-9 w-9 place-items-center rounded-md border border-transparent text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                aria-label={`Notifications ${notifications.length}`}
                aria-expanded={notificationMenuOpen}
                onClick={() => setNotificationMenuOpen((open) => !open)}
              >
                <Bell className="h-4 w-4" />
                {notifications.length ? (
                  <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
                    {notifications.length}
                  </span>
                ) : null}
              </button>
              {notificationMenuOpen ? (
                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
                  {notifications.length ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className="flex w-full flex-col gap-1 rounded px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {notification.title}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {notification.message}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                      No notifications
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:bg-[var(--surface-2)]"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-emphasis)]">
                  {initials}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-xs font-semibold text-[var(--foreground)]">
                    {user?.name ?? 'Signed in'}
                  </span>
                  <span className="block max-w-[180px] truncate text-[11px] text-[var(--muted-foreground)]">
                    {user?.email}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="w-full px-4 py-5 lg:px-7 lg:py-7">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
