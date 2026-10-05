import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import type { GameSummaryResponse } from '../api/types'
import { EventBanner } from '../components/EventBanner'
import { GameTile } from '../components/GameTile'
import { LiveGames } from '../components/LiveGames'
import { Skeleton, SkeletonList } from '../components/Skeleton'
import { useBookingHistory, type BookingHistoryEntry } from '../hooks/useBookingHistory'
import { teamColor, teamInitial } from '../lib/teamColors'

// 홈에서 쓰는 경기 목록 크기. 데모 데이터(5경기)는 전부 들어온다.
const GAME_LIMIT = 50

function greeting(hour: number) {
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '오늘 야구 보러 갈까요?'
  return '오늘 저녁 경기 어때요?'
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

/** 0 = 오늘, 1 = 내일 … 지난 날짜는 음수. 달력 날짜 기준으로 센다(시각 무시). */
function dayDiff(iso: string, now: Date) {
  const start = new Date(iso)
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

/** 가장 가까운 예정 경기를 크게 보여준다. 두 팀 색으로 배경을 채우고 D-day와 상태를 올린다. */
function NextGameHero({ game, now }: { game: GameSummaryResponse; now: Date }) {
  const days = dayDiff(game.startAt, now)
  const dday = days === 0 ? 'D-DAY' : days > 0 ? `D-${days}` : '지난 경기'
  const open = game.status === 'OPEN'
  return (
    <Link
      to={open ? `/booking/${game.id}` : '/schedule'}
      className="press group relative block overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8"
      style={{
        backgroundImage: `linear-gradient(135deg, ${teamColor(game.homeTeam)}, ${teamColor(game.awayTeam)})`,
      }}
    >
      <span className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-110" />
      <span className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-white/5 transition-transform duration-700 group-hover:scale-110" />

      <div className="relative flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">다음 경기</span>
        <span className="tabular rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur">{dday}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
          {open ? '예매 중' : '예매 전'}
        </span>
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular text-sm font-semibold text-white/80">
            {dateLabel(game.startAt)} · {timeLabel(game.startAt)}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="block truncate">{game.homeTeam}</span>
            <span className="my-1 block text-base font-semibold text-white/60">vs</span>
            <span className="block truncate">{game.awayTeam}</span>
          </p>
        </div>
        <div className="flex shrink-0 -space-x-3">
          {[game.homeTeam, game.awayTeam].map((team) => (
            <span
              key={team}
              className="flex size-16 items-center justify-center rounded-full border-4 border-white/30 text-lg font-extrabold text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              {teamInitial(team)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-8 flex items-center justify-between">
        <span className="text-sm text-white/80">홈 {game.homeTeam} · 원정 {game.awayTeam}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">
          {open ? '좌석 고르러 가기' : '일정 보기'}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}

/** 이 브라우저에서 한 예매. 서버 최신 상태와 다를 수 있어서 이 기기 기록이라는 점은 마이페이지에서 설명한다. */
function MyReservationCard({ entry, game }: { entry: BookingHistoryEntry; game?: GameSummaryResponse }) {
  const confirmed = entry.status === 'CONFIRMED'
  return (
    <Link
      to={`/booking/${entry.gameId}`}
      className="press group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
            confirmed
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
          ].join(' ')}
        >
          <span className={`size-1.5 rounded-full ${confirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {confirmed ? '예매 완료' : '결제 대기'}
        </span>
        <span className="tabular text-xs text-slate-500">예약 #{entry.reservationId}</span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold">
          {entry.homeTeam} <span className="text-sm font-semibold text-slate-400">vs</span> {entry.awayTeam}
        </p>
        {game && (
          <p className="tabular mt-1 text-sm text-slate-500">
            {dateLabel(game.startAt)} · {timeLabel(game.startAt)}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500">좌석</p>
          <p className="tabular font-bold">{entry.seatCount}석</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">결제 금액</p>
          <p className="tabular font-bold">{entry.totalPrice.toLocaleString()}원</p>
        </div>
      </div>
    </Link>
  )
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: { to: string; label: string }
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`animate-fade-up space-y-3 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function HomePage() {
  // 렌더 중 Date를 매번 새로 읽지 않도록 마운트 시점 한 번만 잡는다.
  const [now] = useState(() => new Date())
  const { entries } = useBookingHistory()
  const { data, isPending } = useQuery({
    queryKey: ['games', 0, GAME_LIMIT],
    queryFn: () => listGames(0, GAME_LIMIT),
  })

  const games = data?.content ?? []
  const byId = new Map(games.map((game) => [game.id, game] as const))
  const upcoming = games
    .filter((game) => new Date(game.startAt) >= now || sameDay(new Date(game.startAt), now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  const next = upcoming[0]
  const todays = games
    .filter((game) => sameDay(new Date(game.startAt), now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  // 진행 중인 경기: 예정 경기 중 가장 가까운 2경기를 지금 중계 중인 것으로 취급한다(시뮬레이션).
  const live = upcoming.slice(0, 2)
  const myActive = entries.filter((entry) => entry.status !== 'CANCELLED')

  // 결제가 끝나지 않은 예매는 가장 먼저 알려야 해서 맨 위 알림으로 올린다.
  const pending = myActive.filter((entry) => entry.status === 'PENDING')

  return (
    <div className="space-y-8">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{greeting(now.getHours())}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">야구장</h1>
        </div>
        <p className="tabular text-sm text-slate-500">{dateLabel(now.toISOString())}</p>
      </header>

      {/* 자주 쓰는 동작은 헤더 바로 아래 한 줄에 둔다. */}
      <nav className="animate-fade-up grid grid-cols-3 gap-2 [animation-delay:40ms] sm:flex sm:flex-wrap">
        <ActionPill to="/booking" emoji="🎟️" label="예매하기" primary />
        <ActionPill to="/schedule" emoji="📅" label="팀별 일정" />
        <ActionPill to="/profile" emoji="🙋" label="마이페이지" />
      </nav>

      {pending.length > 0 && (
        <Link
          to={`/booking/${pending[0].gameId}`}
          className="animate-fade-up press flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">!</span>
            <span className="font-semibold">
              결제가 아직 끝나지 않은 예매가 {pending.length}건 있어요.
            </span>
          </span>
          <span aria-hidden className="shrink-0 font-bold">결제하러 가기 →</span>
        </Link>
      )}

      {/* 1행: 다음 경기(넓게) + 지금 진행 중 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {isPending && <Skeleton className="h-72" />}
          {next && <NextGameHero game={next} now={now} />}
          {data && !next && (
            <p className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              곧 열리는 경기가 없어요. 새 일정이 올라오면 여기서 먼저 알려드릴게요.
            </p>
          )}
        </div>
        <Panel title="지금 진행 중">
          {live.length > 0 ? (
            <LiveGames games={live} />
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              지금 중계 중인 경기가 없어요.
            </p>
          )}
        </Panel>
      </div>

      {/* 2행: 내 예매(넓게) + 오늘의 경기 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="내 예매"
          className="lg:col-span-2"
          action={myActive.length > 0 ? { to: '/profile', label: '전체 보기' } : undefined}
        >
          {myActive.length === 0 ? (
            <Link
              to="/booking"
              className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700"
            >
              <span>아직 예매한 경기가 없어요. 좌석을 골라 첫 예매를 해 보세요.</span>
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {myActive.map((entry) => (
                <MyReservationCard key={entry.reservationId} entry={entry} game={byId.get(entry.gameId)} />
              ))}
            </div>
          )}
        </Panel>
        <Panel title="오늘의 경기" action={{ to: '/schedule', label: '일정' }}>
          {todays.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 dark:bg-slate-900">오늘은 예정된 경기가 없어요.</p>
          ) : (
            <div className="grid gap-2">
              {todays.map((game) => (
                <GameTile key={game.id} game={game} now={now} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* 3행: 다가오는 경기 전체 */}
      <Panel title="다가오는 경기" action={{ to: '/booking', label: '전체 보기' }}>
        {isPending && <SkeletonList count={3} />}
        {data && upcoming.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            아직 열린 경기가 없어요.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.slice(0, 6).map((game, index) => (
            <div key={game.id} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
              <GameTile game={game} now={now} />
            </div>
          ))}
        </div>
      </Panel>

      {/* 4행: 이벤트는 가로로 넓게 */}
      <Panel title="이벤트">
        <EventBanner />
      </Panel>
    </div>
  )
}

function ActionPill({ to, emoji, label, primary = false }: { to: string; emoji: string; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={[
        'press flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors sm:justify-start',
        primary
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700'
          : 'border border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700',
      ].join(' ')}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </Link>
  )
}
