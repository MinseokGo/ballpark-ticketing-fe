import { Link } from 'react-router-dom'
import type { GameStatus, GameSummaryResponse } from '../api/types'
import { resultFor, winnerLabel } from '../lib/gameResult'
import { teamColor, teamInitial } from '../lib/teamColors'
import { formatKst, kstDateKey, kstDay, parseServerTime } from '../lib/serverTime'

const STATUS_LABEL: Record<GameStatus, string> = {
  SCHEDULED: '예매 전',
  OPEN: '예매 중',
  CLOSED: '예매 마감',
}

const STATUS_DOT: Record<GameStatus, string> = {
  SCHEDULED: 'bg-slate-400',
  OPEN: 'bg-blue-500',
  CLOSED: 'bg-slate-300',
}

const STATUS_TEXT: Record<GameStatus, string> = {
  SCHEDULED: 'text-slate-500 dark:text-slate-400',
  OPEN: 'text-blue-700 dark:text-blue-300',
  CLOSED: 'text-slate-400 dark:text-slate-500',
}

function sameDay(a: Date, b: Date) {
  return kstDateKey(a) === kstDateKey(b)
}

/**
 * 경기 한 줄을 날짜 블록·팀 배지·예매 상태로 보여주는 카드. 예매 중인 경기만 누를 수 있다.
 * 오늘 경기는 "오늘" 표시를 붙인다.
 */
/**
 * perspective를 주면 그 팀 기준으로 승·패·무를 보여준다(팀별 일정). 없으면 승부 팀을 보여준다.
 */
export function GameTile({
  game,
  now,
  perspective,
}: {
  game: GameSummaryResponse
  now: Date
  perspective?: string
}) {
  const start = parseServerTime(game.startAt)
  const today = sameDay(start, now)
  const open = game.status === 'OPEN'

  const body = (
    <div className="flex items-center gap-4 p-4">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-100 py-2 dark:bg-slate-800">
        <span className="text-[11px] font-semibold text-slate-500">
          {formatKst(start, { month: 'short' })}
        </span>
        <span className="tabular text-xl font-extrabold leading-none">{kstDay(start)}</span>
        <span className="mt-0.5 text-[11px] text-slate-500">{formatKst(start, { weekday: 'short' })}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {today && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-slate-50 dark:text-slate-900">
              오늘
            </span>
          )}
          <p className="tabular text-xs text-slate-500">
            {formatKst(start, { hour: 'numeric', minute: '2-digit' })} 시작
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-sm font-bold">
          <TeamChip team={game.homeTeam} />
          <span className="text-xs font-semibold text-slate-400">vs</span>
          <TeamChip team={game.awayTeam} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          홈 {game.homeTeam} · 원정 {game.awayTeam}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {game.progress === 'LIVE' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
            <span className="size-1.5 rounded-full bg-red-500" />
            LIVE {game.homeScore} : {game.awayScore}
          </span>
        ) : game.progress === 'FINISHED' ? (
          <div className="flex flex-col items-end gap-1">
            <span className="tabular text-sm font-extrabold">
              {game.homeScore} : {game.awayScore}
            </span>
            <ResultChip game={game} perspective={perspective} />
          </div>
        ) : (
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${STATUS_TEXT[game.status]}`}>
            <span className={`size-1.5 rounded-full ${STATUS_DOT[game.status]}`} />
            {STATUS_LABEL[game.status] ?? game.status}
          </span>
        )}
        {open && (
          <span aria-hidden className="text-blue-600 transition-transform group-hover:translate-x-1 dark:text-blue-400">
            →
          </span>
        )}
      </div>
    </div>
  )

  const shell =
    'group block rounded-2xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900'

  if (!open) {
    return <div className={`${shell} opacity-70`}>{body}</div>
  }
  return (
    <Link
      to={`/booking/${game.id}`}
      className={`${shell} press hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700`}
    >
      {body}
    </Link>
  )
}

function ResultChip({ game, perspective }: { game: GameSummaryResponse; perspective?: string }) {
  if (perspective) {
    const result = resultFor(perspective, game)
    if (!result) return null
    const tone =
      result === '승'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>{result}</span>
  }
  const label = winnerLabel(game.winner, game.homeTeam, game.awayTeam)
  if (!label) return null
  return <span className="text-[11px] font-semibold text-slate-500">{label}</span>
}

function TeamChip({ team }: { team: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: teamColor(team) }}
      >
        {teamInitial(team)}
      </span>
      <span className="truncate">{team}</span>
    </span>
  )
}
