import { apiGet, apiPost } from './client'
import type {
  GameSummaryResponse,
  PageResponse,
  PaymentCreateRequest,
  PaymentResponse,
  ReservationCreateRequest,
  ReservationResponse,
  SeatMapItemResponse,
  SectionAvailabilityResponse,
} from './types'

export function listGames(page: number, size: number): Promise<PageResponse<GameSummaryResponse>> {
  return apiGet<PageResponse<GameSummaryResponse>>(`/api/games?page=${page}&size=${size}`)
}

export function getSeatMap(gameId: number): Promise<SeatMapItemResponse[]> {
  return apiGet<SeatMapItemResponse[]>(`/api/games/${gameId}/seats`)
}

export function getSectionAvailability(gameId: number): Promise<SectionAvailabilityResponse[]> {
  return apiGet<SectionAvailabilityResponse[]>(`/api/games/${gameId}/sections`)
}

export function createReservation(
  gameId: number,
  userId: number,
  request: ReservationCreateRequest,
): Promise<ReservationResponse> {
  return apiPost<ReservationResponse, ReservationCreateRequest>(
    `/api/games/${gameId}/reservations`,
    request,
    { 'X-User-Id': String(userId) },
  )
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
