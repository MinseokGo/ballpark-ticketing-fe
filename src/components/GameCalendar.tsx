import { useMemo, useState, type ReactNode } from 'react'
import type { GameSummaryResponse } from '../api/types'
import { formatKst, kstDateKey } from '../lib/serverTime'
import { teamColor } from '../lib/teamColors'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function monthOf(key: string) {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

/**
 * 월 캘린더. 날짜마다 그날의 경기를 팀 배지로 보여주고, 날짜를 누르면 아래에 그날 경기 목록이 나온다.
 * 날짜는 한국 시각 기준이다.
 */
export function GameCalendar({
  games,
  todayKey,
  renderGame,
}: {
  games: GameSummaryResponse[]
  todayKey: string
  renderGame: (game: GameSummaryResponse) => ReactNode
}) {
  const [view, setView] = useState(() => monthOf(todayKey))
  const [selected, setSelected] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, GameSummaryResponse[]>()
    for (const game of games) {
      const key = kstDateKey(game.startAt)
      map.set(key, [...(map.get(key) ?? []), game])
    }
    for (const list of map.values()) list.sort((a, b) => a.startAt.localeCompare(b.startAt))
    return map
  }, [games])

  const { year, month } = view
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const keyOf = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const shift = (delta: number) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1))
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 })
  }
  const selectedGames = selected ? byDay.get(selected) ?? [] : []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="이전 달"
          className="press flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          ‹
        </button>
        <p className="tabular text-lg font-extrabold">
          {year}년 {month}월
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="다음 달"
          className="press flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          ›
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-semibold text-slate-500 dark:border-slate-800">
          {WEEKDAYS.map((day, index) => (
            <div key={day} className={`py-2 ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-blue-500' : ''}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="min-h-20 border-b border-r border-slate-100 dark:border-slate-800" />
            const key = keyOf(day)
            const dayGames = byDay.get(key) ?? []
            const isToday = key === todayKey
            const isSelected = key === selected
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(isSelected ? null : key)}
                aria-pressed={isSelected}
                className={[
                  'flex min-h-20 flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 sm:p-2',
                  isSelected ? 'bg-blue-50 dark:bg-blue-950/60' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'tabular flex size-6 items-center justify-center rounded-full text-xs font-bold',
                    isToday ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' : 'text-slate-700 dark:text-slate-300',
                  ].join(' ')}
                >
                  {day}
                </span>
                <span className="flex flex-wrap gap-1">
                  {dayGames.slice(0, 3).map((game) => (
                    <span
                      key={game.id}
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: teamColor(game.homeTeam) }}
                      title={`${game.homeTeam} vs ${game.awayTeam}`}
                    />
                  ))}
                  {dayGames.length > 3 && <span className="text-[10px] text-slate-500">+{dayGames.length - 3}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="animate-fade-up space-y-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {formatKst(`${selected}T12:00:00`, { month: 'long', day: 'numeric', weekday: 'short' })} 경기
          </p>
          {selectedGames.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-slate-700">
              이 날은 경기가 없어요.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{selectedGames.map((game) => renderGame(game))}</div>
          )}
        </div>
      )}
    </section>
  )
}
