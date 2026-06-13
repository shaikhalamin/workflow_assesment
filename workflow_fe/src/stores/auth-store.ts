import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthUserDto } from '@/lib/api/gen'

type AuthState = {
  isAuthenticated: boolean
  user: AuthUserDto | null
  login: (user: AuthUserDto) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'workflow-auth',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
