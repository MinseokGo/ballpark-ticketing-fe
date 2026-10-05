import { apiGet, apiPost } from './client'
import type { AuthResponse, UserResponse } from './types'

export function signup(email: string, password: string, nickname: string): Promise<AuthResponse> {
  return apiPost<AuthResponse, { email: string; password: string; nickname: string }>('/api/auth/signup', {
    email,
    password,
    nickname,
  })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse, { email: string; password: string }>('/api/auth/login', { email, password })
}

export function getMe(): Promise<UserResponse> {
  return apiGet<UserResponse>('/api/auth/me')
}
