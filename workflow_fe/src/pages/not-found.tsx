import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          The requested workflow screen does not exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
