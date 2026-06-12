import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', async () => {
  const handlers: Array<(error: unknown) => Promise<unknown>> = []
  const request = vi.fn()
  return {
    default: {
      create: vi.fn(() => ({
        request,
        interceptors: {
          response: {
            use: vi.fn((_success, failure) => handlers.push(failure)),
          },
        },
      })),
      get: vi.fn(),
      post: vi.fn(),
      __handlers: handlers,
      __request: request,
    },
  }
})

type MockedAxios = {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  __handlers: Array<(error: unknown) => Promise<unknown>>
}

describe('privateClient 403 refresh', () => {
  let useAuthStore: typeof import('@/stores/auth-store').useAuthStore

  beforeEach(async () => {
    vi.resetModules()
    const mockedAxios = axios as unknown as MockedAxios
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockedAxios.__handlers.splice(0, mockedAxios.__handlers.length)
    useAuthStore = (await import('@/stores/auth-store')).useAuthStore
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: false, user: null })
  })

  it('refreshes auth user once on a protected 403 and rejects the original error', async () => {
    const mockedAxios = axios as unknown as MockedAxios
    mockedAxios.get.mockResolvedValue({
      data: {
        data: {
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@example.test',
            roles: ['admin'],
            permissions: [],
          },
        },
      },
    })

    await import('./private-client')
    const error = { response: { status: 403 }, config: { url: '/api/expenses' } }
    await expect(mockedAxios.__handlers[0](error)).rejects.toBe(error)

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me', {
      withCredentials: true,
      timeout: 15000,
    })
    expect(useAuthStore.getState().user?.roles).toEqual(['admin'])
  })

  it('does not recursively refresh auth/me failures', async () => {
    const mockedAxios = axios as unknown as MockedAxios

    await import('./private-client')
    const error = { response: { status: 403 }, config: { url: '/api/auth/me' } }
    await expect(mockedAxios.__handlers[0](error)).rejects.toBe(error)
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })
})
