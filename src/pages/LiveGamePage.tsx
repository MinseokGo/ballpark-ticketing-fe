import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getGame } from '../api/booking'
import { GameScoreBanner } from '../components/GameScoreBanner'
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

      <section className="animate-fade-up grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-3">
          <h2 className="text-lg font-bold">중계 기록</h2>
          <LiveTimeline events={broadcast.events} />
        </div>
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-700 dark:text-slate-300">연결 상태</p>
          <p className="mt-1">{broadcast.connected ? '실시간으로 받고 있어요.' : '연결을 다시 시도하고 있어요.'}</p>
          <p className="mt-3 text-xs">기록은 경기 진행에 맞춰 바로 올라오고, 연결이 끊겨도 빠진 기록을 이어서 받아요.</p>
        </aside>
      </section>
    </div>
  )
}
