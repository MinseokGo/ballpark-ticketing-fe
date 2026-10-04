import { useCallback, useState } from 'react'
import type { ReservationResponse } from '../api/types'

const STORAGE_KEY = 'ballpark-booking.history'

export type BookingHistoryEntry = {
  reservationId: number
  gameId: number
  homeTeam: string
  awayTeam: string
  status: ReservationResponse['status']
  totalPrice: number
  seatCount: number
  updatedAt: string
}

/**
 * 백엔드에 "내 예약 목록" 조회 API가 없어서(사용자 도메인이 없는 v1 범위), 마이페이지에
 * 보여줄 예약 이력은 이 브라우저가 만든 것만 localStorage에 기록해 둔다. 서버의 실제
 * 최신 상태와 다를 수 있다 — 예: 다른 기기에서 취소하면 여기엔 반영되지 않는다.
 */
export function useBookingHistory() {
  const [entries, setEntries] = useState<BookingHistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as BookingHistoryEntry[]) : []
    } catch {
      return []
    }
  })

  const upsert = useCallback(
    (entry: BookingHistoryEntry) => {
      setEntries((prev) => {
        const next = [entry, ...prev.filter((e) => e.reservationId !== entry.reservationId)]
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // 프라이빗 모드 등 localStorage를 쓸 수 없어도 세션 내 상태는 유지한다
        }
        return next
      })
    },
    [],
  )

  return { entries, upsert }
}
