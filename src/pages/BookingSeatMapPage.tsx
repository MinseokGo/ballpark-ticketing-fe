import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  cancelReservation,
  createReservation,
  getGame,
  getSeatMap,
  getSectionAvailability,
  pay,
} from '../api/booking'
import { ApiError } from '../api/client'
import { ErrorBanner, SuccessBanner } from '../components/Banner'
import { SeatArcGrid } from '../components/SeatArcGrid'
import { StadiumMap } from '../components/StadiumMap'
import { useBookingHistory } from '../hooks/useBookingHistory'
import { useUserId } from '../hooks/useUserId'
import { STADIUM_PALETTE } from '../lib/stadiumPalette'
import { teamColor } from '../lib/teamColors'
import type { ReservationResponse, SeatMapItemResponse } from '../api/types'

const MAX_SEATS = 4

const RESERVATION_STATUS_LABEL: Record<ReservationResponse['status'], string> = {
  PENDING: '결제 대기',
  CONFIRMED: '예매 완료',
  CANCELLED: '취소됨',
}

export function BookingSeatMapPage() {
  const { gameId: gameIdParam } = useParams<{ gameId: string }>()
  const gameId = Number(gameIdParam)
  const queryClient = useQueryClient()
  const [userId, setUserId] = useUserId()
  const [showUserSwitch, setShowUserSwitch] = useState(false)
  const { upsert: upsertHistory } = useBookingHistory()
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set())
  const [reservation, setReservation] = useState<ReservationResponse | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)

  const gameQuery = useQuery({ queryKey: ['game', gameId], queryFn: () => getGame(gameId) })
  const seatMapQuery = useQuery({ queryKey: ['seatMap', gameId], queryFn: () => getSeatMap(gameId) })
  const availabilityQuery = useQuery({
    queryKey: ['sectionAvailability', gameId],
    queryFn: () => getSectionAvailability(gameId),
  })

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['seatMap', gameId] })
    queryClient.invalidateQueries({ queryKey: ['sectionAvailability', gameId] })
  }

  const recordHistory = (next: ReservationResponse) => {
    const game = gameQuery.data
    upsertHistory({
      reservationId: next.id,
      gameId,
      homeTeam: game?.homeTeam ?? `경기 #${gameId}`,
      awayTeam: game?.awayTeam ?? '',
      status: next.status,
      totalPrice: next.totalPrice,
      seatCount: next.gameSeatIds.length,
      updatedAt: new Date().toISOString(),
    })
  }

  const reserveMutation = useMutation({
    mutationFn: () => createReservation(gameId, userId, { gameSeatIds: [...selectedSeatIds] }),
    onSuccess: (created) => {
      setReservation(created)
      setSelectedSeatIds(new Set())
      recordHistory(created)
      refetchAll()
    },
  })

  const payMutation = useMutation({
    mutationFn: () => pay(reservation!.id, { success: true }),
    onSuccess: () => {
      setReservation((prev) => {
        if (!prev) return prev
        const next: ReservationResponse = { ...prev, status: 'CONFIRMED' }
        recordHistory(next)
        return next
      })
      refetchAll()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelReservation(reservation!.id),
    onSuccess: (cancelled) => {
      setReservation(cancelled)
      recordHistory(cancelled)
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
  const sectionsById = new Map<number, { sectionId: number; sectionName: string; items: SeatMapItemResponse[] }>()
  for (const item of seatMapQuery.data ?? []) {
    let group = sectionsById.get(item.sectionId)
    if (!group) {
      group = { sectionId: item.sectionId, sectionName: item.sectionName, items: [] }
      sectionsById.set(item.sectionId, group)
      sections.push(group)
    }
    group.items.push(item)
  }

  const stadiumSections = (availabilityQuery.data ?? []).map((section) => ({
    sectionId: section.sectionId,
    name: section.name,
    availableSeats: section.availableSeats,
    totalSeats: section.totalSeats,
  }))

  const effectiveSectionId = selectedSectionId ?? sections[0]?.sectionId ?? null
  const selectedSection = sections.find((section) => section.sectionId === effectiveSectionId) ?? null
  const selectedAvailability =
    availabilityQuery.data?.find((section) => section.sectionId === effectiveSectionId) ?? null

  const activeMutationError = reserveMutation.error ?? payMutation.error ?? cancelMutation.error
  const game = gameQuery.data
  const homeColor = game ? teamColor(game.homeTeam) : '#3182F6'
  const awayColor = game ? teamColor(game.awayTeam) : '#6366F1'

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <Link to="/booking" className="text-sm text-slate-500 hover:underline">
          ← 경기 목록
        </Link>
        <button
          type="button"
          onClick={() => setShowUserSwitch((prev) => !prev)}
          className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
        >
          {userId}
        </button>
      </div>

      {showUserSwitch && (
        <label className="block w-44 text-sm">
          사용자 전환
          <input
            type="number"
            min={1}
            value={userId}
            onChange={(event) => setUserId(Number(event.target.value) || 1)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      )}

      <div
        className="rounded-3xl p-6 text-white"
        style={{ backgroundImage: `linear-gradient(135deg, ${homeColor}, ${awayColor})` }}
      >
        {game ? (
          <>
            <p className="text-sm font-medium text-white/80">
              {new Date(game.startAt).toLocaleString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
              {game.homeTeam} <span className="text-white/60">vs</span> {game.awayTeam}
            </h1>
          </>
        ) : (
          <p className="text-sm text-white/80">불러오는 중...</p>
        )}
      </div>

      {stadiumSections.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-center text-sm text-slate-500">구역을 탭해서 좌석을 골라보세요</p>
          <StadiumMap
            sections={stadiumSections}
            selectedSectionId={effectiveSectionId}
            onSelect={setSelectedSectionId}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {availabilityQuery.data?.map((section, index) => (
              <button
                key={section.sectionId}
                type="button"
                onClick={() => setSelectedSectionId(section.sectionId)}
                className={[
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  section.sectionId === effectiveSectionId
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950'
                    : 'border-slate-200 dark:border-slate-700',
                ].join(' ')}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: STADIUM_PALETTE[index % STADIUM_PALETTE.length] }}
                />
                {section.name} · {section.price.toLocaleString()}원
              </button>
            ))}
          </div>
        </div>
      )}

      {seatMapQuery.isPending && <p className="text-sm text-slate-500">좌석맵을 불러오는 중...</p>}

      {selectedSection && (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">{selectedSection.sectionName}</h2>
            {selectedAvailability && (
              <p className="tabular text-sm text-slate-500">
                {selectedAvailability.availableSeats} / {selectedAvailability.totalSeats}석 남음
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <SeatArcGrid
              items={selectedSection.items}
              sectionName={selectedSection.sectionName}
              selectedIds={selectedSeatIds}
              onToggle={toggleSeat}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-sky-300 bg-sky-100" /> 선택 가능
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-emerald-600 bg-emerald-500" /> 선택함
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-amber-300 bg-amber-100" /> 선점됨
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-slate-300 bg-slate-200" /> 판매 완료
        </span>
      </div>

      {activeMutationError && <ErrorBanner error={activeMutationError as ApiError} />}

      {!reservation && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <p className="text-sm">
              선택한 좌석 <strong className="tabular">{selectedSeatIds.size}</strong> / {MAX_SEATS}
            </p>
            <button
              type="button"
              disabled={selectedSeatIds.size === 0 || reserveMutation.isPending}
              onClick={() => reserveMutation.mutate()}
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {reserveMutation.isPending ? '예매하는 중...' : '이 좌석으로 예매하기'}
            </button>
          </div>
        </div>
      )}

      {reservation && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">예약 #{reservation.id}</p>
                <p className="tabular text-lg font-bold">{reservation.totalPrice.toLocaleString()}원</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {RESERVATION_STATUS_LABEL[reservation.status]}
              </span>
            </div>

            {reservation.status === 'PENDING' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate()}
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  {payMutation.isPending ? '결제하는 중...' : '결제하기'}
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                  className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
                >
                  예약 취소
                </button>
              </div>
            )}

            {reservation.status === 'CONFIRMED' && (
              <div className="space-y-2">
                <SuccessBanner>결제 완료! 예매가 확정됐어요.</SuccessBanner>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
                >
                  예약 취소하기
                </button>
              </div>
            )}

            {reservation.status === 'CANCELLED' && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">취소됐어요. 좌석을 다시 선택할 수 있어요.</p>
                <button
                  type="button"
                  onClick={() => setReservation(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                >
                  새로 예매하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
