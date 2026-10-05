import type { LiveEventResponse } from '../api/types'

export type Linescore = {
  innings: number
  away: number[]
  home: number[]
  awayTotal: number
  homeTotal: number
}

/**
 * 이벤트 기록으로 이닝별 득점표를 만든다. 점수가 오른 만큼 공격 중인 팀(초=원정, 말=홈)의 그 이닝 득점이다.
 * 기록은 번호 순서대로 들어와야 한다.
 */
export function computeLinescore(events: LiveEventResponse[]): Linescore {
  const away: number[] = []
  const home: number[] = []
  let prevHome = 0
  let prevAway = 0
  let innings = 0
  for (const event of events) {
    if (event.inning != null) innings = Math.max(innings, event.inning)
    const deltaHome = event.homeScore - prevHome
    const deltaAway = event.awayScore - prevAway
    prevHome = event.homeScore
    prevAway = event.awayScore
    if (event.inning == null || !event.half || (deltaHome === 0 && deltaAway === 0)) continue
    const table = event.half === 'TOP' ? away : home
    const index = event.inning - 1
    while (table.length <= index) table.push(0)
    table[index] += event.half === 'TOP' ? deltaAway : deltaHome
  }
  const count = Math.max(innings, away.length, home.length, 9)
  for (let i = 0; i < count; i++) {
    if (away[i] == null) away[i] = 0
    if (home[i] == null) home[i] = 0
  }
  return {
    innings: count,
    away,
    home,
    awayTotal: prevAway,
    homeTotal: prevHome,
  }
}
