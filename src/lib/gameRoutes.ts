import type { GameProgress, GameStatus } from '../api/types'

/**
 * 경기 카드를 눌렀을 때 갈 곳. 진행 상태가 우선이다.
 * 진행 중이면 중계, 끝났거나 취소됐으면 경기 기록, 예매 중이면 좌석 화면이다. 그 밖은 갈 곳이 없다(null).
 */
export function gameHref(game: { id: number; progress: GameProgress; status: GameStatus }): string | null {
  if (game.progress === 'LIVE') return `/games/${game.id}/live`
  if (game.progress === 'FINISHED' || game.progress === 'CANCELLED') return `/games/${game.id}/record`
  if (game.status === 'OPEN') return `/booking/${game.id}`
  return null
}
