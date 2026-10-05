import type { LiveEventResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

const DOT: Record<string, string> = {
  GAME_STARTED: 'bg-slate-900 dark:bg-slate-100',
  INNING_CHANGED: 'bg-blue-500',
  SCORE_CHANGED: 'bg-emerald-500',
  SCORE_CORRECTED: 'bg-amber-500',
  GAME_FINISHED: 'bg-slate-900 dark:bg-slate-100',
  GAME_CANCELLED: 'bg-red-500',
}

function describe(event: LiveEventResponse): string {
  const score = `${event.homeScore} : ${event.awayScore}`
  switch (event.type) {
    case 'GAME_STARTED':
      return '경기 시작'
    case 'INNING_CHANGED':
      return `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'} 시작 · ${score}`
    case 'SCORE_CHANGED':
      return `득점 · ${score}`
    case 'SCORE_CORRECTED':
      return `점수 정정 · ${score}`
    case 'GAME_FINISHED':
      return `경기 종료 · ${score}`
    case 'GAME_CANCELLED':
      return '경기 취소'
    default:
      return event.type
  }
}

/** 중계 기록. 최신 이벤트가 위에 온다. */
export function LiveTimeline({ events }: { events: LiveEventResponse[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        아직 중계 기록이 없어요. 경기가 진행되면 여기에 바로 올라와요.
      </p>
    )
  }
  return (
    <ol className="space-y-2">
      {[...events].reverse().map((event) => (
        <li
          key={event.seq}
          className="animate-fade-up flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[event.type] ?? 'bg-slate-400'}`} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{describe(event)}</p>
            <p className="tabular mt-0.5 text-xs text-slate-500">
              {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
