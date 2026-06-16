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

async function request<T>(path: string) {
  if (!apiBaseUrl) {
    throw new ApiError('Missing VITE_API_BASE_URL.', 500)
  }

  if (!idToken) {
    throw new ApiError('Missing authentication token.', 401)
  }

  const url = new URL(path.replace(/^\//, ''), apiBaseUrl)
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(message || 'Request failed.', response.status)
  }

  return (await response.json()) as T
}

export const apiClient = {
  get: request,
  setIdToken,
}
