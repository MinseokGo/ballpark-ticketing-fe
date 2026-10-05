import { FAMILY_PALETTE } from './stadiumPalette'

export type Tier = 'A' | 'B' | 'C'
export type Family = '중앙석' | '1루 필드석' | '1루 외야석' | '3루 필드석' | '3루 외야석'

/**
 * 0도 = 외야 정면(타자 배경판 방향), 시계방향. 180도 = 홈플레이트 뒤.
 * 가운데 90도(-45~45)는 페어 구역(필드+외야석), 나머지 270도는 파울 구역(중앙석+필드석).
 * StadiumMap(전체 돔)과 SeatArcGrid(구역 하나 확대)가 같은 배치를 쓰도록 여기 모아 둔다.
 */
export const FAMILY_ANGLES: Record<Family, [number, number]> = {
  '1루 외야석': [0, 45],
  '1루 필드석': [45, 135],
  중앙석: [135, 225],
  '3루 필드석': [225, 315],
  '3루 외야석': [315, 360],
}

export const FAMILY_COLOR: Record<Family, string> = FAMILY_PALETTE

export const TIER_ORDER: Tier[] = ['A', 'B', 'C']

export function isOutfieldFamily(family: Family): boolean {
  return family === '1루 외야석' || family === '3루 외야석'
}

/** 3루측 구역은 왼쪽, 1루측은 오른쪽이다 — 구역 확대 화면에서 좌우를 뒤집을 때 쓴다. */
export function familySide(family: Family): 'left' | 'right' | 'center' {
  if (family.startsWith('3루')) return 'left'
  if (family.startsWith('1루')) return 'right'
  return 'center'
}

/**
 * "중앙석 A", "중앙석 A-1"(앞 블록), "중앙석 A-2"(뒤 블록)를 받는다. 블록 번호가 없으면 구역 전체다.
 */
export function parseSectionName(name: string): { family: Family; tier: Tier; half: 1 | 2 | null } | null {
  const match = /^(중앙석|1루 필드석|1루 외야석|3루 필드석|3루 외야석)\s*([ABC])(?:-([12]))?$/.exec(name.trim())
  if (!match) {
    return null
  }
  return {
    family: match[1] as Family,
    tier: match[2] as Tier,
    half: match[3] ? (Number(match[3]) as 1 | 2) : null,
  }
}
