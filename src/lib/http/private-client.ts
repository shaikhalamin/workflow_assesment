import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const REFRESH_URL = '/api/auth/refresh'

export const privateClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 15_000,
  withCredentials: true,
})

let refreshInFlight: Promise<void> | null = null

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
    const isRefreshCall = url.endsWith('/auth/refresh')

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
