export function unwrapData<T>(response: { data?: T | null } | undefined) {
  return response?.data ?? undefined
}

export function rowsFrom<T>(
  response: { data?: T[] | null } | undefined,
): T[] {
  return response?.data ?? []
}

export function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return '-'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined,
  }).format(new Date(value))
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return JSON.stringify(value)
}

export function apiErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = error.response.data as {
      error?: { message?: string }
      message?: string
    }
    return data.error?.message ?? data.message ?? 'Request failed'
  }
  return error instanceof Error ? error.message : 'Request failed'
}
