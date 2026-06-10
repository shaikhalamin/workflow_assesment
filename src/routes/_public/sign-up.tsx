import { createFileRoute } from '@tanstack/react-router'

import { SignUpPage } from '@/pages/auth-pages'

export const Route = createFileRoute('/_public/sign-up')({
  component: SignUpPage,
})
