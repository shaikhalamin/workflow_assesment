import type { ComponentType } from 'react'

import { PrivateLayout } from '@/layouts/private-layout'
import { PublicLayout } from '@/layouts/public-layout'
import { useAuthStore } from '@/stores/auth-store'

export function shellAware<P extends object>(
  Private: ComponentType<P>,
  Public: ComponentType<P>,
) {
  return function Dispatch(props: P) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    return isAuthenticated ? (
      <PrivateLayout>
        <Private {...props} />
      </PrivateLayout>
    ) : (
      <PublicLayout>
        <Public {...props} />
      </PublicLayout>
    )
  }
}
