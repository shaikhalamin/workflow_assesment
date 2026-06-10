import { createRootRoute } from '@tanstack/react-router'

import { CrashPrivateScreen } from '@/features/errors/crash-private-screen'
import { CrashPublicScreen } from '@/features/errors/crash-public-screen'
import { RootComponent } from '@/features/chrome/root-component'
import { NotFoundPrivateScreen } from '@/features/errors/not-found-private-screen'
import { NotFoundPublicScreen } from '@/features/errors/not-found-public-screen'
import { shellAware } from '@/features/chrome/shell-aware'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: shellAware(NotFoundPrivateScreen, NotFoundPublicScreen),
  errorComponent: shellAware(CrashPrivateScreen, CrashPublicScreen),
})
