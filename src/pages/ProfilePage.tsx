import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelReservation, listGames } from '../api/booking'
import { ApiError } from '../api/client'
import type { GameSummaryResponse } from '../api/types'
import { ErrorBanner } from '../components/Banner'
import { Skeleton } from '../components/Skeleton'
import { useBookingHistory, type BookingHistoryEntry } from '../hooks/useBookingHistory'
import { teamColor, teamInitial } from '../lib/teamColors'
import { formatKst, parseServerTime } from '../lib/serverTime'

type Filter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'CONFIRMED', label: '예매 완료' },
  { value: 'CANCELLED', label: '취소됨' },
]

const STATUS_STYLE: Record<BookingHistoryEntry['status'], { label: string; badge: string; dot: string }> = {
  PENDING: {
    label: '결제 대기',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: '예매 완료',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: '취소됨',
    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

function dateTimeLabel(iso: string) {
  return formatKst(iso, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ProfilePage() {
  const { entries, upsert } = useBookingHistory()
  // 경기 시작 여부 판단용 기준 시각. 렌더 중에 Date.now()를 매번 읽지 않도록 마운트 때 한 번만 잡는다.
  const [now] = useState(() => Date.now())
  const [filter, setFilter] = useState<Filter>('ALL')
  // 경기 일시를 예매 기록에 붙이려고 경기 목록을 함께 받는다.
  const gamesQuery = useQuery({
    queryKey: ['games', 0, 100],
    queryFn: () => listGames(0, 100),
  })
  const gameById = useMemo(
    () => new Map<number, GameSummaryResponse>((gamesQuery.data?.content ?? []).map((game) => [game.id, game])),
    [gamesQuery.data],
  )

  const cancelMutation = useMutation({
    mutationFn: (entry: BookingHistoryEntry) => cancelReservation(entry.reservationId),
    onSuccess: (cancelled, entry) => {
      upsert({ ...entry, status: cancelled.status, updatedAt: new Date().toISOString() })
    },
  })

  const counts = useMemo(
    () => ({
      ALL: entries.length,
      PENDING: entries.filter((entry) => entry.status === 'PENDING').length,
      CONFIRMED: entries.filter((entry) => entry.status === 'CONFIRMED').length,
      CANCELLED: entries.filter((entry) => entry.status === 'CANCELLED').length,
    }),
    [entries],
  )
  const spent = entries
    .filter((entry) => entry.status === 'CONFIRMED')
    .reduce((sum, entry) => sum + entry.totalPrice, 0)
  const visible = entries.filter((entry) => filter === 'ALL' || entry.status === filter)
  const cancelError = cancelMutation.error instanceof ApiError ? cancelMutation.error : null

  return (
    <div className="space-y-6">
      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">마이페이지</p>
        <h1 className="text-3xl font-extrabold tracking-tight">내 예매</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className="animate-fade-up space-y-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-extrabold text-white">
                나
              </span>
              <div>
                <p className="font-extrabold">내 계정</p>
                <p className="text-xs text-slate-500">예매 {entries.length}건 기록</p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 divide-x divide-slate-100 text-center dark:divide-slate-800">
              <Stat label="결제 대기" value={counts.PENDING} />
              <Stat label="예매 완료" value={counts.CONFIRMED} />
              <Stat label="취소" value={counts.CANCELLED} />
            </dl>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs text-slate-500">예매 완료 금액 합계</p>
              <p className="tabular mt-1 text-2xl font-extrabold">{spent.toLocaleString()}원</p>
            </div>
          </section>

          <p className="px-1 text-xs leading-relaxed text-slate-500">
            이 기기에서 한 예매만 모아 보여줘요. 다른 기기에서 한 예매는 여기에 나타나지 않아요.
          </p>
        </aside>

        <section className="animate-fade-up min-w-0 space-y-4">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((item) => {
              const active = filter === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={[
                    'press flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                  ].join(' ')}
                >
                  {item.label}
                  <span className="tabular text-xs opacity-70">{counts[item.value]}</span>
                </button>
              )
            })}
          </div>

          {cancelError && <ErrorBanner error={cancelError} />}

          {gamesQuery.isPending && entries.length > 0 && <Skeleton className="h-40" />}

          {entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
              <p className="font-semibold">아직 예매한 경기가 없어요</p>
              <p className="mt-1 text-sm text-slate-500">좌석을 골라 첫 예매를 해 보세요.</p>
              <Link
                to="/booking"
                className="press mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700"
              >
                예매하러 가기
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              이 상태의 예매가 없어요.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((entry, index) => (
                <div key={entry.reservationId} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                  <ReservationCard
                    entry={entry}
                    game={gameById.get(entry.gameId)}
                    now={now}
                    cancelling={cancelMutation.isPending && cancelMutation.variables?.reservationId === entry.reservationId}
                    onCancel={() => cancelMutation.mutate(entry)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="tabular mt-1 text-xl font-extrabold">{value}</dd>
    </div>
  )
}

function ReservationCard({
  entry,
  game,
  now,
  cancelling,
  onCancel,
}: {
  entry: BookingHistoryEntry
  game?: GameSummaryResponse
  now: number
  cancelling: boolean
  onCancel: () => void
}) {
  const style = STATUS_STYLE[entry.status]
  const cancellable = entry.status !== 'CANCELLED'
  // 경기 시작이 지난 예매는 취소 버튼을 숨긴다(목록 기준 시각). 경기 정보가 없으면 그대로 둔다.
  const started = game ? parseServerTime(game.startAt).getTime() <= now : false

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}>
          <span className={`size-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
        <span className="tabular text-xs text-slate-500">예약 #{entry.reservationId}</span>
      </div>

      <div className="flex items-center gap-3">
        <TeamDot team={entry.homeTeam} />
        <div className="min-w-0">
          <p className="truncate font-extrabold">
            {entry.homeTeam} <span className="text-sm font-semibold text-slate-400">vs</span> {entry.awayTeam}
          </p>
          <p className="tabular mt-0.5 text-sm text-slate-500">
            {game ? dateTimeLabel(game.startAt) : '경기 일정을 찾을 수 없어요'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950">
        <div>
          <dt className="text-[11px] text-slate-500">좌석</dt>
          <dd className="tabular font-bold">{entry.seatCount}석</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-500">금액</dt>
          <dd className="tabular font-bold">{entry.totalPrice.toLocaleString()}원</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-500">변경</dt>
          <dd className="tabular text-xs font-semibold">
            {formatKst(entry.updatedAt, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex gap-2">
        <Link
          to={`/booking/${entry.gameId}`}
          className="press flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold hover:border-slate-300 dark:border-slate-700"
        >
          경기 화면
        </Link>
        {cancellable && !started && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="press flex-1 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            {cancelling ? '취소하는 중...' : '예매 취소'}
          </button>
        )}
      </div>
    </article>
  )
}

function TeamDot({ team }: { team: string }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: teamColor(team) }}
    >
      {teamInitial(team)}
    </span>
  )
}
