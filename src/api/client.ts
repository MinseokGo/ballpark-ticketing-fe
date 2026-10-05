import type { ProblemDetail } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  readonly problem: ProblemDetail

  constructor(problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? '요청을 처리할 수 없습니다.')
    this.problem = problem
  }
}

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetail | null
    throw new ApiError(
      problem ?? { status: response.status, title: response.statusText },
    )
  }

  if (response.status === 204) {
    return undefined as TResponse
  }
  return (await response.json()) as TResponse
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path)
}

export function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  headers?: HeadersInit,
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'POST', body: JSON.stringify(body), headers })
}

export function apiPatch<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, { method: 'PATCH' })
}
