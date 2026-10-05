import type { LiveEventResponse } from '../api/types'

/** 플레이 종류의 한글 이름과 강조 색(배지). 백엔드 PlayKind와 같은 값을 쓴다. */
export const PLAY_LABEL: Record<string, string> = {
  HIT: '안타',
  DOUBLE: '2루타',
  TRIPLE: '3루타',
  HOME_RUN: '홈런',
  WALK: '볼넷',
  HIT_BY_PITCH: '몸에 맞는 공',
  STRIKEOUT: '삼진',
  GROUND_OUT: '땅볼 아웃',
  FLY_OUT: '뜬공 아웃',
  DOUBLE_PLAY: '병살타',
  STOLEN_BASE: '도루 성공',
  CAUGHT_STEALING: '도루 실패',
  SACRIFICE_FLY: '희생플라이',
  SACRIFICE_BUNT: '희생번트',
  ERROR: '실책',
  WILD_PITCH: '폭투',
  PASSED_BALL: '포일',
}

const HIT_KINDS = new Set(['HIT', 'DOUBLE', 'TRIPLE', 'HOME_RUN'])

export type PlayFilter = 'ALL' | 'SCORE' | 'HIT' | 'K_BB' | 'STEAL' | 'DP'

export const FILTERS: Array<{ value: PlayFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'SCORE', label: '득점' },
  { value: 'HIT', label: '안타·홈런' },
  { value: 'K_BB', label: '삼진·볼넷' },
  { value: 'STEAL', label: '도루' },
  { value: 'DP', label: '병살·실책' },
]

/** 이벤트가 필터에 걸리는지. */
export function matchesFilter(event: LiveEventResponse, filter: PlayFilter): boolean {
  if (filter === 'ALL') return true
  const kind = event.detail ?? ''
  if (filter === 'SCORE') return event.type === 'SCORE_CHANGED'
  if (filter === 'HIT') return HIT_KINDS.has(kind)
  if (filter === 'K_BB') return kind === 'STRIKEOUT' || kind === 'WALK'
  if (filter === 'STEAL') return kind === 'STOLEN_BASE' || kind === 'CAUGHT_STEALING'
  if (filter === 'DP') return kind === 'DOUBLE_PLAY' || kind === 'ERROR'
  return false
}

/** 한 줄 기록 문장. 선수 이름이 있으면 이름을 앞에 둔다. */
export function describePlay(event: LiveEventResponse): string {
  if (event.type === 'GAME_STARTED') return '경기 시작'
  if (event.type === 'GAME_FINISHED') return '경기 종료'
  if (event.type === 'GAME_CANCELLED') return '경기 취소'
  if (event.type === 'INNING_CHANGED') return `${event.inning}회 ${event.half === 'TOP' ? '초' : '말'} 공격 시작`
  if (event.type === 'SCORE_CHANGED') {
    const how = event.detail ? PLAY_LABEL[event.detail] ?? event.detail : '득점'
    return event.playerName ? `${event.playerName} · ${how} 득점` : how
  }
  if (event.type === 'PLAY') {
    const label = PLAY_LABEL[event.detail ?? ''] ?? event.detail ?? '플레이'
    if (event.detail === 'STRIKEOUT' || event.detail === 'WALK' || event.detail === 'HIT_BY_PITCH' || event.detail === 'WILD_PITCH') {
      const batter = event.playerName ? `${event.playerName} ${label}` : label
      return event.secondaryPlayerName ? `${batter} (투수 ${event.secondaryPlayerName})` : batter
    }
    return event.playerName ? `${event.playerName} ${label}` : label
  }
  return event.type
}

export type PlayerLine = {
  id: number
  name: string
  team: string
  hits: number
  homers: number
  runs: number
  strikeouts: number
  walks: number
  steals: number
  caughtStealing: number
  doublePlays: number
  errors: number
  pitchedStrikeouts: number
  pitchedWalks: number
}

/** 선수별 주요 기록을 이벤트에서 집계한다. 주자나 투수는 해당 이벤트의 선수에 붙는다. */
export function aggregatePlayers(events: LiveEventResponse[], home: string, away: string): PlayerLine[] {
  const lines = new Map<number, PlayerLine>()
  const line = (id: number, name: string, team: string) => {
    let entry = lines.get(id)
    if (!entry) {
      entry = {
        id, name, team, hits: 0, homers: 0, runs: 0, strikeouts: 0, walks: 0, steals: 0,
        caughtStealing: 0, doublePlays: 0, errors: 0, pitchedStrikeouts: 0, pitchedWalks: 0,
      }
      lines.set(id, entry)
    }
    return entry
  }
  for (const event of events) {
    const kind = event.detail ?? ''
    if (event.playerId != null && event.playerName) {
      const batter = line(event.playerId, event.playerName, event.teamName ?? '')
      if (event.type === 'SCORE_CHANGED') {
        batter.runs += 1
        if (HIT_KINDS.has(kind)) batter.hits += 1
        if (kind === 'HOME_RUN') batter.homers += 1
      }
      if (event.type === 'PLAY') {
        if (HIT_KINDS.has(kind)) batter.hits += 1
        if (kind === 'HOME_RUN') batter.homers += 1
        if (kind === 'STRIKEOUT') batter.strikeouts += 1
        if (kind === 'WALK') batter.walks += 1
        if (kind === 'STOLEN_BASE') batter.steals += 1
        if (kind === 'CAUGHT_STEALING') batter.caughtStealing += 1
        if (kind === 'DOUBLE_PLAY') batter.doublePlays += 1
        if (kind === 'ERROR') batter.errors += 1
      }
    }
    if (event.type === 'PLAY' && event.secondaryPlayerId != null && event.secondaryPlayerName) {
      // 투수는 타자와 반대 팀 소속이다.
      const pitcherTeam = event.teamName === home ? away : home
      const pitcher = line(event.secondaryPlayerId, event.secondaryPlayerName, pitcherTeam)
      if (kind === 'STRIKEOUT') pitcher.pitchedStrikeouts += 1
      if (kind === 'WALK') pitcher.pitchedWalks += 1
    }
  }
  return [...lines.values()]
}
