import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listAllGames } from '../api/booking'
import type { GameStatus } from '../api/types'
import { kstDateKey } from '../lib/serverTime'
import { GameCalendar } from '../components/GameCalendar'
import { GameTile } from '../components/GameTile'
import { SkeletonList } from '../components/Skeleton'

type Filter = 'ALL' | GameStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'OPEN', label: '예매 중' },
  { value: 'SCHEDULED', label: '예매 전' },
  { value: 'CLOSED', label: '예매 마감' },
]

export function BookingGamesPage() {
  // 마운트 시점 한 번만 읽어서 렌더 중에 시각이 흔들리지 않게 한다.
  const [now] = useState(() => new Date())
  const [filter, setFilter] = useState<Filter>('ALL')
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 0, 50],
    queryFn: () => listAllGames(),
    refetchInterval: 15_000,
  })

  const games = (data ?? [])
    .filter((game) => filter === 'ALL' || game.status === filter)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div className="space-y-6">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">예매</p>
          <h1 className="text-3xl font-extrabold tracking-tight">경기 고르기</h1>
          <p className="text-sm text-slate-500">예매 중인 경기만 좌석을 고를 수 있어요.</p>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((item) => {
            const active = filter === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={[
                  'press shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>

      {isPending && <SkeletonList count={6} />}
      {isError && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          경기 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {data && games.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          해당하는 경기가 없어요.
        </p>
      )}

      <GameCalendar
        games={games}
        todayKey={kstDateKey(now)}
        renderGame={(game) => <GameTile key={game.id} game={game} now={now} />}
      />

      <div className="depth-stage grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game, index) => (
          <div key={game.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
            <GameTile game={game} now={now} />
          </div>
        ))}
      </div>
    </div>
  )
}
