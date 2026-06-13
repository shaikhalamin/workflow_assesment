import { createFileRoute, redirect } from '@tanstack/react-router'

import { canAccessPrivatePath } from '@/features/auth/auth-routing'
import { PrivateLayout } from '@/layouts/private-layout'
import { useAuthStore } from '@/stores/auth-store'

function requireAuth({ location }: { location: { pathname: string } }) {
  const auth = useAuthStore.getState()

  if (!auth.isAuthenticated) {
    throw redirect({
      to: '/sign-in',
      search: { redirect: location.pathname },
    })
  }

  if (
    location.pathname !== '/' &&
    !canAccessPrivatePath(
      location.pathname,
      auth.user?.roles ?? [],
      auth.user?.permissions ?? [],
    )
  ) {
    throw redirect({ to: '/' })
  }
}

export const Route = createFileRoute('/_private')({
  beforeLoad: requireAuth,
  component: PrivateLayout,
})
