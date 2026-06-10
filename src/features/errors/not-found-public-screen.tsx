import { Link } from '@tanstack/react-router'

export function NotFoundPublicScreen() {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        That page does not exist.
      </p>
      <Link
        to="/sign-in"
        className="inline-flex h-10 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white"
      >
        Sign in
      </Link>
    </div>
  )
}
