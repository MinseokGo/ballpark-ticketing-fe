import { apiGet, apiPost } from './client'
import type {
  ChatMessageResponse,
  MyReservationResponse,
  LiveEventResponse,
  GameProgress,
  GameResponse,
  LiveStateResponse,
  GameSummaryResponse,
  PageResponse,
  PaymentCreateRequest,
  PaymentResponse,
  ReservationCreateRequest,
  ReservationResponse,
  SeatMapItemResponse,
  SectionAvailabilityResponse,
} from './types'

export function listGames(
  page: number,
  size: number,
  progress?: GameProgress,
): Promise<PageResponse<GameSummaryResponse>> {
  const filter = progress ? `&progress=${progress}` : ''
  return apiGet<PageResponse<GameSummaryResponse>>(`/api/games?page=${page}&size=${size}${filter}`)
}

/** 경기 목록을 전부 받는다(서버 최대 페이지 크기 100으로 끝까지 넘긴다). 목록 앞부분만 보던 문제를 막는다. */
export async function listAllGames(progress?: GameProgress): Promise<GameSummaryResponse[]> {
  const all: GameSummaryResponse[] = []
  for (let page = 0; ; page++) {
    const result = await listGames(page, 100, progress)
    all.push(...result.content)
    if (page + 1 >= result.totalPages || result.content.length === 0) break
  }
  return all
}

export function getGame(gameId: number): Promise<GameResponse> {
  return apiGet<GameResponse>(`/api/games/${gameId}`)
}

export function listChatMessages(gameId: number): Promise<ChatMessageResponse[]> {
  return apiGet<ChatMessageResponse[]>(`/api/games/${gameId}/chat/messages`)
}

export function postChatMessage(gameId: number, content: string): Promise<ChatMessageResponse> {
  return apiPost<ChatMessageResponse, { content: string }>(`/api/games/${gameId}/chat/messages`, { content })
}

/** 로그인한 사용자의 예약 목록(최신순). */
export function listMyReservations(): Promise<MyReservationResponse[]> {
  return apiGet<MyReservationResponse[]>('/api/me/reservations')
}

/** 경기 기록 전체(번호 순). 끝난 경기의 플레이 기록을 보여준다. */
export function getGameEvents(gameId: number): Promise<LiveEventResponse[]> {
  return apiGet<LiveEventResponse[]>(`/api/games/${gameId}/live/events`)
}

export function getLiveState(gameId: number): Promise<LiveStateResponse> {
  return apiGet<LiveStateResponse>(`/api/games/${gameId}/live`)
}

export function getSeatMap(gameId: number): Promise<SeatMapItemResponse[]> {
  return apiGet<SeatMapItemResponse[]>(`/api/games/${gameId}/seats`)
}

export function getSectionAvailability(gameId: number): Promise<SectionAvailabilityResponse[]> {
  return apiGet<SectionAvailabilityResponse[]>(`/api/games/${gameId}/sections`)
}

export function createReservation(gameId: number, request: ReservationCreateRequest): Promise<ReservationResponse> {
  return apiPost<ReservationResponse, ReservationCreateRequest>(`/api/games/${gameId}/reservations`, request)
}

export function pay(reservationId: number, request: PaymentCreateRequest): Promise<PaymentResponse> {
  return apiPost<PaymentResponse, PaymentCreateRequest>(
    `/api/reservations/${reservationId}/payments`,
    request,
  )
}

export function cancelReservation(reservationId: number): Promise<ReservationResponse> {
  return apiPost<ReservationResponse, Record<string, never>>(
    `/api/reservations/${reservationId}/cancel`,
    {},
  )
}
