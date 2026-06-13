import { createFileRoute } from '@tanstack/react-router'

import { SignInPage } from '@/pages/auth-pages'

export const Route = createFileRoute('/_public/sign-in')({
  component: SignInPage,
})
