import { Link } from 'react-router-dom'
import type { GameSummaryResponse } from '../api/types'
import { useLiveState } from '../hooks/useLiveGame'
import { teamColor, teamInitial } from '../lib/teamColors'

const INNINGS = 9
const POLL_MS = 15_000

/** 진행 중인 경기 카드. 점수와 이닝은 서버 진행 상태를 주기적으로 받아 보여준다. */
export function LiveGames({ games }: { games: GameSummaryResponse[] }) {
  if (games.length === 0) return null
  return (
    <div className="grid gap-3">
      {games.map((game) => (
        <LiveCard key={game.id} game={game} />
      ))}
    </div>
  )
}

function LiveCard({ game }: { game: GameSummaryResponse }) {
  const { data: live } = useLiveState(game.id, POLL_MS)
  const inning = live?.inning ?? 0
  const homeScore = live?.homeScore ?? game.homeScore
  const awayScore = live?.awayScore ?? game.awayScore

  return (
    <Link
      to={`/games/${game.id}/live`}
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
          {inning > 0 && live?.half ? `${inning}회 ${live.half === 'TOP' ? '초' : '말'}` : '진행 중'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <TeamScore team={game.awayTeam} score={awayScore} />
        <span className="text-xs font-bold text-slate-300 dark:text-slate-600">vs</span>
        <TeamScore team={game.homeTeam} score={homeScore} alignEnd />
      </div>

      {/* 이닝 진행: 지나간 회는 채우고 현재 회는 반만 채운다. */}
      <div className="mt-4 flex gap-1" aria-label={`${inning}회 진행`}>
        {Array.from({ length: INNINGS }, (_, index) => {
          const number = index + 1
          const done = number < inning
          const current = number === inning
          return (
            <span
              key={number}
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
