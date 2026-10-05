import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import type { GameSummaryResponse } from '../api/types'
import { EventBanner } from '../components/EventBanner'
import { GameCard } from '../components/GameCard'
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

function TeamPair({ home, away, size = 'size-10' }: { home: string; away: string; size?: string }) {
  return (
    <div className="flex -space-x-2">
      {[home, away].map((team) => (
        <span
          key={team}
          className={`flex ${size} items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white dark:border-slate-900`}
          style={{ backgroundColor: teamColor(team) }}
        >
          {teamInitial(team)}
        </span>
      ))}
    </div>
  )
}

/** 가장 가까운 예정 경기를 크게 보여준다. 팀 색으로 배경을 채운다. */
function NextGameHero({ game, now }: { game: GameSummaryResponse; now: Date }) {
  const days = dayDiff(game.startAt, now)
  const dday = days === 0 ? 'D-DAY' : `D-${days}`
  return (
    <Link
      to={game.status === 'OPEN' ? `/booking/${game.id}` : '/schedule'}
      className="press group relative block overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-slate-900/10"
      style={{
        backgroundImage: `linear-gradient(135deg, ${teamColor(game.homeTeam)}, ${teamColor(game.awayTeam)})`,
      }}
    >
      <span className="absolute -right-10 -top-10 size-44 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80">다음 경기 · {dateLabel(game.startAt)} {timeLabel(game.startAt)}</p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight">
            {game.homeTeam} <span className="text-white/60">vs</span> {game.awayTeam}
          </p>
        </div>
        <span className="tabular shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold backdrop-blur">{dday}</span>
      </div>
      <div className="relative mt-6 flex items-center justify-between">
        <TeamPair home={game.homeTeam} away={game.awayTeam} size="size-12" />
        <span className="inline-flex items-center gap-1 text-sm font-bold">
          {game.status === 'OPEN' ? '좌석 고르러 가기' : '일정 보기'}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}

/** 이 브라우저에서 한 예매. 서버 최신 상태와 다를 수 있어서 이 기기 기록이라는 점은 마이페이지에서 설명한다. */
function MyReservationCard({ entry, game }: { entry: BookingHistoryEntry; game?: GameSummaryResponse }) {
  const badge =
    entry.status === 'CONFIRMED'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  const label = entry.status === 'CONFIRMED' ? '예매 완료' : '결제 대기'
  return (
    <Link
      to={`/booking/${entry.gameId}`}
      className="press flex w-64 shrink-0 snap-start flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}>{label}</span>
        <span className="tabular text-xs text-slate-500">좌석 {entry.seatCount}석</span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold">
          {entry.homeTeam} <span className="text-slate-400">vs</span> {entry.awayTeam}
        </p>
        {game && <p className="tabular mt-1 text-sm text-slate-500">{dateLabel(game.startAt)} {timeLabel(game.startAt)}</p>}
      </div>
      <p className="tabular text-sm font-semibold">{entry.totalPrice.toLocaleString()}원</p>
    </Link>
  )
}

function QuickLink({ to, emoji, title, description }: { to: string; emoji: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="press rounded-2xl border border-slate-200 bg-white p-4 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <p className="text-2xl">{emoji}</p>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </Link>
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
  const todays = games.filter((game) => sameDay(new Date(game.startAt), now)).sort((a, b) => a.startAt.localeCompare(b.startAt))
  // 진행 중인 경기: 예정 경기 중 가장 가까운 2경기를 지금 중계 중인 것으로 취급한다(시뮬레이션).
  const live = upcoming.slice(0, 2)
  const myActive = entries.filter((entry) => entry.status !== 'CANCELLED')

  return (
    <div className="space-y-10">
      <section className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{greeting(now.getHours())}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">야구장</h1>
      </section>

      {live.length > 0 && (
        <section className="animate-fade-up space-y-3 [animation-delay:40ms]">
          <h2 className="text-lg font-bold">지금 진행 중</h2>
          <LiveGames games={live} />
        </section>
      )}

      <section className="animate-fade-up [animation-delay:60ms]">
        {isPending && <Skeleton className="h-48" />}
        {next && <NextGameHero game={next} now={now} />}
        {data && !next && (
          <p className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            곧 열리는 경기가 없어요. 새 일정이 올라오면 여기서 먼저 알려드릴게요.
          </p>
        )}
      </section>

      <section className="animate-fade-up space-y-3 [animation-delay:100ms]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">내 예매</h2>
          {myActive.length > 0 && (
            <Link to="/profile" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
              전체 보기
            </Link>
          )}
        </div>
        {myActive.length === 0 ? (
          <Link
            to="/booking"
            className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700"
          >
            <span>아직 예매한 경기가 없어요</span>
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {myActive.map((entry) => (
              <MyReservationCard key={entry.reservationId} entry={entry} game={byId.get(entry.gameId)} />
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-up space-y-3 [animation-delay:140ms]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">오늘의 경기</h2>
          <p className="tabular text-xs text-slate-500">{dateLabel(now.toISOString())}</p>
        </div>
        {todays.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 dark:bg-slate-900">오늘은 예정된 경기가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {todays.map((game) => (
              <div key={game.id} className="flex items-center gap-3">
                <span className="tabular w-12 shrink-0 text-right text-sm font-bold">{timeLabel(game.startAt)}</span>
                <div className="min-w-0 flex-1">
                  <GameCard game={game} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-up [animation-delay:180ms]">
        <EventBanner />
      </section>

      <section className="animate-fade-up space-y-3 [animation-delay:220ms]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">다가오는 경기</h2>
          <Link to="/booking" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
            전체 보기
          </Link>
        </div>
        {isPending && <SkeletonList count={3} />}
        {data && upcoming.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            아직 열린 경기가 없어요.
          </p>
        )}
        <div className="space-y-2">
          {upcoming.slice(0, 5).map((game, index) => (
            <div key={game.id} className="animate-fade-up" style={{ animationDelay: `${260 + index * 60}ms` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-up grid grid-cols-3 gap-3 [animation-delay:300ms]">
        <QuickLink to="/booking" emoji="🎟️" title="예매하기" description="좌석 고르고 결제" />
        <QuickLink to="/schedule" emoji="📅" title="팀별 일정" description="응원 팀 경기" />
        <QuickLink to="/profile" emoji="🙋" title="마이페이지" description="내 예매 확인" />
      </section>
    </div>
  )
}
