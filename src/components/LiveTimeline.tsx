import type { LiveEventResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

type Team = { home: string; away: string }

type Entry = { event: LiveEventResponse; prev: LiveEventResponse | null }

/** 맨 위에 겹쳐 보이는 최신 카드 수. 나머지는 아래 목록으로 내려간다. */
const DECK_SIZE = 4
const CARD_HEIGHT = 84
const STEP_Y = 14
const STEP_SCALE = 0.04

const TONE: Record<string, { dot: string; text: string; chip: string }> = {
  GAME_STARTED: {
    dot: 'bg-slate-900 dark:bg-slate-100',
    text: 'text-slate-700 dark:text-slate-200',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  INNING_CHANGED: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  SCORE_CHANGED: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  SCORE_CORRECTED: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  GAME_FINISHED: {
    dot: 'bg-slate-900 dark:bg-slate-100',
    text: 'text-slate-900 dark:text-slate-50',
    chip: 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900',
  },
  GAME_CANCELLED: {
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    chip: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
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

function EventCard({ entry, team }: { entry: Entry; team: Team }) {
  const { event, prev } = entry
  const tone = TONE[event.type] ?? TONE.GAME_STARTED
  return (
    <div className="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 pr-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={`size-2.5 shrink-0 rounded-full ${tone.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>{inningLabel(event)}</span>
          {event.createdAt && (
            <span className="tabular text-[11px] text-slate-500">
              {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <p className={`mt-1 truncate font-semibold ${tone.text}`}>{titleOf(event, prev, team)}</p>
      </div>
      <span className="tabular shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-extrabold dark:bg-slate-800">
        {event.homeScore} : {event.awayScore}
      </span>
    </div>
  )
}

/**
 * 중계 기록. 고정 높이 안에서만 스크롤한다. 최신 기록은 카드 더미 맨 위에 올라오고,
 * 바로 전 기록들은 뒤로 밀려 계단식으로 작아지며 겹쳐 보인다. 나머지는 아래 목록으로 이어진다.
 */
export function LiveTimeline({ events, team }: { events: LiveEventResponse[]; team?: Team }) {
  const names: Team = team ?? { home: '홈', away: '원정' }

  if (events.length === 0) {
    return (
      <div className="flex h-[560px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">⚾</span>
        <p className="font-semibold">아직 중계 기록이 없어요</p>
        <p className="text-sm text-slate-500">경기가 시작되면 득점과 이닝 소식이 여기에 바로 올라와요.</p>
      </div>
    )
  }

  const entries: Entry[] = events.map((event, index) => ({ event, prev: index > 0 ? events[index - 1] : null }))
  const newestFirst = [...entries].reverse()
  const deck = newestFirst.slice(0, DECK_SIZE)
  const archive = newestFirst.slice(DECK_SIZE)

  return (
    <div className="h-[560px] overflow-y-auto rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="depth-stage relative" style={{ height: CARD_HEIGHT + (DECK_SIZE - 1) * STEP_Y + 8 }}>
        {deck.map((entry, index) => (
          <div
            key={entry.event.seq}
            className="absolute inset-x-0 top-0 transition-[transform,opacity] duration-500 ease-out"
            style={{
              height: CARD_HEIGHT,
              zIndex: DECK_SIZE - index,
              opacity: 1 - index * 0.18,
              transform: `translate3d(0, ${index * STEP_Y}px, ${-index * 30}px) scale(${1 - index * STEP_SCALE})`,
              transformOrigin: 'center top',
            }}
          >
            {/* 새 카드는 멀리서 다가오는 등장을 한 번 한다. 이미 있던 카드는 key가 같아서 다시 움직이지 않는다. */}
            <div className={index === 0 ? 'animate-rise h-full' : 'h-full'}>
              <EventCard entry={entry} team={names} />
            </div>
          </div>
        ))}
      </div>

      {archive.length > 0 && (
        <ol className="mt-3 space-y-2">
          {archive.map((entry) => (
            <li
              key={entry.event.seq}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900"
            >
              <span className={`size-1.5 shrink-0 rounded-full ${(TONE[entry.event.type] ?? TONE.GAME_STARTED).dot}`} />
              <span className="min-w-0 flex-1 truncate">
                {inningLabel(entry.event)} · {titleOf(entry.event, entry.prev, names)}
              </span>
              <span className="tabular shrink-0 text-xs font-semibold">
                {entry.event.homeScore} : {entry.event.awayScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
