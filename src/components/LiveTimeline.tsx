import { useEffect, useRef } from 'react'
import type { LiveEventResponse } from '../api/types'
import { formatKst } from '../lib/serverTime'

type Team = { home: string; away: string }

type Entry = { event: LiveEventResponse; prev: LiveEventResponse | null }

/** 카드 높이, 카드 사이 간격, 쌓일 때 한 장당 밀리는 간격. 맨 위에서 쌓이는 장수는 STACK_DEPTH로 제한한다. */
const CARD_HEIGHT = 96
// 카드끼리 겹치는 높이. 뒤 카드는 앞 카드 아래로 이만큼만 보이므로, 그 띠(아래쪽)에 제목과 점수를 둔다.
const TAB_HEIGHT = 34
// 스크롤 위치의 카드(포커스)가 맨 앞에 오고, 거기서 멀어질수록 한 단계씩 작아진다(최대 STACK_DEPTH 단계).
const STACK_DEPTH = 3
const STEP_SCALE = 0.04
const FOCUS_SCALE = 1.04

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
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>{inningLabel(event)}</span>
        {event.createdAt && (
          <span className="tabular text-[11px] text-slate-500">
            {formatKst(event.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
      {/* 아래 띠: 뒤에 가려진 카드에서도 여기는 보인다. */}
      <div className="flex items-center gap-3" style={{ height: TAB_HEIGHT }}>
        <p className={`min-w-0 flex-1 truncate font-semibold ${tone.text}`}>{titleOf(event, prev, team)}</p>
        <span className="tabular shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-extrabold dark:bg-slate-800">
          {event.homeScore} : {event.awayScore}
        </span>
      </div>
    </div>
  )
}

/**
 * 중계 기록. 고정 높이 안에서만 스크롤한다. 최신 기록은 카드 더미 맨 위에 올라오고,
 * 바로 전 기록들은 뒤로 밀려 계단식으로 작아지며 겹쳐 보인다. 나머지는 아래 목록으로 이어진다.
 */
export function LiveTimeline({ events, team }: { events: LiveEventResponse[]; team?: Team }) {
  const names: Team = team ?? { home: '홈', away: '원정' }
  const boxRef = useRef<HTMLDivElement>(null)

  // 스크롤 위치(상자 가운데 줄)에 걸린 카드를 포커스로 잡는다. 포커스 카드가 맨 앞에 오고,
  // 거기서 멀어질수록 한 단계씩 작아진다. 스타일은 스크롤 때 직접 바꿔서 다시 그리지 않는다.
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    let frame = 0
    const update = () => {
      frame = 0
      const boxRect = box.getBoundingClientRect()
      const middle = boxRect.top + boxRect.height / 2
      const cards = Array.from(box.querySelectorAll<HTMLElement>('[data-card]'))
      let focus = 0
      let best = Number.POSITIVE_INFINITY
      cards.forEach((el, index) => {
        const rect = el.getBoundingClientRect()
        const gap = Math.abs(rect.top + rect.height / 2 - middle)
        if (gap < best) {
          best = gap
          focus = index
        }
      })
      cards.forEach((el, index) => {
        const distance = Math.abs(index - focus)
        const scale = distance === 0 ? FOCUS_SCALE : 1 - Math.min(distance, STACK_DEPTH) * STEP_SCALE
        el.style.transform = `scale(${scale})`
        el.style.zIndex = String(1000 - distance)
      })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    box.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      box.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [events.length])

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

  return (
    <div ref={boxRef} className="h-[560px] overflow-y-auto rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 pb-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      {newestFirst.map((entry, index) => (
        // 새 기록은 위에 있고, 뒤에 오는 카드는 앞 카드 밑에 겹쳐서 아래 띠만 보인다. 스크롤하면 뒤 카드가 올라온다.
        <div
          key={entry.event.seq}
          data-card
          className="relative transition-transform duration-200 ease-out"
          style={{
            height: CARD_HEIGHT,
            marginTop: index === 0 ? 0 : TAB_HEIGHT - CARD_HEIGHT,
          }}
        >
          {/* 새 카드만 멀리서 다가오는 등장을 한다. 이미 있던 카드는 key가 같아서 다시 움직이지 않는다. */}
          <div className={index === 0 ? 'animate-rise h-full' : 'h-full'}>
            <EventCard entry={entry} team={names} />
          </div>
        </div>
      ))}
    </div>
  )
}
