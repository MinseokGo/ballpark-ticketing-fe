import { apiPost } from './client'
import type {
  GameCreateRequest,
  GameResponse,
  SeatBulkCreateRequest,
  SeatBulkCreateResponse,
  SectionCreateRequest,
  SectionResponse,
} from './types'

export function createSection(request: SectionCreateRequest): Promise<SectionResponse> {
  return apiPost<SectionResponse, SectionCreateRequest>('/api/admin/sections', request)
}

export function createSeatsInBulk(
  sectionId: number,
  request: SeatBulkCreateRequest,
): Promise<SeatBulkCreateResponse> {
  return apiPost<SeatBulkCreateResponse, SeatBulkCreateRequest>(
    `/api/admin/sections/${sectionId}/seats`,
    request,
  )
}

export function createGame(request: GameCreateRequest): Promise<GameResponse> {
  return apiPost<GameResponse, GameCreateRequest>('/api/admin/games', request)
}
