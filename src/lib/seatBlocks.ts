import type { SeatMapItemResponse } from '../api/types'

/** 실제 경기장처럼 한 구역을 여러 블록으로 쪼갤 때 블록당 열(seatNo) 수. */
export const BLOCK_WIDTH = 5

/** seatNo 기준으로 좌석을 블록 단위로 쪼갠다. 빈 블록은 뺀다. */
export function groupIntoBlocks(items: SeatMapItemResponse[]): SeatMapItemResponse[][] {
  if (items.length === 0) {
    return []
  }
  const maxSeatNo = Math.max(...items.map((item) => item.seatNo))
  const blockCount = Math.max(1, Math.ceil(maxSeatNo / BLOCK_WIDTH))
  const blocks: SeatMapItemResponse[][] = Array.from({ length: blockCount }, () => [])
  for (const item of items) {
    const index = Math.min(blockCount - 1, Math.floor((item.seatNo - 1) / BLOCK_WIDTH))
    blocks[index].push(item)
  }
  return blocks.filter((block) => block.length > 0)
}

export function availabilityRatio(items: SeatMapItemResponse[]): number {
  if (items.length === 0) {
    return 0
  }
  const available = items.filter((item) => item.status === 'AVAILABLE').length
  return available / items.length
}
