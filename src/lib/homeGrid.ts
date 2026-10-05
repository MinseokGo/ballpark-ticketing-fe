/** 홈 위젯 격자: 가로 5칸, 위젯 크기는 가로·세로 각각 1~5칸. */
export const COLUMNS = 5
export const MAX_SPAN = 5

export const HOME_WIDGET_IDS = ['hero', 'live', 'reservations', 'today', 'recent', 'upcoming', 'events'] as const
export type HomeWidgetId = (typeof HOME_WIDGET_IDS)[number]

export type WidgetItem = { id: HomeWidgetId; w: number; h: number }
export type PlacedWidget = WidgetItem & { col: number; row: number }

export const DEFAULT_ITEMS: WidgetItem[] = [
  { id: 'hero', w: 3, h: 3 },
  { id: 'live', w: 2, h: 3 },
  { id: 'reservations', w: 3, h: 3 },
  { id: 'today', w: 2, h: 3 },
  { id: 'recent', w: 5, h: 3 },
  { id: 'upcoming', w: 5, h: 4 },
  { id: 'events', w: 5, h: 2 },
]

export function clampSpan(value: number) {
  return Math.min(MAX_SPAN, Math.max(1, Math.round(value)))
}

/**
 * 순서대로 빈 칸을 찾아 배치한다(위에서 아래, 왼쪽에서 오른쪽). 홈과 편집기가 같은 결과를 쓰도록 한 곳에 둔다.
 */
export function packLayout(items: WidgetItem[]): PlacedWidget[] {
  const occupied: boolean[][] = []
  const isRowFree = (row: number) => {
    if (!occupied[row]) occupied[row] = Array.from({ length: COLUMNS }, () => false)
    return occupied[row]
  }
  const fits = (row: number, col: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      const cells = isRowFree(r)
      for (let c = col; c < col + w; c++) if (cells[c]) return false
    }
    return true
  }
  const mark = (row: number, col: number, w: number, h: number) => {
    for (let r = row; r < row + h; r++) {
      const cells = isRowFree(r)
      for (let c = col; c < col + w; c++) cells[c] = true
    }
  }
  return items.map((item) => {
    const w = Math.min(clampSpan(item.w), COLUMNS)
    const h = clampSpan(item.h)
    for (let row = 0; ; row++) {
      for (let col = 0; col <= COLUMNS - w; col++) {
        if (fits(row, col, w, h)) {
          mark(row, col, w, h)
          return { ...item, w, h, col, row }
        }
      }
    }
  })
}
