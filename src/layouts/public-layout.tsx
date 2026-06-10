import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[var(--background)] lg:grid-cols-[minmax(360px,480px)_1fr]">
      <section className="flex items-center justify-center px-6 py-10">
        {children ?? <Outlet />}
      </section>
      <section className="hidden bg-[#dfeae3] px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <Link to="/sign-in" className="text-lg font-semibold">
          ERP Workflow
        </Link>
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase text-[#53635a]">
            Configurable approval runtime
          </p>
          <h1 className="text-5xl font-semibold leading-tight text-[#17201c]">
            Configure approval paths once, execute them across modules.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#47564e]">
            Build workflows for expenses, leave, payments, and future ERP
            events with dynamic rules, reviewer assignment, audit history, and
            runtime approvals.
          </p>
        </div>
      </section>
    </main>
  )
}
