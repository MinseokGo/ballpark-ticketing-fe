/**
 * 실시간 중계 데이터 시뮬레이터. 백엔드에는 아직 경기 진행 상태(이닝·점수)가 없어서,
 * 시간에 따라 그럴듯하게 움직이는 값을 이 함수가 만든다. 실제 중계 값이 아니다.
 * 백엔드 실시간 API가 생기면 이 함수 대신 그 응답을 쓰도록 훅만 바꾼다.
 */
export type LiveState = {
  gameId: number
  inning: number
  half: 'top' | 'bottom'
  homeScore: number
  awayScore: number
}

// 같은 경기라도 분 단위로 값이 달라지도록 섞는 작은 해시.
function mix(a: number, b: number) {
  let h = (a * 2654435761 + b * 40503) >>> 0
  h ^= h >>> 15
  return (h * 2246822519) >>> 0
}

export function simulateLive(gameId: number, now: number): LiveState {
  const minute = Math.floor(now / 60_000)
  const seed = mix(gameId, minute)
  // 약 2분마다 초/말이 바뀌고, 이닝은 9회까지 돌고 다시 1회로 간다.
  const step = Math.floor(minute / 2)
  const inning = ((step + gameId) % 9) + 1
  const half = step % 2 === 0 ? 'top' : 'bottom'
  // 점수는 분 단위로 조금씩 오르되 단조 증가하도록 이닝 수로 상한을 둔다.
  const cap = Math.max(1, Math.ceil(inning * 0.6))
  return {
    gameId,
    inning,
    half,
    homeScore: Math.min(cap, seed % (cap + 1)),
    awayScore: Math.min(cap, (seed >>> 8) % (cap + 1)),
  }
}
