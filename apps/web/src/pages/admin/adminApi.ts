export type ApiError =
  | {
      error: string
      message?: string
      details?: unknown
    }
  | { message: string }

export const adminFetch = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit & { json?: unknown }
): Promise<T> => {
  const headers = new Headers(init?.headers)
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiError
    throw payload
  }

  return (await response.json()) as T
}

