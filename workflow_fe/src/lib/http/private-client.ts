import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const ME_URL = '/api/auth/me'
const REFRESH_URL = '/api/auth/refresh'

export const privateClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 15_000,
  withCredentials: true,
})

let refreshInFlight: Promise<void> | null = null
let meRefreshInFlight: Promise<void> | null = null

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isAuthUserDto(value: unknown): value is AuthUserDto {
  if (!value || typeof value !== 'object') return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    isStringArray(user.roles) &&
    isStringArray(user.permissions)
  )
}

function refreshMeOnce(): Promise<void> {
  if (!meRefreshInFlight) {
    meRefreshInFlight = axios
      .get(ME_URL, {
        withCredentials: true,
        timeout: 15_000,
      })
      .then((response: { data?: { data?: { user?: unknown } } }) => {
        const user = response.data?.data?.user
        if (isAuthUserDto(user)) useAuthStore.getState().login(user)
      })
      .finally(() => {
        meRefreshInFlight = null
      })
  }

  return meRefreshInFlight
}

function refreshOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(
        REFRESH_URL,
        {},
        {
          withCredentials: true,
          timeout: 15_000,
        },
      )
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

privateClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    const isMeCall = url.endsWith('/auth/me')
    const isRefreshCall = url.endsWith('/auth/refresh')

    if (status === 403 && original && !isMeCall) {
      await refreshMeOnce().catch(() => undefined)
      return Promise.reject(error)
    }

    if (status !== 401 || !original || original._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      await refreshOnce()
      return privateClient(original)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)
