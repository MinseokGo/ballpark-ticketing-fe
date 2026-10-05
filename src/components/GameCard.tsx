import { Link } from 'react-router-dom'
import { teamColor, teamInitial } from '../lib/teamColors'
import type { GameSummaryResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: '예매 전',
  OPEN: '예매 중',
  CLOSED: '예매 마감',
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  CLOSED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}

function TeamBadge({ team }: { team: string }) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: teamColor(team) }}
    >
      {teamInitial(team)}
    </span>
  )
}

export function GameCard({ game }: { game: GameSummaryResponse }) {
  const open = game.status === 'OPEN'

  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex shrink-0 -space-x-2">
        <TeamBadge team={game.homeTeam} />
        <TeamBadge team={game.awayTeam} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {game.homeTeam} <span className="text-slate-400">vs</span> {game.awayTeam}
        </p>
        <p className="tabular text-sm text-slate-500">
          {formatKst(game.startAt, {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
      <span className={['shrink-0 rounded-full px-3 py-1 text-xs font-semibold', STATUS_BADGE[game.status]].join(' ')}>
        {STATUS_LABEL[game.status] ?? game.status}
      </span>
    </div>
  )

  if (!open) {
    return <div className="opacity-60">{content}</div>
  }
  return (
    <Link
      to={`/booking/${game.id}`}
      className="group block rounded-2xl transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
    >
      {content}
    </Link>
  )
}
