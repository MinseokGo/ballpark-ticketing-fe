import type { GameProgress, Winner } from '../api/types'

/** 승부 문구. 기준 팀이 없으면 "홈 승" 같은 형식으로 쓴다. */
export function winnerLabel(winner: Winner | null, homeTeam: string, awayTeam: string): string {
  if (winner === 'HOME') return `${homeTeam} 승`
  if (winner === 'AWAY') return `${awayTeam} 승`
  if (winner === 'DRAW') return '무승부'
  return ''
}

/** 특정 팀 기준 결과: 승·패·무. 경기가 끝나지 않았으면 null. */
export function resultFor(team: string, game: { homeTeam: string; awayTeam: string; winner: Winner | null }): '승' | '패' | '무' | null {
  if (game.winner === null) return null
  if (game.winner === 'DRAW') return '무'
  const teamWon = (game.winner === 'HOME') === (team === game.homeTeam)
  return teamWon ? '승' : '패'
}

export function isLive(progress: GameProgress): boolean {
  return progress === 'LIVE'
}
