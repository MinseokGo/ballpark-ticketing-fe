import { useQuery } from '@tanstack/react-query'
import { listMyReservations } from '../api/booking'
import type { ReservationStatus } from '../api/types'
import { useAuth } from './useAuth'

/** 화면에서 쓰는 예약 한 줄 모양. 서버의 내 예약 목록에서 만든다. */
export type BookingHistoryEntry = {
  reservationId: number
  gameId: number
  homeTeam: string
  awayTeam: string
  status: ReservationStatus
  totalPrice: number
  seatCount: number
  updatedAt: string
}

/** 로그인한 사용자의 예약 목록. 로그아웃 상태면 빈 목록이다. */
export function useBookingHistory() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['myReservations', user?.id ?? null],
    queryFn: listMyReservations,
    enabled: user !== null,
  })
  const entries: BookingHistoryEntry[] = (query.data ?? []).map((item) => ({
    reservationId: item.reservationId,
    gameId: item.gameId,
    homeTeam: item.homeTeam,
    awayTeam: item.awayTeam,
    status: item.status,
    totalPrice: item.totalPrice,
    seatCount: item.seatCount,
    updatedAt: item.createdAt,
  }))
  return { entries, loading: query.isPending && user !== null }
}
