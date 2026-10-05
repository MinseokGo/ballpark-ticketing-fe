import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameSummaryResponse } from '../api/types'
import { simulateLive } from '../lib/liveMock'
import { teamColor, teamInitial } from '../lib/teamColors'

const TICK_MS = 30_000

/** 진행 중인 경기를 카드로 보여준다. 이닝·점수는 liveMock 시뮬레이션 값이다. */
export function LiveGames({ games }: { games: GameSummaryResponse[] }) {
  // 30초마다 시뮬레이션 시각을 갱신한다. 렌더 중에 Date.now()를 읽지 않도록 상태로 둔다.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  if (games.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {games.map((game) => {
        const live = simulateLive(game.id, now)
        const home = teamColor(game.homeTeam)
        const away = teamColor(game.awayTeam)
        return (
          <Link
            key={game.id}
            to={`/booking/${game.id}`}
            className="press group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
                </span>
                LIVE
              </span>
              <span className="tabular text-xs font-semibold text-slate-500">
                {live.inning}회 {live.half === 'top' ? '초' : '말'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <TeamScore team={game.awayTeam} score={live.awayScore} color={away} />
              <span className="text-xs font-bold text-slate-300 dark:text-slate-600">vs</span>
              <TeamScore team={game.homeTeam} score={live.homeScore} color={home} alignEnd />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function TeamScore({
  team,
  score,
  color,
  alignEnd = false,
}: {
  team: string
  score: number
  color: string
  alignEnd?: boolean
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${alignEnd ? 'flex-row-reverse text-right' : ''}`}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {teamInitial(team)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{team}</p>
        <p className="tabular text-2xl font-extrabold">{score}</p>
      </div>
    </div>
  )
}
