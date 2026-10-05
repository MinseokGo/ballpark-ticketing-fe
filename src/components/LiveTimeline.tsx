import type { LiveEventResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

type Team = { home: string; away: string }

type Group = { key: string; label: string; events: Array<{ event: LiveEventResponse; prev: LiveEventResponse | null }> }

const TONE: Record<string, { dot: string; ring: string; text: string }> = {
  GAME_STARTED: { dot: 'bg-slate-900 dark:bg-slate-100', ring: 'ring-slate-200 dark:ring-slate-700', text: 'text-slate-700 dark:text-slate-200' },
  INNING_CHANGED: { dot: 'bg-blue-500', ring: 'ring-blue-100 dark:ring-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  SCORE_CHANGED: { dot: 'bg-emerald-500', ring: 'ring-emerald-100 dark:ring-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
  SCORE_CORRECTED: { dot: 'bg-amber-500', ring: 'ring-amber-100 dark:ring-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  GAME_FINISHED: { dot: 'bg-slate-900 dark:bg-slate-100', ring: 'ring-slate-200 dark:ring-slate-700', text: 'text-slate-900 dark:text-slate-50' },
  GAME_CANCELLED: { dot: 'bg-red-500', ring: 'ring-red-100 dark:ring-red-950', text: 'text-red-600 dark:text-red-400' },
}

function groupKey(event: LiveEventResponse) {
  return event.inning != null && event.half ? `${event.inning}-${event.half}` : 'meta'
}

function groupLabel(event: LiveEventResponse) {
  return event.inning != null && event.half ? `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'}` : '경기'
}

/** 이벤트를 이닝별로 묶는다. 입력은 번호 오름차순, 출력 그룹은 최신이 위로 오도록 뒤집는다. */
function groupEvents(events: LiveEventResponse[]): Group[] {
  const groups: Group[] = []
  events.forEach((event, index) => {
    const key = groupKey(event)
    const prev = index > 0 ? events[index - 1] : null
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.events.push({ event, prev })
    } else {
      groups.push({ key: `${key}-${event.seq}`, label: groupLabel(event), events: [{ event, prev }] })
    }
  })
  return groups
    .reverse()
    .map((group) => ({ ...group, events: [...group.events].reverse() }))
}

/** 점수가 오른 쪽을 이전 이벤트와 비교해서 찾는다. 같은 이벤트를 두 번 받아도 점수가 같으니 득점 팀이 안 바뀐다. */
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
      const who = scoringTeam(event, prev, team)
      return who ? `${who} 득점` : '득점'
    }
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

/** 중계 기록. 이닝별로 묶여 있고, 최신 이벤트가 위에 온다. */
export function LiveTimeline({ events, team }: { events: LiveEventResponse[]; team?: Team }) {
  const names: Team = team ?? { home: '홈', away: '원정' }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">⚾</span>
        <p className="font-semibold">아직 중계 기록이 없어요</p>
        <p className="text-sm text-slate-500">경기가 시작되면 득점과 이닝 소식이 여기에 바로 올라와요.</p>
      </div>
    )
  }

  const groups = groupEvents(events)
  return (
    <div className="depth-stage space-y-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-slate-50 dark:text-slate-900">
              {group.label}
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <ol className="relative space-y-2 pl-6 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
            {group.events.map(({ event, prev }) => {
              const tone = TONE[event.type] ?? TONE.GAME_STARTED
              return (
                <li
                  key={event.seq}
                  className="animate-rise relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 pr-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <span
                    className={`absolute -left-6 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full ring-4 ${tone.ring} bg-white dark:bg-slate-950`}
                  >
                    <span className={`size-2 rounded-full ${tone.dot}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${tone.text}`}>{titleOf(event, prev, names)}</p>
                    {event.createdAt && (
                      <p className="tabular mt-0.5 text-xs text-slate-500">
                        {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span className="tabular shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-extrabold dark:bg-slate-800">
                    {event.homeScore} : {event.awayScore}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
