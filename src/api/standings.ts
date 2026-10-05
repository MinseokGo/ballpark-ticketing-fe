import { apiGet } from './client'
import type { StandingResponse } from './types'

export function listStandings(): Promise<StandingResponse[]> {
  return apiGet<StandingResponse[]>('/api/standings')
}
