import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import type { GameSummaryResponse, GameStatus } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { teamColor, teamInitial } from '../lib/teamColors'

// 백엔드 목록 API의 최대 페이지 크기. 데모 데이터(경기 5개)는 한 번에 다 들어온다.
const PAGE_SIZE = 100

const STATUS_LABEL: Record<GameStatus, string> = {
  SCHEDULED: '예매 전',
  OPEN: '예매 중',
  CLOSED: '예매 마감',
}

const STATUS_BADGE: Record<GameStatus, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  CLOSED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}

/** 경기 목록에서 팀 이름을 모은다. 백엔드에 팀 목록 API가 없어서 경기 데이터에서 만든다. */
function collectTeams(games: GameSummaryResponse[]): string[] {
  const teams = new Set<string>()
  for (const game of games) {
    teams.add(game.homeTeam)
    teams.add(game.awayTeam)
  }
  return [...teams].sort((a, b) => a.localeCompare(b, 'ko'))
}

function dateLabel(startAt: string) {
  return new Date(startAt).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TeamSchedulePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 0, PAGE_SIZE],
    queryFn: () => listGames(0, PAGE_SIZE),
  })

  const games = useMemo(() => data?.content ?? [], [data])
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

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <Link to="/" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
          ← 홈
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">팀별 일정</h1>
        <p className="text-sm text-slate-500">팀을 고르면 그 팀의 경기 일정을 날짜순으로 보여줘요.</p>
      </section>

      {isPending && <Skeleton className="h-40" />}
      {isError && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {data && teams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          아직 등록된 경기가 없어요.
        </p>
      )}

      {team && (
        <>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {teams.map((item) => {
              const active = item === team
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPicked(item)}
                  aria-pressed={active}
                  className={[
                    'press flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-transparent bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                  ].join(' ')}
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: teamColor(item) }}
                  >
                    {teamInitial(item)}
                  </span>
                  {item}
                </button>
              )
            })}
          </div>

          <section className="animate-fade-up space-y-3" aria-label={`${team} 일정`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">{team}</h2>
              <p className="tabular text-sm text-slate-500">경기 {schedule.length}개</p>
            </div>

            {schedule.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                이 팀의 예정된 경기가 없어요.
              </p>
            ) : (
              <ul className="space-y-2">
                {schedule.map((game) => {
                  const home = game.homeTeam === team
                  const opponent = home ? game.awayTeam : game.homeTeam
                  const row = (
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="w-14 shrink-0 text-center">
                        <span
                          className={[
                            'inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold',
                            home
                              ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                          ].join(' ')}
                        >
                          {home ? '홈' : '원정'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          <span className="text-slate-400">vs</span> {opponent}
                        </p>
                        <p className="tabular text-sm text-slate-500">{dateLabel(game.startAt)}</p>
                      </div>
                      <span
                        className={['shrink-0 rounded-full px-3 py-1 text-xs font-semibold', STATUS_BADGE[game.status]].join(' ')}
                      >
                        {STATUS_LABEL[game.status] ?? game.status}
                      </span>
                    </div>
                  )
                  return (
                    <li key={game.id}>
                      {game.status === 'OPEN' ? (
                        <Link
                          to={`/booking/${game.id}`}
                          className="press block rounded-2xl transition-transform hover:-translate-y-0.5"
                        >
                          {row}
                        </Link>
                      ) : (
                        <div className="opacity-70">{row}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
