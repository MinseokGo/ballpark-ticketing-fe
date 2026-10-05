import type { LiveEventResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

type Team = { home: string; away: string }

const TONE: Record<string, { dot: string; chip: string }> = {
  GAME_STARTED: { dot: 'bg-slate-900 dark:bg-slate-100', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  INNING_CHANGED: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  SCORE_CHANGED: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  SCORE_CORRECTED: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  GAME_FINISHED: { dot: 'bg-slate-900 dark:bg-slate-100', chip: 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' },
  GAME_CANCELLED: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
  PLAY: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
}

function inningLabel(event: LiveEventResponse) {
  return event.inning != null && event.half ? `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'}` : '경기'
}

/** 점수가 오른 쪽을 이전 이벤트와 비교해서 찾는다. */
function scoringTeam(event: LiveEventResponse, prev: LiveEventResponse | null, team: Team): string {
  const home = prev ? event.homeScore - prev.homeScore : event.homeScore
  const away = prev ? event.awayScore - prev.awayScore : event.awayScore
  if (home > away) return team.home
  if (away > home) return team.away
  return ''
}

function titleOf(event: LiveEventResponse, prev: LiveEventResponse | null, team: Team): string {
  switch (event.type) {
    case 'GAME_STARTED':
      return '경기 시작'
    case 'INNING_CHANGED':
      return `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'} 공격 시작`
    case 'SCORE_CHANGED': {
      if (event.playerName) return `${event.playerName} · ${event.detail ?? '득점'}`
      const who = scoringTeam(event, prev, team)
      return who ? `${who} 득점` : '득점'
    }
    case 'PLAY':
      return event.playerName ? `${event.playerName} · ${event.detail ?? '플레이'}` : event.detail ?? '플레이'
    case 'SCORE_CORRECTED':
      return '점수 정정'
    case 'GAME_FINISHED':
      return '경기 종료'
    case 'GAME_CANCELLED':
      return '경기 취소'
    default:
      return event.type
  }
}

/**
 * 실시간 중계 로그. 화면 높이를 꽉 채우고, 새 기록이 맨 위에 올라온다. 모든 줄의 높이는 같고 겹치지 않는다.
 * 스크롤은 이 상자 안에서만 된다.
 */
export function LiveTimeline({ events, team }: { events: LiveEventResponse[]; team?: Team }) {
  const names: Team = team ?? { home: '홈', away: '원정' }

  if (events.length === 0) {
    return (
      <div className="flex h-[min(calc(100svh-260px),760px)] min-h-[360px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">⚾</span>
        <p className="font-semibold">아직 중계 기록이 없어요</p>
        <p className="text-sm text-slate-500">경기가 시작되면 득점과 플레이 소식이 여기에 바로 올라와요.</p>
      </div>
    )
  }

  const feed = events
    .map((event, index) => ({ event, prev: index > 0 ? events[index - 1] : null }))
    .reverse()

  return (
    <ol className="flex h-[min(calc(100svh-260px),760px)] min-h-[360px] flex-col gap-2 overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      {feed.map(({ event, prev }) => {
        const tone = TONE[event.type] ?? TONE.GAME_STARTED
        return (
          <li
            key={event.seq}
            className="animate-fade-up flex h-16 shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span className={`size-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>{inningLabel(event)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{titleOf(event, prev, names)}</p>
              {event.teamName && <p className="truncate text-[11px] text-slate-500">{event.teamName}</p>}
            </div>
            {event.createdAt && (
              <span className="tabular hidden shrink-0 text-[11px] text-slate-400 sm:inline">
                {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <span className="tabular shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-extrabold dark:bg-slate-800">
              {event.homeScore} : {event.awayScore}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
