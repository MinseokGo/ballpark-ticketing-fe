/** 승률은 KBO처럼 .571 형식으로, 1할 이상이면 1.000처럼 쓴다. */
export function formatWinRate(winRate: number): string {
  if (winRate >= 1) return '1.000'
  return '.' + winRate.toFixed(3).slice(2)
}

/** 게임차는 1위면 '-', 아니면 0.5 단위 숫자로 쓴다. */
export function formatGamesBehind(gamesBehind: number): string {
  return gamesBehind === 0 ? '-' : gamesBehind.toFixed(1)
}
