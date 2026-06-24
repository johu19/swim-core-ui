function normalizeBaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return null
  }

  return new URL(rawUrl.trim()).toString()
}

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
let idToken: string | null = null

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function setIdToken(nextIdToken: string | null) {
  idToken = nextIdToken
}

async function request<T>(path: string, init?: RequestInit) {
  if (!apiBaseUrl) {
    throw new ApiError('Missing VITE_API_BASE_URL.', 500)
  }

  if (!idToken) {
    throw new ApiError('Missing authentication token.', 401)
  }

  const url = new URL(path.replace(/^\//, ''), apiBaseUrl)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(message || 'Request failed.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiClient = {
  get: request,
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
  setIdToken,
}
