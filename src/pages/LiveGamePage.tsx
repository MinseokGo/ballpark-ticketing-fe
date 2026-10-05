import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getGame } from '../api/booking'
import { GameScoreBanner } from '../components/GameScoreBanner'
import { GameChatPanel } from '../components/GameChatPanel'
import { LiveTimeline } from '../components/LiveTimeline'
import { Skeleton } from '../components/Skeleton'
import { useLiveBroadcast, useLiveState } from '../hooks/useLiveGame'

/** 경기 중계 화면. 점수 띠와 이벤트가 올 때마다 쌓이는 중계 기록을 보여준다. 끝난 경기는 전체 기록을 다시 보여준다. */
export function LiveGamePage() {
  const { gameId: gameIdParam } = useParams<{ gameId: string }>()
  const gameId = Number(gameIdParam)
  const gameQuery = useQuery({ queryKey: ['game', gameId], queryFn: () => getGame(gameId) })
  const liveQuery = useLiveState(gameId, 10_000)
  const broadcast = useLiveBroadcast(gameId, Number.isFinite(gameId))

  const game = gameQuery.data
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
          ← 홈
        </Link>
        {game && game.status === 'OPEN' && (
          <Link
            to={`/booking/${gameId}`}
            className="press rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-slate-300 dark:border-slate-700"
          >
            좌석 보기
          </Link>
        )}
      </div>

      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">실시간 중계</p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {game ? `${game.homeTeam} vs ${game.awayTeam}` : '경기 정보'}
        </h1>
      </header>

      {gameQuery.isPending && <Skeleton className="h-28" />}
      {game && <GameScoreBanner game={game} live={liveQuery.data} streaming={broadcast.connected} />}

      <section className="animate-fade-up grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              중계 기록
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="relative flex size-2">
                  <span
                    className={`absolute inline-flex size-full rounded-full opacity-75 ${broadcast.connected ? 'animate-ping bg-emerald-500' : 'bg-slate-300'}`}
                  />
                  <span className={`relative inline-flex size-2 rounded-full ${broadcast.connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </span>
                {broadcast.connected ? '실시간' : '다시 연결 중'}
              </span>
            </h2>
            <p className="tabular text-sm text-slate-500">{broadcast.events.length}건</p>
          </div>
          <LiveTimeline events={broadcast.events} team={game ? { home: game.homeTeam, away: game.awayTeam } : undefined} />
        </div>
        <div className="min-w-0 lg:sticky lg:top-24">
          <GameChatPanel gameId={gameId} />
        </div>
      </section>
    </div>
  )
}
