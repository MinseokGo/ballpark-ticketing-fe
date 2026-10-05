import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { listAllGames } from '../api/booking'
import type { GameSummaryResponse } from '../api/types'
import { GameCalendar } from '../components/GameCalendar'
import { GameTile } from '../components/GameTile'
import { Skeleton } from '../components/Skeleton'
import { kstDateKey } from '../lib/serverTime'
import { teamColor, teamInitial } from '../lib/teamColors'

// 백엔드 목록 API의 최대 페이지 크기. 데모 데이터(경기 5개)는 한 번에 다 들어온다.

/** 경기 목록에서 팀 이름을 모은다. 백엔드에 팀 목록 API가 없어서 경기 데이터에서 만든다. */
function collectTeams(games: GameSummaryResponse[]): string[] {
  const teams = new Set<string>()
  for (const game of games) {
    teams.add(game.homeTeam)
    teams.add(game.awayTeam)
  }
  return [...teams].sort((a, b) => a.localeCompare(b, 'ko'))
}

export function TeamSchedulePage() {
  const [now] = useState(() => new Date())
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => listAllGames(),
  })

  const games = useMemo(() => data ?? [], [data])
  const teams = useMemo(() => collectTeams(games), [games])
  const [picked, setPicked] = useState<string | null>(null)
  // 고른 팀이 목록에서 사라지면(데이터 변경) 첫 팀으로 되돌린다.
  const team = picked && teams.includes(picked) ? picked : (teams[0] ?? null)

  const schedule = useMemo(
    () =>
      games
        .filter((game) => game.homeTeam === team || game.awayTeam === team)
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [games, team],
  )
  const openCount = schedule.filter((game) => game.status === 'OPEN').length

  return (
    <div className="space-y-6">
      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">일정</p>
        <h1 className="text-3xl font-extrabold tracking-tight">팀별 일정</h1>
        <p className="text-sm text-slate-500">응원하는 팀을 고르면 그 팀의 경기를 날짜순으로 보여줘요.</p>
      </header>

      {isPending && <Skeleton className="h-96" />}
      {isError && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {data && teams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          아직 등록된 경기가 없어요.
        </p>
      )}

      {team && (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-3 lg:sticky lg:top-24 dark:border-slate-800 dark:bg-slate-900">
            <p className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-500">팀 {teams.length}개</p>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              {teams.map((item) => {
                const active = item === team
                return (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => setPicked(item)}
                      aria-pressed={active}
                      className={[
                        'press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                        active
                          ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: teamColor(item) }}
                      >
                        {teamInitial(item)}
                      </span>
                      <span className="min-w-0 truncate">{item}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <section aria-label={`${team} 일정`} className="animate-fade-up min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-3xl p-6 text-white" style={{ backgroundImage: `linear-gradient(135deg, ${teamColor(team)}, #0F172A)` }}>
              <span className="flex size-14 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
                {teamInitial(team)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/70">선택한 팀</p>
                <p className="truncate text-2xl font-extrabold tracking-tight">{team}</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-white/70">경기</p>
                  <p className="tabular text-2xl font-extrabold">{schedule.length}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">예매 중</p>
                  <p className="tabular text-2xl font-extrabold">{openCount}</p>
                </div>
              </div>
            </div>

            <GameCalendar
              games={schedule}
              todayKey={kstDateKey(now)}
              renderGame={(game) => <GameTile key={game.id} game={game} now={now} perspective={team} />}
            />

            {schedule.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                이 팀의 예정된 경기가 없어요.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {schedule.map((game) => (
                  <GameTile key={game.id} game={game} now={now} perspective={team} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
