import { createFileRoute, redirect } from '@tanstack/react-router'

import { PrivateLayout } from '@/layouts/private-layout'
import { useAuthStore } from '@/stores/auth-store'

function requireAuth({ location }: { location: { pathname: string } }) {
  if (!useAuthStore.getState().isAuthenticated) {
    throw redirect({
      to: '/sign-in',
      search: { redirect: location.pathname },
    })
  }
}

export const Route = createFileRoute('/_private')({
  beforeLoad: requireAuth,
  component: PrivateLayout,
})
