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
