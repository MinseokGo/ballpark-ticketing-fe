import { useQuery } from '@tanstack/react-query'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listAllGames } from '../api/booking'
import { EventBanner } from '../components/EventBanner'
import { GameTile } from '../components/GameTile'
import { LiveGames } from '../components/LiveGames'
import { Skeleton, SkeletonList } from '../components/Skeleton'
import { ScrollBox } from '../components/ScrollBox'
import { StandingsCompact } from '../components/StandingsTable'
import { useBookingHistory } from '../hooks/useBookingHistory'
import { useHomeLayout } from '../hooks/useHomeLayout'
import { useStandings } from '../hooks/useStandings'
import { packLayout, type HomeWidgetId } from '../lib/homeGrid'
import { HomeLayoutEditor } from '../components/HomeLayoutEditor'
import { parseServerTime } from '../lib/serverTime'
import { NextGameHero } from '../components/home/NextGameHero'
import { MyReservationCard } from '../components/home/MyReservationCard'
import { Panel } from '../components/home/HomePanel'
import { ActionPill, StatChip } from '../components/home/HomeChips'
import { greeting, sameDay, dateLabel } from '../lib/gameDates'

const WIDGET_LABELS: Record<HomeWidgetId, string> = {
  hero: '다음 경기',
  live: '지금 진행 중',
  reservations: '내 예매',
  today: '오늘의 경기',
  standings: '팀 순위',
  recent: '최근 결과',
  upcoming: '다가오는 경기',
  events: '이벤트',
}

export function HomePage() {
  // 렌더 중 Date를 매번 새로 읽지 않도록 마운트 시점 한 번만 잡는다.
  const [now] = useState(() => new Date())
  const { entries } = useBookingHistory()
  const { data, isPending } = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => listAllGames(),
    // 경기가 진행 중으로 바뀌거나 끝나는 것을 페이지를 새로 열지 않고도 보이도록 주기적으로 받는다.
    refetchInterval: 15_000,
  })

  const games = data ?? []
  // 진행 중인 경기는 전체 목록의 앞 50개(시작 시각 순) 밖에 있을 수 있어서, 서버에서 진행 중 경기만 따로 받는다.
  const liveQuery = useQuery({
    queryKey: ['games', 'live'],
    queryFn: () => listAllGames('LIVE'),
    refetchInterval: 15_000,
  })
  const byId = new Map(games.map((game) => [game.id, game] as const))
  // 끝났거나 취소된 경기는 다음 경기가 아니다.
  const upcoming = games
    .filter((game) => game.progress !== 'FINISHED' && game.progress !== 'CANCELLED')
    .filter((game) => parseServerTime(game.startAt) >= now || sameDay(parseServerTime(game.startAt), now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  const next = upcoming[0]
  const todays = games
    .filter((game) => sameDay(parseServerTime(game.startAt), now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  // 진행 중인 경기는 서버 진행 상태(progress)로 고른다.
  const live = liveQuery.data ?? []
  const standings = useStandings()
  // 최근 결과: 끝난 경기를 최근 순으로 3개.
  const recentResults = games
    .filter((game) => game.progress === 'FINISHED')
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .slice(0, 12)
  const myActive = entries.filter((entry) => entry.status !== 'CANCELLED')

  // 결제가 끝나지 않은 예매는 가장 먼저 알려야 해서 맨 위 알림으로 올린다.
  const pending = myActive.filter((entry) => entry.status === 'PENDING')

  const { items, setSize, move, moveToEnd, reset } = useHomeLayout()
  const [editing, setEditing] = useState(false)

  // 위젯마다 차지하는 칸(lg 기준 3칸 중)과 내용. 내용이 없으면 null이라 숨겨진다.
  const widgets: Record<HomeWidgetId, { node: ReactNode } | null> = {
    hero: {
      node: (
        <div className="min-w-0">
          {isPending && <Skeleton className="h-72" />}
          {next && <NextGameHero game={next} now={now} />}
          {data && !next && (
            <p className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              곧 열리는 경기가 없어요. 새 일정이 올라오면 여기서 먼저 알려드릴게요.
            </p>
          )}
        </div>
      ),
    },
    live: {
      node: (
        <Panel title="지금 진행 중">
          {live.length > 0 ? (
            <ScrollBox>
              <LiveGames games={live} />
            </ScrollBox>
          ) : (
            <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              지금 중계 중인 경기가 없어요.
            </p>
          )}
        </Panel>
      ),
    },
    reservations: {
      node: (
        <Panel
          title="내 예매"
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
            <ScrollBox>
              <div className="grid gap-3 sm:grid-cols-2">
                {myActive.map((entry) => (
                  <MyReservationCard key={entry.reservationId} entry={entry} game={byId.get(entry.gameId)} />
                ))}
              </div>
            </ScrollBox>
          )}
        </Panel>
      ),
    },
    today: {
      node: (
        <Panel title="오늘의 경기" action={{ to: '/schedule', label: '일정' }}>
          {todays.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 dark:bg-slate-900">오늘은 예정된 경기가 없어요.</p>
          ) : (
            <ScrollBox>
              <div className="grid gap-2">
                {todays.map((game) => (
                  <GameTile key={game.id} game={game} now={now} />
                ))}
              </div>
            </ScrollBox>
          )}
        </Panel>
      ),
    },
    standings: {
      node: (
        <Panel title="팀 순위" action={{ to: '/standings', label: '전체 순위' }}>
          {standings.data ? (
            <ScrollBox>
              <StandingsCompact rows={standings.data} />
            </ScrollBox>
          ) : (
            <Skeleton className="h-40" />
          )}
        </Panel>
      ),
    },
    recent: recentResults.length === 0 ? null : {
      node: (
        <Panel title="최근 결과">
          <ScrollBox>
            <div className="depth-stage grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentResults.map((game, index) => (
                <div key={game.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}>
                  <GameTile game={game} now={now} />
                </div>
              ))}
            </div>
          </ScrollBox>
        </Panel>
      ),
    },
    upcoming: {
      node: (
        <Panel title="다가오는 경기" action={{ to: '/booking', label: '전체 보기' }}>
          {isPending && <SkeletonList count={3} />}
          {data && upcoming.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              아직 열린 경기가 없어요.
            </p>
          )}
          <ScrollBox>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((game, index) => (
                <div key={game.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}>
                  <GameTile game={game} now={now} />
                </div>
              ))}
            </div>
          </ScrollBox>
        </Panel>
      ),
    },
    events: {
      node: (
        <Panel title="이벤트">
          <EventBanner />
        </Panel>
      ),
    },
  }

  // 숨겨진 위젯은 자리를 차지하지 않는다. 배치는 편집기와 같은 함수로 계산한다.
  const placed = packLayout(items.filter((item) => widgets[item.id] !== null))

  return (
    <div className="space-y-8">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{greeting(now.getHours())}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">야구장</h1>
        </div>
        <p className="tabular text-sm text-slate-500">{dateLabel(now.toISOString())}</p>
      </header>

      {/* 한 줄 요약: 결제 대기·내 예매·오늘 경기·진행 중 개수를 칩으로, 자주 쓰는 동작을 오른쪽에 둔다. */}
      <div className="animate-fade-up flex flex-col gap-3 [animation-delay:40ms] sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {pending.length > 0 && (
            <Link
              to={`/booking/${pending[0].gameId}`}
              className="press flex shrink-0 items-center gap-2 rounded-full bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/30"
            >
              결제 대기 {pending.length}건
              <span aria-hidden>→</span>
            </Link>
          )}
          <StatChip label="내 예매" value={myActive.length} />
          <StatChip label="오늘 경기" value={todays.length} />
          <StatChip label="진행 중" value={live.length} live />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <ActionPill to="/booking" emoji="🎟️" label="예매하기" primary />
          <ActionPill to="/schedule" emoji="📅" label="팀별 일정" />
        <ActionPill to="/records" emoji="📈" label="경기 기록" />
          <ActionPill to="/profile" emoji="🙋" label="마이페이지" />
        </div>
      </div>

      <div className="home-grid">
        {placed.map((item) => {
          const widget = widgets[item.id]
          if (!widget) return null
          return (
            <div
              key={item.id}
              className="home-widget"
              style={
                {
                  '--col': item.col + 1,
                  '--row': item.row + 1,
                  '--w': item.w,
                  '--h': item.h,
                } as CSSProperties
              }
            >
              {widget.node}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="press fixed right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-2xl bg-slate-900 px-2.5 py-4 text-xs font-bold tracking-wider text-white shadow-lg [writing-mode:vertical-rl] hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900"
      >
        레이아웃
      </button>

      {editing && (
        <HomeLayoutEditor
          placed={placed}
          labels={WIDGET_LABELS}
          onSetSize={setSize}
          onMove={move}
          onMoveToEnd={moveToEnd}
          onReset={reset}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
