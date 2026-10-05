import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { SeatStatusLegend } from '../components/SeatStatusLegend'
import { GameScoreBanner } from '../components/GameScoreBanner'
import { SelectedSeatsBar, type SelectedSeat } from '../components/SelectedSeatsBar'
import { ZoneLegend } from '../components/ZoneLegend'
import { useAuth } from '../hooks/useAuth'
import { useLiveBroadcast, useLiveState } from '../hooks/useLiveGame'
import { teamColor } from '../lib/teamColors'
import type { ReservationResponse, SeatMapItemResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set())
  const [reservation, setReservation] = useState<ReservationResponse | null>(null)
  const [focus, setFocus] = useState<{ sectionId: number; nonce: number } | null>(null)

  const gameQuery = useQuery({ queryKey: ['game', gameId], queryFn: () => getGame(gameId) })
  const seatMapQuery = useQuery({ queryKey: ['seatMap', gameId], queryFn: () => getSeatMap(gameId) })
  // 진행 상태는 10초 폴링으로 받고, 경기가 진행 중이면 SSE로 즉시 갱신한다. SSE가 끊기면 폴링이 값을 맞춘다.
  const liveQuery = useLiveState(gameId, 10_000)
  const streaming = useLiveBroadcast(gameId, liveQuery.data?.progress === 'LIVE').connected
  const availabilityQuery = useQuery({
    queryKey: ['sectionAvailability', gameId],
    queryFn: () => getSectionAvailability(gameId),
  })

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['seatMap', gameId] })
    queryClient.invalidateQueries({ queryKey: ['sectionAvailability', gameId] })
    queryClient.invalidateQueries({ queryKey: ['myReservations'] })
  }


  const reserveMutation = useMutation({
    mutationFn: () => createReservation(gameId, { gameSeatIds: [...selectedSeatIds] }),
    onSuccess: (created) => {
      setReservation(created)
      setSelectedSeatIds(new Set())
      refetchAll()
    },
  })

  const payMutation = useMutation({
    mutationFn: () => pay(reservation!.id, { success: true }),
    onSuccess: () => {
      setReservation((prev) => {
        if (!prev) return prev
        const next: ReservationResponse = { ...prev, status: 'CONFIRMED' }
        return next
      })
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

  // 좌석 수가 많아서 캔버스 배치 계산이 무겁다 — 데이터가 바뀔 때만 다시 묶는다.
  const { stadiumSections, priceByGameSeatId, seatByGameSeatId } = useMemo(() => {
    const priceBySectionId = new Map((availabilityQuery.data ?? []).map((section) => [section.sectionId, section.price] as const))
    const grouped = new Map<number, StadiumSectionSeats>()
    const priceByGameSeatId = new Map<number, number>()
    const seatByGameSeatId = new Map<number, SeatMapItemResponse>()
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
      seatByGameSeatId.set(item.gameSeatId, item)
    }
    return { stadiumSections: [...grouped.values()], priceByGameSeatId, seatByGameSeatId }
  }, [seatMapQuery.data, availabilityQuery.data])

  const estimatedTotal = [...selectedSeatIds].reduce((sum, id) => sum + (priceByGameSeatId.get(id) ?? 0), 0)
  // 고른 순서대로 보여준다. Set은 삽입 순서를 유지하므로 그대로 쓴다.
  const selectedSeats: SelectedSeat[] = [...selectedSeatIds].flatMap((id) => {
    const seat = seatByGameSeatId.get(id)
    if (!seat) return []
    return [{
      gameSeatId: id,
      sectionName: seat.sectionName,
      rowNo: seat.rowNo,
      seatNo: seat.seatNo,
      price: priceByGameSeatId.get(id) ?? 0,
    }]
  })

  const zoneInfos = (availabilityQuery.data ?? []).map((section) => ({
    sectionId: section.sectionId,
    name: section.name,
    price: section.price,
    availableSeats: section.availableSeats,
    totalSeats: section.totalSeats,
  }))

  const activeMutationError = reserveMutation.error ?? payMutation.error ?? cancelMutation.error
  const game = gameQuery.data
  const homeColor = game ? teamColor(game.homeTeam) : '#3182F6'
  const awayColor = game ? teamColor(game.awayTeam) : '#6366F1'

  return (
    <div className="space-y-6 pb-32">
      <Link to="/booking" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
        ← 경기 목록
      </Link>

      <div
        className="rounded-3xl p-6 text-white"
        style={{ backgroundImage: `linear-gradient(135deg, ${homeColor}, ${awayColor})` }}
      >
        {game ? (
          <>
            <p className="text-sm font-medium text-white/80">
              {formatKst(game.startAt, {
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

      {game && <GameScoreBanner game={game} live={liveQuery.data} streaming={streaming} />}

      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 lg:space-y-0">
        {stadiumSections.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white p-3 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <StadiumMap
            sections={stadiumSections}
            selectedIds={selectedSeatIds}
            onToggle={toggleSeat}
            focus={focus}
          />
          <p className="pb-2 text-center text-xs text-slate-500">드래그로 옮기고, 두 손가락이나 휠로 확대해 좌석을 고르세요</p>
        </div>
      )}

      {zoneInfos.length > 0 && (
        <section className="flex flex-col rounded-3xl border border-slate-200 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] dark:border-slate-800">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">구역 둘러보기</h2>
            <p className="text-xs text-slate-500">구역을 누르면 지도에서 그 자리로 줌인돼요</p>
          </div>
          <ZoneLegend
            zones={zoneInfos}
            activeSectionId={focus?.sectionId ?? null}
            onSelect={(sectionId) =>
              setFocus((prev) => ({ sectionId, nonce: (prev?.nonce ?? 0) + 1 }))
            }
          />
          <SeatStatusLegend />
        </section>
      )}
      </div>

      {seatMapQuery.isPending && <Skeleton className="h-[420px]" />}

      {activeMutationError && <ErrorBanner error={activeMutationError as ApiError} />}

      {!reservation && (
        <SelectedSeatsBar
          seats={selectedSeats}
          max={MAX_SEATS}
          total={estimatedTotal}
          reserving={reserveMutation.isPending}
          onRemove={toggleSeat}
          onReserve={() => (user ? reserveMutation.mutate() : navigate('/login'))}
        />
      )}

      {reservation && (
        <div className="animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="w-full space-y-3 px-4 py-4 sm:px-6 lg:px-10">
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
