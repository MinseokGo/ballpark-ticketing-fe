import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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
import { ErrorBanner } from '../components/Banner'
import { Celebration } from '../components/Celebration'
import { Skeleton } from '../components/Skeleton'
import { StadiumMap, type StadiumSectionSeats } from '../components/StadiumMap'
import { useBookingHistory } from '../hooks/useBookingHistory'
import { useUserId } from '../hooks/useUserId'
import { FAMILY_COLOR, parseSectionName } from '../lib/stadiumLayout'
import { teamColor } from '../lib/teamColors'
import type { ReservationResponse } from '../api/types'

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

  // 좌석 수가 많아서 캔버스 배치 계산이 무겁다 — 데이터가 바뀔 때만 다시 묶는다.
  const { stadiumSections, priceByGameSeatId } = useMemo(() => {
    const priceBySectionId = new Map((availabilityQuery.data ?? []).map((section) => [section.sectionId, section.price] as const))
    const grouped = new Map<number, StadiumSectionSeats>()
    const priceByGameSeatId = new Map<number, number>()
    for (const item of seatMapQuery.data ?? []) {
      let group = grouped.get(item.sectionId)
      if (!group) {
        group = {
          sectionId: item.sectionId,
          name: item.sectionName,
          price: priceBySectionId.get(item.sectionId) ?? 0,
          items: [],
        }
        grouped.set(item.sectionId, group)
      }
      group.items.push(item)
      priceByGameSeatId.set(item.gameSeatId, group.price)
    }
    return { stadiumSections: [...grouped.values()], priceByGameSeatId }
  }, [seatMapQuery.data, availabilityQuery.data])

  const estimatedTotal = [...selectedSeatIds].reduce((sum, id) => sum + (priceByGameSeatId.get(id) ?? 0), 0)

  // 구역 이름 체계(중앙석/필드석/외야석)별 가격대를 보여주는 범례. 색은 StadiumMap과 같은 기준(FAMILY_COLOR)을 쓴다.
  const familyPriceRanges = new Map<string, { color: string; min: number; max: number }>()
  for (const section of availabilityQuery.data ?? []) {
    const info = parseSectionName(section.name)
    if (!info) continue
    const existing = familyPriceRanges.get(info.family)
    familyPriceRanges.set(info.family, {
      color: FAMILY_COLOR[info.family],
      min: Math.min(existing?.min ?? section.price, section.price),
      max: Math.max(existing?.max ?? section.price, section.price),
    })
  }

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
          <p className="mb-3 text-center text-sm text-slate-500">
            실제 자리 배치 그대로예요. 확대해서 좌석을 골라보세요
          </p>
          <StadiumMap sections={stadiumSections} selectedIds={selectedSeatIds} onToggle={toggleSeat} />
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {[...familyPriceRanges.entries()].map(([family, info]) => (
              <span key={family} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                {family} {info.min.toLocaleString()}
                {info.min !== info.max ? `~${info.max.toLocaleString()}` : ''}원
              </span>
            ))}
          </div>
        </div>
      )}

      {seatMapQuery.isPending && <Skeleton className="h-[420px]" />}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-slate-300 bg-slate-300" /> 선점·판매됨
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border border-emerald-600 bg-emerald-500" /> 선택함
        </span>
        <span>· 색이 있는 조각은 그 구역의 예매 가능한 좌석이에요</span>
      </div>

      {activeMutationError && <ErrorBanner error={activeMutationError as ApiError} />}

      {!reservation && (
        <div className="animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <p className="text-sm">
              선택한 좌석 <strong className="tabular">{selectedSeatIds.size}</strong> / {MAX_SEATS}
              {selectedSeatIds.size > 0 && (
                <span className="tabular ml-2 text-slate-500">{estimatedTotal.toLocaleString()}원</span>
              )}
            </p>
            <button
              type="button"
              disabled={selectedSeatIds.size === 0 || reserveMutation.isPending}
              onClick={() => reserveMutation.mutate()}
              className="press rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none"
            >
              {reserveMutation.isPending ? '예매하는 중...' : '이 좌석으로 예매하기'}
            </button>
          </div>
        </div>
      )}

      {reservation && (
        <div className="animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
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
                  className="press flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 disabled:opacity-40"
                >
                  {payMutation.isPending ? '결제하는 중...' : '결제하기'}
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                  className="press rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
                >
                  예약 취소
                </button>
              </div>
            )}

            {reservation.status === 'CONFIRMED' && (
              <div className="space-y-2">
                <Celebration />
                <div className="animate-pop flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                    ✓
                  </span>
                  <div>
                    <p className="font-bold">결제가 완료됐어요</p>
                    <p className="text-sm opacity-80">선택한 좌석이 내 예매로 확정됐어요.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                  className="press rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
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
