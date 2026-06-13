import { Link } from '@tanstack/react-router'

export function NotFoundPrivateScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        That workflow screen does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex h-10 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
