import { FAMILY_ANGLES, FAMILY_COLOR, TIER_ORDER, isOutfieldFamily, parseSectionName } from '../../lib/stadiumLayout'
import { STADIUM_PALETTE } from '../../lib/stadiumPalette'
import type { SeatMapItemResponse } from '../../api/types'

export const CX = 160

export const CY = 200

export const VS = 1.3

// 파울 구역(중앙석·필드석)은 안쪽부터, 페어 구역(외야석)은 외야 벽 너머부터 좌석이 시작한다.

// 파울 구역(중앙석·필드석)은 안쪽부터, 페어 구역(외야석)은 외야 벽 너머부터 좌석이 시작한다.
export const INFIELD_R = 40

export const WALL_R = 72

export const OUTER_R = 130

// 확대/축소 전 기본 화면에 돔 전체가 들어가는 논리 크기.
// 돔 외곽(가로 260, 세로 약 338)에 맞춘 여백 최소 크기 — 화면을 꽉 채우도록 여백을 줄였다.

// 확대/축소 전 기본 화면에 돔 전체가 들어가는 논리 크기.
// 돔 외곽(가로 260, 세로 약 338)에 맞춘 여백 최소 크기 — 화면을 꽉 채우도록 여백을 줄였다.
export const WORLD_W = 262

export const WORLD_H = 340

export const MIN_ZOOM = 1

export const MAX_ZOOM = 40

export const TAP_SLOP = 6


// 같은 구역 계열 안에서 A(앞, 진함) → C(뒤, 연함)으로 색을 한 단계씩 옅게 해서 층을 구분한다.

// 같은 구역 계열 안에서 A(앞, 진함) → C(뒤, 연함)으로 색을 한 단계씩 옅게 해서 층을 구분한다.
export const TIER_TINT = [0, 0.18, 0.36]
// 한 블록은 열 몇 개, 행 몇 개씩 묶여 보이는지 — 통로 간격을 주는 단위.

// 한 블록은 열 몇 개, 행 몇 개씩 묶여 보이는지 — 통로 간격을 주는 단위.
export const BLOCK_COLS = 12

export const BLOCK_ROWS = 6

export type View = { zoom: number; panX: number; panY: number }

export type StadiumSectionSeats = {
  sectionId: number
  name: string
  price: number
  items: SeatMapItemResponse[]
}

export type SeatCell = {
  item: SeatMapItemResponse
  sectionName: string
  price: number
  color: string
  path: Path2D
}

export type Band = {
  sectionId: number
  // 구역 경계 전체를 한 번에 강조할 때 쓰는 외곽 경로.
  outline: Path2D
  fStart: number
  fEnd: number
  bInner: number
  bOuter: number
  rowThickness: number
  colStep: number
  rows: SeatCell[][]
}

export type Layout = {
  cells: SeatCell[]
  bands: Band[]
  // 이름 체계를 모르는 옛 데이터일 때 쓰는 통짜 조각. 좌석 단위로 못 쪼개니 선택도 안 된다.
  wedges: { path: Path2D; color: string; alpha: number }[]
  // 구역 이름표. 축소 상태에선 구역 계열(예: "1루 외야석")만, 확대하면 층별 구역 이름("1루 외야석 B")을 보인다.
  labels: { text: string; family: boolean; angle: number; radius: number }[]
}

// 이 배율 이상으로 확대하면 층별 구역 이름을 보여준다.

// 이 배율 이상으로 확대하면 층별 구역 이름을 보여준다.
export const SECTION_LABEL_ZOOM = 2.5

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// 0도 = 위(외야 정면), 시계방향 → canvas 각도(0 = 오른쪽, 시계방향 증가)로 바꾼다.

// 0도 = 위(외야 정면), 시계방향 → canvas 각도(0 = 오른쪽, 시계방향 증가)로 바꾼다.
export const canvasAngle = (deg: number) => ((deg - 90) * Math.PI) / 180

export function annularPath(rInner: number, rOuter: number, t0: number, t1: number): Path2D {
  const a0 = canvasAngle(t0)
  const a1 = canvasAngle(t1)
  const path = new Path2D()
  path.arc(CX, CY, rOuter, a0, a1)
  path.arc(CX, CY, rInner, a1, a0, true)
  path.closePath()
  return path
}

export function buildLayout(sections: StadiumSectionSeats[]): Layout {
  const parsed = sections.map((section) => ({ section, info: parseSectionName(section.name) }))
  const recognized = parsed.length > 0 && parsed.every((item) => item.info !== null)
  const cells: SeatCell[] = []
  const bands: Band[] = []
  const wedges: Layout['wedges'] = []
  const labels: Layout['labels'] = []

  if (!recognized) {
    const slice = 360 / Math.max(sections.length, 1)
    sections.forEach((section, index) => {
      const available = section.items.filter((item) => item.status === 'AVAILABLE').length
      const ratio = section.items.length === 0 ? 0 : available / section.items.length
      wedges.push({
        path: annularPath(INFIELD_R, OUTER_R, index * slice, (index + 1) * slice),
        color: STADIUM_PALETTE[index % STADIUM_PALETTE.length]!,
        alpha: 0.2 + ratio * 0.5,
      })
    })
    return { cells, bands, wedges, labels: [] }
  }

  for (const { section, info } of parsed) {
    const { family, tier, half } = info!
    const [familyStart, familyEnd] = FAMILY_ANGLES[family]
    // 계열 각도를 앞(1)·뒤(2) 블록으로 반씩 나눈다. 블록 번호가 없으면 계열 전체를 쓴다.
    const span = familyEnd - familyStart
    const fStart = half ? familyStart + ((half - 1) * span) / 2 : familyStart
    const fEnd = half ? familyStart + (half * span) / 2 : familyEnd
    const innerBound = isOutfieldFamily(family) ? WALL_R : INFIELD_R
    const ringWidth = (OUTER_R - innerBound) / TIER_ORDER.length
    const tierIndex = TIER_ORDER.indexOf(tier)
    const bInner = innerBound + tierIndex * ringWidth
    const bOuter = bInner + ringWidth

    const rowMap = new Map<number, SeatMapItemResponse[]>()
    for (const item of section.items) {
      const list = rowMap.get(item.rowNo) ?? []
      list.push(item)
      rowMap.set(item.rowNo, list)
    }
    const rowNumbers = [...rowMap.keys()].sort((a, b) => a - b)
    if (rowNumbers.length === 0) {
      continue
    }

    const rowThickness = (bOuter - bInner) / rowNumbers.length
    const colCount = Math.max(...rowNumbers.map((rowNo) => rowMap.get(rowNo)!.length))
    const colStep = (fEnd - fStart) / colCount
    const baseColor = FAMILY_COLOR[family]
    const color = tint(baseColor, TIER_TINT[tierIndex]!)

    const rows = rowNumbers.map((rowNo, rowIndex) => {
      const rowItems = [...rowMap.get(rowNo)!].sort((a, b) => a.seatNo - b.seatNo)
      const rIn = bInner + rowIndex * rowThickness
      const rOut = rIn + rowThickness
      // 블록 사이 통로: 열 묶음 경계와 구역 경계에서는 칸 사이 틈을 넓힌다.
      const rowAisleBefore = rowIndex > 0 && rowIndex % BLOCK_ROWS === 0
      const radialInset = rowAisleBefore ? 0.55 : 0.15
      return rowItems.map((item, colIndex) => {
        const t0 = fStart + colIndex * colStep
        const t1 = t0 + colStep
        const aisleLeft = colIndex === 0 || colIndex % BLOCK_COLS === 0
        const aisleRight = colIndex === rowItems.length - 1 || (colIndex + 1) % BLOCK_COLS === 0
        const insetA0 = colStep * (aisleLeft ? 0.5 : 0.12) / 2
        const insetA1 = colStep * (aisleRight ? 0.5 : 0.12) / 2
        const cell: SeatCell = {
          item,
          sectionName: section.name,
          price: section.price,
          color,
          path: annularPath(rIn + radialInset, rOut - 0.15, t0 + insetA0, t1 - insetA1),
        }
        cells.push(cell)
        return cell
      })
    })

    bands.push({
      sectionId: section.sectionId,
      outline: annularPath(bInner, bOuter, fStart, fEnd),
      fStart,
      fEnd,
      bInner,
      bOuter,
      rowThickness,
      colStep,
      rows,
    })
    const midAngle = (fStart + fEnd) / 2
    labels.push({ text: section.name, family: false, angle: midAngle, radius: (bInner + bOuter) / 2 })
    // 계열 이름표는 계열당 한 번만(B층, 앞 블록 쪽에서) 단다.
    if (tier === 'B' && (half === null || half === 1)) {
      const familyRadius = innerBound + ringWidth * 1.5
      labels.push({ text: family, family: true, angle: (familyStart + familyEnd) / 2, radius: familyRadius })
    }
  }

  return { cells, bands, wedges, labels }
}

export function hitTest(layout: Layout, xc: number, yc: number): SeatCell | null {
  const dx = xc - CX
  const dy = yc - CY
  const r = Math.hypot(dx, dy)
  let theta = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (theta < 0) theta += 360

  for (const band of layout.bands) {
    if (r < band.bInner || r >= band.bOuter || theta < band.fStart || theta >= band.fEnd) {
      continue
    }
    const rowIndex = clamp(Math.floor((r - band.bInner) / band.rowThickness), 0, band.rows.length - 1)
    const row = band.rows[rowIndex]!
    const colIndex = clamp(Math.floor((theta - band.fStart) / band.colStep), 0, row.length - 1)
    return row[colIndex] ?? null
  }
  return null
}

export function viewGeometry(w: number, h: number, view: View) {
  const base = Math.min(w / WORLD_W, h / WORLD_H)
  return { k: base * view.zoom, ox: w / 2 + view.panX, oy: h / 2 + view.panY }
}

export function localToCircular(px: number, py: number, w: number, h: number, view: View) {
  const { k, ox, oy } = viewGeometry(w, h, view)
  return { xc: CX + (px - ox) / k, yc: CY + (py - oy) / (k * VS) }
}

export function clampView(view: View, w: number, h: number): View {
  const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM)
  const maxX = ((zoom - 1) * w) / 2
  const maxY = ((zoom - 1) * h) / 2
  return { zoom, panX: clamp(view.panX, -maxX, maxX), panY: clamp(view.panY, -maxY, maxY) }
}

/** 화면의 (px, py) 점이 가리키는 세계 좌표를 그대로 두고 확대/축소한다. */

/** 화면의 (px, py) 점이 가리키는 세계 좌표를 그대로 두고 확대/축소한다. */
export function zoomAt(view: View, w: number, h: number, px: number, py: number, nextZoom: number): View {
  const { xc, yc } = localToCircular(px, py, w, h, view)
  const k2 = Math.min(w / WORLD_W, h / WORLD_H) * nextZoom
  return clampView(
    {
      zoom: nextZoom,
      panX: px - w / 2 - k2 * (xc - CX),
      panY: py - h / 2 - k2 * VS * (yc - CY),
    },
    w,
    h,
  )
}

/** 구역의 중심을 화면 가운데에 놓는 보기(줌 배율은 구역 폭에 맞춘다). */

/** 구역의 중심을 화면 가운데에 놓는 보기(줌 배율은 구역 폭에 맞춘다). */
export function zoneView(band: Band, w: number, h: number): View {
  const rMid = (band.bInner + band.bOuter) / 2
  const angle = ((band.fStart + band.fEnd) / 2) * (Math.PI / 180)
  const xc = CX + rMid * Math.sin(angle)
  const yc = CY - rMid * Math.cos(angle)
  // 구역을 고르면 그 구역이 화면을 크게 채우도록 줌인한다(구역이 얇을수록 더 많이 확대).
  const zoom = clamp(90 / (band.bOuter - band.bInner), 3.5, 8)
  const k = Math.min(w / WORLD_W, h / WORLD_H) * zoom
  return clampView({ zoom, panX: -k * (xc - CX), panY: -k * VS * (yc - CY) }, w, h)
}

export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
