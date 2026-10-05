import { SEAT_STATUS_COLOR } from '../../lib/stadiumPalette'
import { CX, CY, INFIELD_R, OUTER_R, SECTION_LABEL_ZOOM, VS, WALL_R, annularPath, viewGeometry } from './stadiumGeometry'
import type { Layout, SeatCell, View } from './stadiumGeometry'

export const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '예매 가능',
  HELD: '선점됨',
  SOLD: '판매 완료',
}

export function drawStadium(
  canvas: HTMLCanvasElement,
  layout: Layout,
  selectedIds: Set<number>,
  hovered: SeatCell | null,
  focusSectionId: number | null,
  view: View,
  w: number,
  h: number,
  dpr: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const { k, ox, oy } = viewGeometry(w, h, view)
  ctx.setTransform(dpr * k, 0, 0, dpr * k * VS, dpr * (ox - k * CX), dpr * (oy - k * VS * CY))

  // 필드: 외야 잔디 → 내야 원 → 다이아몬드와 홈플레이트
  ctx.globalAlpha = 1
  ctx.fillStyle = '#4ADE80'
  ctx.fill(annularPath(INFIELD_R, WALL_R, -45, 45))
  ctx.fillStyle = '#86EFAC'
  ctx.beginPath()
  ctx.arc(CX, CY, INFIELD_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#D2B48C'
  ctx.beginPath()
  ctx.moveTo(CX, CY + 4)
  ctx.lineTo(CX + 12, CY + 16)
  ctx.lineTo(CX, CY + 28)
  ctx.lineTo(CX - 12, CY + 16)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(CX, CY + 30, 2.5, 0, Math.PI * 2)
  ctx.fill()

  for (const wedge of layout.wedges) {
    ctx.globalAlpha = wedge.alpha
    ctx.fillStyle = wedge.color
    ctx.fill(wedge.path)
  }

  // 좌석: 선택 > 예매 가능(구역 색) > 선점 > 판매 완료 순
  for (const cell of layout.cells) {
    if (selectedIds.has(cell.item.gameSeatId)) {
      ctx.fillStyle = SEAT_STATUS_COLOR.selected
      ctx.globalAlpha = 1
    } else if (cell.item.status === 'AVAILABLE') {
      ctx.fillStyle = cell.color
      ctx.globalAlpha = 0.9
    } else if (cell.item.status === 'HELD') {
      ctx.fillStyle = SEAT_STATUS_COLOR.held
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = SEAT_STATUS_COLOR.sold
      ctx.globalAlpha = 1
    }
    ctx.fill(cell.path)
  }
  ctx.globalAlpha = 1

  // 필드 쪽에서 빛이 퍼지는 느낌의 하이라이트, 그리고 돔 외곽선
  const shine = ctx.createRadialGradient(CX, CY, 0, CX, CY, OUTER_R)
  shine.addColorStop(0, 'rgba(255,255,255,0.3)')
  shine.addColorStop(0.55, 'rgba(255,255,255,0.06)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.beginPath()
  ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(100,116,139,0.45)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 구역 목록에서 고른 구역: 테두리 없이 그 밖의 영역만 살짝 어둡게 덮는다. 고른 구역은 원래 밝기로 남아 강조된다.
  if (focusSectionId !== null) {
    const band = layout.bands.find((b) => b.sectionId === focusSectionId)
    if (band) {
      const shade = new Path2D()
      shade.rect(-300, -300, 900, 900)
      shade.addPath(band.outline)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)'
      ctx.fill(shade, 'evenodd')
    }
  }

  if (hovered) {
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 0.9
    ctx.stroke(hovered.path)
  }

  drawLabels(ctx, layout, view, w, h, dpr)
}

export function drawLabels(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  view: View,
  w: number,
  h: number,
  dpr: number,
) {
  const showSections = view.zoom >= SECTION_LABEL_ZOOM
  const { k, ox, oy } = viewGeometry(w, h, view)
  // 이름표는 좌표계가 찌그러지지 않도록 화면 좌표(CSS px)로 따로 그린다.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.font = '600 11px -apple-system, "Apple SD Gothic Neo", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const label of layout.labels) {
    if (label.family === showSections) continue
    const rad = (label.angle * Math.PI) / 180
    const xc = CX + label.radius * Math.sin(rad)
    const yc = CY - label.radius * Math.cos(rad)
    const x = ox + k * (xc - CX)
    const y = oy + k * VS * (yc - CY)
    if (x < 0 || x > w || y < 0 || y > h) continue
    const textWidth = ctx.measureText(label.text).width
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)'
    ctx.fillRect(x - textWidth / 2 - 5, y - 9, textWidth + 10, 18)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(label.text, x, y)
  }
}
