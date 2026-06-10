import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'

function reportError() {
  // Connect application error reporting here.
}

export function CrashPublicScreen({ error }: { error?: unknown }) {
  useEffect(() => {
    if (error) reportError()
  }, [error])

  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Please try reloading the page.
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
