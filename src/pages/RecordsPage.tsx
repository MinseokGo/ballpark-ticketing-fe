import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import { Skeleton } from '../components/Skeleton'
import { winnerLabel } from '../lib/gameResult'
import { formatKst } from '../lib/serverTime'
import { teamColor, teamInitial } from '../lib/teamColors'

/** 끝난 경기 기록 목록. 카드를 누르면 그 경기의 전체 중계 기록과 채팅 기록을 본다. */
export function RecordsPage() {
  const [page] = useState(0)
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 'finished', page],
    queryFn: () => listGames(page, 50, 'FINISHED'),
  })

  const games = [...(data?.content ?? [])].sort((a, b) => b.startAt.localeCompare(a.startAt))

  return (
    <div className="space-y-6">
      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">경기 기록</p>
        <h1 className="text-3xl font-extrabold tracking-tight">끝난 경기</h1>
        <p className="text-sm text-slate-500">카드를 누르면 득점 흐름과 선수 기록을 다시 볼 수 있어요.</p>
      </header>

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      )}
      {isError && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {data && games.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          아직 끝난 경기가 없어요.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game, index) => (
          <Link
            key={game.id}
            to={`/games/${game.id}/record`}
            className="animate-fade-up press group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="tabular text-xs font-semibold text-slate-500">
                {formatKst(game.startAt, { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                최종
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <TeamMini team={game.awayTeam} />
              <p className="tabular text-3xl font-extrabold">
                {game.awayScore} <span className="text-slate-300 dark:text-slate-600">:</span> {game.homeScore}
              </p>
              <TeamMini team={game.homeTeam} align="right" />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
              <span>{winnerLabel(game.winner, game.homeTeam, game.awayTeam) || '결과'}</span>
              <span className="font-semibold text-blue-600 transition-transform group-hover:translate-x-1 dark:text-blue-400">
                기록 보기 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TeamMini({ team, align = 'left' }: { team: string; align?: 'left' | 'right' }) {
  const right = align === 'right'
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: teamColor(team) }}
      >
        {teamInitial(team)}
      </span>
      <p className="truncate text-sm font-semibold">{team}</p>
    </div>
  )
}
