import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'

function reportError() {
  // Connect application error reporting here.
}

export function CrashPrivateScreen({ error }: { error?: unknown }) {
  useEffect(() => {
    if (error) reportError()
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Please try reloading the page.
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
