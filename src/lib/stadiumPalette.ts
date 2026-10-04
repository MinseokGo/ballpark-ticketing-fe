/** 구역마다 돌려 쓰는 장식용 배색. 실제 구장 색과는 무관하다. (알 수 없는 구역 이름의 fallback) */
export const STADIUM_PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#A855F7',
  '#06B6D4',
  '#EC4899',
  '#F43F5E',
  '#84CC16',
]

/**
 * 계열별 구역 색. 좌석 상태 색(SEAT_STATUS_COLOR)과 겹치지 않게 고른다:
 * 선택은 주황, 선점은 밝은 회색, 판매 완료는 진한 회색이라 계열 색에 쓰지 않는다.
 */
export const FAMILY_PALETTE = {
  중앙석: '#2563EB',
  '1루 필드석': '#7C3AED',
  '1루 외야석': '#0891B2',
  '3루 필드석': '#DB2777',
  '3루 외야석': '#65A30D',
} as const

export const SEAT_STATUS_COLOR = {
  selected: '#F97316',
  held: '#CBD5E1',
  sold: '#475569',
} as const

export const SEAT_STATUS_LABEL = {
  selected: '내가 고른 좌석',
  available: '예매 가능',
  held: '선점됨 (결제 진행 중)',
  sold: '판매 완료',
} as const
