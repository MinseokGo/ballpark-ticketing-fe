import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGame, getGameEvents } from '../api/booking'
import type { LiveEventResponse } from '../api/types'
import { LiveScoreboard } from '../components/LiveScoreboard'
import { Skeleton } from '../components/Skeleton'
import { FILTERS, aggregatePlayers, describePlay, matchesFilter, PLAY_LABEL, type PlayFilter, type PlayerLine } from '../lib/gameRecord'
import { formatKst } from '../lib/serverTime'
import { teamColor } from '../lib/teamColors'

/** 경기 기록: 플레이 흐름(이닝별), 선수 기록(팀별 타자·투수). 끝난 경기와 진행 중 경기 모두 본다. */
export function RecordPage() {
  const { gameId: gameIdParam } = useParams<{ gameId: string }>()
  const gameId = Number(gameIdParam)
  const [filter, setFilter] = useState<PlayFilter>('ALL')
  const gameQuery = useQuery({ queryKey: ['game', gameId], queryFn: () => getGame(gameId), enabled: Number.isFinite(gameId) })
  const eventsQuery = useQuery({ queryKey: ['events', gameId], queryFn: () => getGameEvents(gameId), enabled: Number.isFinite(gameId) })

  const game = gameQuery.data
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data])
  const players = useMemo(
    () => (game ? aggregatePlayers(events, game.homeTeam, game.awayTeam) : []),
    [events, game],
  )
  const visible = events.filter((event) => matchesFilter(event, filter))
  const plays = visible.filter((event) => event.type !== 'GAME_STARTED')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/records" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
          ← 경기 목록
        </Link>
        {game && (
          <Link
            to={`/games/${gameId}/live`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-slate-300 dark:border-slate-700"
          >
            중계 화면
          </Link>
        )}
      </div>

      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">경기 기록</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{game ? `${game.awayTeam} vs ${game.homeTeam}` : '경기 기록'}</h1>
      </header>

      {(gameQuery.isPending || eventsQuery.isPending) && <Skeleton className="h-72 rounded-3xl" />}
      {game && <LiveScoreboard game={game} live={undefined} events={events} streaming={false} />}

      {game && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0 space-y-4">
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={[
                    'press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                    filter === item.value
                      ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                      : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {plays.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
                {events.length === 0 ? '기록이 아직 없어요.' : '이 조건에 맞는 기록이 없어요.'}
              </p>
            ) : (
              <PlayList events={plays} />
            )}
          </section>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
            <TeamBox team={game.awayTeam} players={players} />
            <TeamBox team={game.homeTeam} players={players} />
          </aside>
        </div>
      )}
    </div>
  )
}

/** 이닝별로 묶은 플레이 흐름. 시간순(첫 이닝이 위)이다. */
function PlayList({ events }: { events: LiveEventResponse[] }) {
  const groups: Array<{ key: string; label: string; items: LiveEventResponse[] }> = []
  for (const event of events) {
    const label = event.inning != null && event.half ? `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'}` : '경기'
    const key = event.inning != null && event.half ? `${event.inning}-${event.half}` : 'meta'
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(event)
    else groups.push({ key, label, items: [event] })
  }
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={`${group.key}-${group.items[0].seq}`} aria-label={group.label}>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-slate-50 dark:text-slate-900">{group.label}</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <ol className="space-y-2">
            {group.items.map((event) => (
              <PlayRow key={event.seq} event={event} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function PlayRow({ event }: { event: LiveEventResponse }) {
  const isScore = event.type === 'SCORE_CHANGED'
  const isMeta = event.type !== 'PLAY' && !isScore
  const color = event.teamName ? teamColor(event.teamName) : isScore ? '#10b981' : '#94a3b8'
  return (
    <li
      className={[
        'animate-fade-up flex items-center gap-3 rounded-2xl border bg-white p-3 pr-4 dark:bg-slate-900',
        isScore ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-200 dark:border-slate-800',
        isMeta ? 'py-2' : '',
      ].join(' ')}
    >
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {event.detail && event.type === 'PLAY' && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {PLAY_LABEL[event.detail] ?? event.detail}
            </span>
          )}
          {event.teamName && <span className="truncate text-[11px] text-slate-500">{event.teamName}</span>}
        </div>
        <p className={`mt-0.5 truncate font-semibold ${isScore ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>{describePlay(event)}</p>
        {event.createdAt && (
          <p className="tabular mt-0.5 text-[11px] text-slate-400">
            {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>
      {(isScore || event.type === 'GAME_FINISHED') && (
        <span className="tabular shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-extrabold dark:bg-slate-800">
          {event.homeScore} : {event.awayScore}
        </span>
      )}
    </li>
  )
}

/** 팀 박스스코어: 타자 기록과 투수 기록. */
function TeamBox({ team, players }: { team: string; players: PlayerLine[] }) {
  const batters = players.filter((player) => player.team === team && (player.hits + player.runs + player.strikeouts + player.walks + player.steals + player.doublePlays + player.errors + player.caughtStealing) > 0)
  const pitchers = players.filter((player) => player.team === team && (player.pitchedStrikeouts + player.pitchedWalks) > 0)
  const totals = batters.reduce(
    (sum, player) => ({
      hits: sum.hits + player.hits,
      runs: sum.runs + player.runs,
      steals: sum.steals + player.steals,
      doublePlays: sum.doublePlays + player.doublePlays,
    }),
    { hits: 0, runs: 0, steals: 0, doublePlays: 0 },
  )
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <span className="size-3 rounded-full" style={{ backgroundColor: teamColor(team) }} />
        <h2 className="font-extrabold">{team}</h2>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="안타" value={totals.hits} />
        <Stat label="득점" value={totals.runs} />
        <Stat label="도루" value={totals.steals} />
        <Stat label="병살" value={totals.doublePlays} />
      </div>

      {batters.length === 0 ? (
        <p className="text-sm text-slate-500">타자 기록이 없어요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="tabular w-full min-w-max text-center text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="px-2 py-1 text-left font-semibold">타자</th>
                <th className="px-2 py-1 font-semibold">안타</th>
                <th className="px-2 py-1 font-semibold">홈런</th>
                <th className="px-2 py-1 font-semibold">득점</th>
                <th className="px-2 py-1 font-semibold">삼진</th>
                <th className="px-2 py-1 font-semibold">볼넷</th>
                <th className="px-2 py-1 font-semibold">도루</th>
                <th className="px-2 py-1 font-semibold">병살</th>
              </tr>
            </thead>
            <tbody>
              {batters.map((player) => (
                <tr key={player.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2 text-left font-semibold">{player.name}</td>
                  <td className="px-2 py-2">{player.hits}</td>
                  <td className="px-2 py-2">{player.homers}</td>
                  <td className="px-2 py-2">{player.runs}</td>
                  <td className="px-2 py-2">{player.strikeouts}</td>
                  <td className="px-2 py-2">{player.walks}</td>
                  <td className="px-2 py-2">
                    {player.steals}
                    {player.caughtStealing > 0 && <span className="text-slate-400"> / {player.caughtStealing}실패</span>}
                  </td>
                  <td className="px-2 py-2">{player.doublePlays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pitchers.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-slate-500">투수</p>
          {pitchers.map((player) => (
            <div key={player.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950">
              <span className="font-semibold">{player.name}</span>
              <span className="tabular text-xs text-slate-500">
                탈삼진 <b className="text-slate-900 dark:text-slate-50">{player.pitchedStrikeouts}</b> · 볼넷 허용 <b className="text-slate-900 dark:text-slate-50">{player.pitchedWalks}</b>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 py-2 dark:bg-slate-950">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="tabular text-lg font-extrabold">{value}</p>
    </div>
  )
}
