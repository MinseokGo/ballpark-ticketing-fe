import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  FAMILY_ANGLES,
  FAMILY_COLOR,
  TIER_ORDER,
  isOutfieldFamily,
  parseSectionName,
} from '../lib/stadiumLayout'
import { STADIUM_PALETTE } from '../lib/stadiumPalette'
import type { SeatMapItemResponse } from '../api/types'

// 좌석은 수만 개라 DOM이 아니라 canvas에 그린다. 돔 기하는 "원 좌표계(CX, CY, 반지름, 각도)"로 계산하고,
// 그릴 때만 y를 VS배 늘려서 타원으로 보이게 한다 — 그래서 호(arc)가 비틀리지 않는다.
const CX = 160
const CY = 200
const VS = 1.3

// 파울 구역(중앙석·필드석)은 안쪽부터, 페어 구역(외야석)은 외야 벽 너머부터 좌석이 시작한다.
const INFIELD_R = 40
const WALL_R = 72
const OUTER_R = 130

// 확대/축소 전 기본 화면에 돔 전체가 들어가는 논리 크기.
const WORLD_W = 280
const WORLD_H = 360

const MIN_ZOOM = 1
const MAX_ZOOM = 40
const TAP_SLOP = 6

const SELECTED_COLOR = '#10B981'

// 같은 구역 계열 안에서 A(앞, 진함) → C(뒤, 연함)으로 색을 한 단계씩 옅게 해서 층을 구분한다.
const TIER_TINT = [0, 0.18, 0.36]
// 한 블록은 열 몇 개, 행 몇 개씩 묶여 보이는지 — 통로 간격을 주는 단위.
const BLOCK_COLS = 12
const BLOCK_ROWS = 6

function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
const HELD_COLOR = '#FBBF24'
const SOLD_COLOR = '#94A3B8'

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '예매 가능',
  HELD: '선점됨',
  SOLD: '판매 완료',
}

type View = { zoom: number; panX: number; panY: number }

export type StadiumSectionSeats = {
  sectionId: number
  name: string
  price: number
  items: SeatMapItemResponse[]
}

type SeatCell = {
  item: SeatMapItemResponse
  sectionName: string
  price: number
  color: string
  path: Path2D
}

type Band = {
  fStart: number
  fEnd: number
  bInner: number
  bOuter: number
  rowThickness: number
  colStep: number
  rows: SeatCell[][]
}

type Layout = {
  cells: SeatCell[]
  bands: Band[]
  // 이름 체계를 모르는 옛 데이터일 때 쓰는 통짜 조각. 좌석 단위로 못 쪼개니 선택도 안 된다.
  wedges: { path: Path2D; color: string; alpha: number }[]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// 0도 = 위(외야 정면), 시계방향 → canvas 각도(0 = 오른쪽, 시계방향 증가)로 바꾼다.
const canvasAngle = (deg: number) => ((deg - 90) * Math.PI) / 180

function annularPath(rInner: number, rOuter: number, t0: number, t1: number): Path2D {
  const a0 = canvasAngle(t0)
  const a1 = canvasAngle(t1)
  const path = new Path2D()
  path.arc(CX, CY, rOuter, a0, a1)
  path.arc(CX, CY, rInner, a1, a0, true)
  path.closePath()
  return path
}

function buildLayout(sections: StadiumSectionSeats[]): Layout {
  const parsed = sections.map((section) => ({ section, info: parseSectionName(section.name) }))
  const recognized = parsed.length > 0 && parsed.every((item) => item.info !== null)
  const cells: SeatCell[] = []
  const bands: Band[] = []
  const wedges: Layout['wedges'] = []

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
    return { cells, bands, wedges }
  }

  for (const { section, info } of parsed) {
    const { family, tier } = info!
    const [fStart, fEnd] = FAMILY_ANGLES[family]
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

    bands.push({ fStart, fEnd, bInner, bOuter, rowThickness, colStep, rows })
  }

  return { cells, bands, wedges }
}

function hitTest(layout: Layout, xc: number, yc: number): SeatCell | null {
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

function viewGeometry(w: number, h: number, view: View) {
  const base = Math.min(w / WORLD_W, h / WORLD_H)
  return { k: base * view.zoom, ox: w / 2 + view.panX, oy: h / 2 + view.panY }
}

function localToCircular(px: number, py: number, w: number, h: number, view: View) {
  const { k, ox, oy } = viewGeometry(w, h, view)
  return { xc: CX + (px - ox) / k, yc: CY + (py - oy) / (k * VS) }
}

function clampView(view: View, w: number, h: number): View {
  const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM)
  const maxX = ((zoom - 1) * w) / 2
  const maxY = ((zoom - 1) * h) / 2
  return { zoom, panX: clamp(view.panX, -maxX, maxX), panY: clamp(view.panY, -maxY, maxY) }
}

/** 화면의 (px, py) 점이 가리키는 세계 좌표를 그대로 두고 확대/축소한다. */
function zoomAt(view: View, w: number, h: number, px: number, py: number, nextZoom: number): View {
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

function drawStadium(
  canvas: HTMLCanvasElement,
  layout: Layout,
  selectedIds: Set<number>,
  hovered: SeatCell | null,
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
      ctx.fillStyle = SELECTED_COLOR
      ctx.globalAlpha = 1
    } else if (cell.item.status === 'AVAILABLE') {
      ctx.fillStyle = cell.color
      ctx.globalAlpha = 0.9
    } else if (cell.item.status === 'HELD') {
      ctx.fillStyle = HELD_COLOR
      ctx.globalAlpha = 0.55
    } else {
      ctx.fillStyle = SOLD_COLOR
      ctx.globalAlpha = 0.4
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

  if (hovered) {
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 0.9
    ctx.stroke(hovered.path)
  }
}

type Gesture = {
  pointers: Map<number, { x: number; y: number }>
  downX: number
  downY: number
  startPanX: number
  startPanY: number
  moved: boolean
  pinch: { dist: number; zoom: number } | null
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * 경기장을 위에서 내려다본 돔에 좌석 하나하나를 실제 자리대로 그린다(약 2만 석 이상).
 * - 예매 가능 좌석은 구역 색, 선점·판매된 좌석은 흐리게, 선택한 좌석은 초록.
 * - 확대/축소: 마우스 휠, 두 손가락 핀치, 우측 상단 버튼. 드래그로 옮긴다.
 * - 탭(클릭)하면 그 좌석이 선택/해제된다. 마우스를 올리면 행·열·가격·상태를 보여준다.
 * 구역 이름이 "중앙석 A" 체계를 벗어나면 좌석 단위로 못 쪼개므로 구역을 통짜 조각으로 보여준다.
 */
export function StadiumMap({
  sections,
  selectedIds,
  onToggle,
}: {
  sections: StadiumSectionSeats[]
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 360, h: 420 })
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 })
  const [hoverCell, setHoverCell] = useState<SeatCell | null>(null)
  const [tip, setTip] = useState({ x: 0, y: 0 })
  const gesture = useRef<Gesture>({
    pointers: new Map(),
    downX: 0,
    downY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
    pinch: null,
  })

  const layout = useMemo(() => buildLayout(sections), [sections])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      setSize({ w, h: Math.min(640, Math.max(420, Math.round(w * 0.9))) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const id = requestAnimationFrame(() =>
      drawStadium(canvas, layout, selectedIds, hoverCell, view, size.w, size.h, dpr),
    )
    return () => cancelAnimationFrame(id)
  }, [layout, selectedIds, hoverCell, view, size])

  // 휠은 기본 스크롤과 충돌하므로 passive: false로 직접 붙인다.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0015)
      setView((prev) =>
        zoomAt(prev, size.w, size.h, event.clientX - rect.left, event.clientY - rect.top, clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM)),
      )
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [size])

  const localPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const hitAt = (p: { x: number; y: number }) => {
    const { xc, yc } = localToCircular(p.x, p.y, size.w, size.h, view)
    return hitTest(layout, xc, yc)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(event)
    const g = gesture.current
    event.currentTarget.setPointerCapture(event.pointerId)
    g.pointers.set(event.pointerId, p)
    if (g.pointers.size === 1) {
      g.downX = p.x
      g.downY = p.y
      g.startPanX = view.panX
      g.startPanY = view.panY
      g.moved = false
      g.pinch = null
      setHoverCell(null)
    }
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()]
      g.pinch = { dist: distance(a!, b!), zoom: view.zoom }
      g.moved = true
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(event)
    const g = gesture.current
    if (!g.pointers.has(event.pointerId)) {
      setHoverCell(hitAt(p))
      setTip({ x: p.x, y: p.y })
      return
    }
    g.pointers.set(event.pointerId, p)

    if (g.pointers.size === 2 && g.pinch) {
      const [a, b] = [...g.pointers.values()]
      const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }
      const nextZoom = clamp((g.pinch.zoom * distance(a!, b!)) / g.pinch.dist, MIN_ZOOM, MAX_ZOOM)
      setView((prev) => zoomAt(prev, size.w, size.h, mid.x, mid.y, nextZoom))
    } else if (g.pointers.size === 1) {
      const dx = p.x - g.downX
      const dy = p.y - g.downY
      if (Math.hypot(dx, dy) > TAP_SLOP) g.moved = true
      if (g.moved) {
        setView((prev) =>
          clampView({ ...prev, panX: g.startPanX + dx, panY: g.startPanY + dy }, size.w, size.h),
        )
      }
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(event)
    const g = gesture.current
    const wasSingle = g.pointers.size === 1
    g.pointers.delete(event.pointerId)
    if (wasSingle && !g.moved) {
      const cell = hitAt(p)
      if (cell && (cell.item.status === 'AVAILABLE' || selectedIds.has(cell.item.gameSeatId))) {
        onToggle(cell.item.gameSeatId)
      }
    }
    if (g.pointers.size < 2) g.pinch = null
  }

  const zoomBy = (factor: number) =>
    setView((prev) => zoomAt(prev, size.w, size.h, size.w / 2, size.h / 2, clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM)))

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="경기장 좌석 지도. 드래그로 옮기고, 확대·축소한 뒤 좌석을 탭해서 고르세요"
        style={{ width: size.w, height: size.h }}
        className="block touch-none cursor-grab"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoverCell(null)}
      />

      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button
          type="button"
          aria-label="확대"
          onClick={() => zoomBy(1.5)}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-lg font-semibold shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          +
        </button>
        <button
          type="button"
          aria-label="축소"
          onClick={() => zoomBy(1 / 1.5)}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-lg font-semibold shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          −
        </button>
        <button
          type="button"
          aria-label="원래 크기로"
          onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-xs font-semibold shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          ⟲
        </button>
      </div>

      {hoverCell && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs text-white shadow-md"
          style={{ left: Math.min(tip.x + 12, size.w - 170), top: tip.y + 12 }}
        >
          <p className="font-semibold">
            {hoverCell.sectionName} · {hoverCell.item.rowNo}열 {hoverCell.item.seatNo}번
          </p>
          <p className="text-slate-300">
            {hoverCell.price.toLocaleString()}원 ·{' '}
            {selectedIds.has(hoverCell.item.gameSeatId) ? '선택함' : STATUS_LABEL[hoverCell.item.status]}
          </p>
        </div>
      )}
    </div>
  )
}
