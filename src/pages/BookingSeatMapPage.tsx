import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelReservation, createReservation, getSeatMap, getSectionAvailability, pay } from '../api/booking'
import { ApiError } from '../api/client'
import { ErrorBanner, SuccessBanner } from '../components/Banner'
import { SeatMapGrid } from '../components/SeatMapGrid'
import { useUserId } from '../hooks/useUserId'
import type { ReservationResponse, SeatMapItemResponse } from '../api/types'

const MAX_SEATS = 4

export function BookingSeatMapPage() {
  const { gameId: gameIdParam } = useParams<{ gameId: string }>()
  const gameId = Number(gameIdParam)
  const queryClient = useQueryClient()
  const [userId, setUserId] = useUserId()
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set())
  const [reservation, setReservation] = useState<ReservationResponse | null>(null)

  const seatMapQuery = useQuery({
    queryKey: ['seatMap', gameId],
    queryFn: () => getSeatMap(gameId),
  })
  const availabilityQuery = useQuery({
    queryKey: ['sectionAvailability', gameId],
    queryFn: () => getSectionAvailability(gameId),
  })

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['seatMap', gameId] })
    queryClient.invalidateQueries({ queryKey: ['sectionAvailability', gameId] })
  }

  const reserveMutation = useMutation({
    mutationFn: () => createReservation(gameId, userId, { gameSeatIds: [...selectedSeatIds] }),
    onSuccess: (created) => {
      setReservation(created)
      setSelectedSeatIds(new Set())
      refetchAll()
    },
  })

  const payMutation = useMutation({
    mutationFn: (success: boolean) => pay(reservation!.id, { success }).then((response) => ({ response, success })),
    onSuccess: ({ success }) => {
      setReservation((prev) => (prev ? { ...prev, status: success ? 'CONFIRMED' : prev.status } : prev))
      refetchAll()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelReservation(reservation!.id),
    onSuccess: (cancelled) => {
      setReservation(cancelled)
      refetchAll()
    },
  })

  const toggleSeat = (gameSeatId: number) => {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev)
      if (next.has(gameSeatId)) {
        next.delete(gameSeatId)
      } else if (next.size < MAX_SEATS) {
        next.add(gameSeatId)
      }
      return next
    })
  }

  const sections: { sectionId: number; sectionName: string; items: SeatMapItemResponse[] }[] = []
  const sectionsByid = new Map<number, { sectionId: number; sectionName: string; items: SeatMapItemResponse[] }>()
  for (const item of seatMapQuery.data ?? []) {
    let group = sectionsByid.get(item.sectionId)
    if (!group) {
      group = { sectionId: item.sectionId, sectionName: item.sectionName, items: [] }
      sectionsByid.set(item.sectionId, group)
      sections.push(group)
    }
    group.items.push(item)
  }

  const activeMutationError = reserveMutation.error ?? payMutation.error ?? cancelMutation.error

  return (
    <div className="space-y-6">
      <div>
        <Link to="/booking" className="text-sm text-neutral-500 hover:underline">
          ← 경기 목록
        </Link>
        <h1 className="mt-1 text-2xl font-bold">좌석 선택</h1>
      </div>

      <label className="block w-40 text-sm">
        사용자 ID (X-User-Id)
        <input
          type="number"
          min={1}
          value={userId}
          onChange={(event) => setUserId(Number(event.target.value) || 1)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {availabilityQuery.data && (
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-1 pr-4">구역</th>
              <th className="py-1 pr-4">등급</th>
              <th className="py-1 pr-4">가격</th>
              <th className="py-1 pr-4">잔여/전체</th>
            </tr>
          </thead>
          <tbody>
            {availabilityQuery.data.map((section) => (
              <tr key={section.sectionId} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="py-1 pr-4">{section.name}</td>
                <td className="py-1 pr-4">{section.grade}</td>
                <td className="py-1 pr-4">{section.price.toLocaleString()}원</td>
                <td className="py-1 pr-4">
                  {section.availableSeats} / {section.totalSeats}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {seatMapQuery.isPending && <p className="text-sm text-neutral-500">좌석맵을 불러오는 중...</p>}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.sectionId}>
            <h2 className="mb-2 font-semibold">{section.sectionName}</h2>
            <SeatMapGrid items={section.items} selectedIds={selectedSeatIds} onToggle={toggleSeat} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="inline-block size-3 rounded border border-sky-300 bg-sky-100" /> 선택 가능
        <span className="ml-3 inline-block size-3 rounded border border-emerald-600 bg-emerald-500" /> 선택함
        <span className="ml-3 inline-block size-3 rounded border border-amber-300 bg-amber-100" /> 선점됨(HELD)
        <span className="ml-3 inline-block size-3 rounded border border-neutral-300 bg-neutral-200" /> 판매 완료(SOLD)
      </div>

      {activeMutationError && <ErrorBanner error={activeMutationError as ApiError} />}

      {!reservation && (
        <div className="sticky bottom-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <p className="mb-2 text-sm">
            선택한 좌석: <strong>{selectedSeatIds.size}</strong> / {MAX_SEATS}
          </p>
          <button
            type="button"
            disabled={selectedSeatIds.size === 0 || reserveMutation.isPending}
            onClick={() => reserveMutation.mutate()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {reserveMutation.isPending ? '예매하는 중...' : '이 좌석으로 예매하기'}
          </button>
        </div>
      )}

      {reservation && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="font-semibold">
            예약 #{reservation.id} · {reservation.status} · {reservation.totalPrice.toLocaleString()}원 ·
            좌석 {reservation.gameSeatIds.length}개
          </p>

          {reservation.status === 'PENDING' && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(true)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                결제 성공으로 처리
              </button>
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(false)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                결제 실패로 처리
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
              >
                예약 취소
              </button>
            </div>
          )}

          {reservation.status === 'CONFIRMED' && (
            <div className="space-y-2">
              <SuccessBanner>결제 완료. 좌석이 판매 완료(SOLD) 상태로 바뀌었다.</SuccessBanner>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
              >
                예약 취소 (환불은 v1 범위 밖)
              </button>
            </div>
          )}

          {reservation.status === 'CANCELLED' && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500">취소됐다. 좌석은 다시 선택할 수 있다.</p>
              <button
                type="button"
                onClick={() => setReservation(null)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
              >
                새로 예매하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
