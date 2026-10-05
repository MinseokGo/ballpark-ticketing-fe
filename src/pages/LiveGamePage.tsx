import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getGame } from '../api/booking'
import { GameChatPanel } from '../components/GameChatPanel'
import { LiveScoreboard } from '../components/LiveScoreboard'
import { LiveTimeline } from '../components/LiveTimeline'
import { Skeleton } from '../components/Skeleton'
import { useLiveBroadcast, useLiveState } from '../hooks/useLiveGame'

/**
 * 경기 중계 화면. 진행 중이면 실시간으로, 끝난 경기면 전체 기록을 보여준다.
 * 스코어보드(점수·이닝별 득점표) · 중계 기록(선수 이름 포함) · 채팅으로 구성한다.
 */
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
        <Link
          to="/records"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          ← 경기 목록
        </Link>
        {game && game.status === 'OPEN' && (
          <Link
            to={`/booking/${gameId}`}
            className="press rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900"
          >
            좌석 보기
          </Link>
        )}
      </div>

      {gameQuery.isPending && <Skeleton className="h-72 rounded-3xl" />}
      {game && (
        <LiveScoreboard
          game={game}
          live={liveQuery.data}
          events={broadcast.events}
          streaming={broadcast.connected}
        />
      )}

      <section className="animate-fade-up grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">중계 기록</h2>
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
