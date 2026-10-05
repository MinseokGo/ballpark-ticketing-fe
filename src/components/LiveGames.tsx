import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GameSummaryResponse } from '../api/types'
import { simulateLive, type LiveState } from '../lib/liveMock'
import { teamColor, teamInitial } from '../lib/teamColors'

const TICK_MS = 30_000
const INNINGS = 9

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
    <div className="grid gap-3">
      {games.map((game) => (
        <LiveCard key={game.id} game={game} live={simulateLive(game.id, now)} />
      ))}
    </div>
  )
}

function LiveCard({ game, live }: { game: GameSummaryResponse; live: LiveState }) {
  return (
    <Link
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
        <TeamScore team={game.awayTeam} score={live.awayScore} />
        <span className="text-xs font-bold text-slate-300 dark:text-slate-600">vs</span>
        <TeamScore team={game.homeTeam} score={live.homeScore} alignEnd />
      </div>

      {/* 이닝 진행: 지나간 회는 채우고 현재 회는 반만 채운다. */}
      <div className="mt-4 flex gap-1" aria-label={`${live.inning}회 진행`}>
        {Array.from({ length: INNINGS }, (_, index) => {
          const inning = index + 1
          const done = inning < live.inning
          const current = inning === live.inning
          return (
            <span
              key={inning}
              className={[
                'h-1.5 flex-1 rounded-full',
                done ? 'bg-slate-900 dark:bg-slate-100' : current ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-800',
              ].join(' ')}
            />
          )
        })}
      </div>
    </Link>
  )
}

function TeamScore({ team, score, alignEnd = false }: { team: string; score: number; alignEnd?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${alignEnd ? 'flex-row-reverse text-right' : ''}`}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: teamColor(team) }}
      >
        {teamInitial(team)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{team}</p>
        <p className="tabular text-3xl font-extrabold leading-none">{score}</p>
      </div>
    </div>
  )
}
