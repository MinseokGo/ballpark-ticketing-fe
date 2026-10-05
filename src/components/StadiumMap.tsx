import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { MAX_ZOOM, MIN_ZOOM, TAP_SLOP, buildLayout, clamp, clampView, hitTest, localToCircular, zoneView, zoomAt } from './stadium/stadiumGeometry'
import type { SeatCell, StadiumSectionSeats, View } from './stadium/stadiumGeometry'
import { STATUS_LABEL, drawStadium } from './stadium/stadiumDraw'

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
  focus,
}: {
  sections: StadiumSectionSeats[]
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
  // 범례에서 구역을 누를 때마다 nonce가 바뀌어서, 같은 구역을 다시 눌러도 줌이 다시 돈다.
  focus?: { sectionId: number; nonce: number } | null
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

  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  // 구역 목록이 지도 아래에 놓이는 좁은 화면에서는 고른 구역의 줌인이 화면 밖에서 일어나므로,
  // 지도가 안 보이면 지도 쪽으로 스크롤한다. 넓은 화면은 지도와 목록이 나란히 있어서 움직이지 않는다.
  // 크기 변화에는 반응하지 않도록 focus에만 건다.
  useEffect(() => {
    if (!focus) return
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const visible = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (visible) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [focus])

  // 구역을 고르면 현재 화면에서 그 구역 중심으로 부드럽게 줌인한다.
  useEffect(() => {
    if (!focus) return
    const band = layout.bands.find((b) => b.sectionId === focus.sectionId)
    if (!band) return
    const from = viewRef.current
    const to = zoneView(band, size.w, size.h)
    const startedAt = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / 450)
      const e = 1 - Math.pow(1 - t, 3)
      setView({
        zoom: from.zoom + (to.zoom - from.zoom) * e,
        panX: from.panX + (to.panX - from.panX) * e,
        panY: from.panY + (to.panY - from.panY) * e,
      })
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [focus, layout, size])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      // 세로는 화면 높이에 맞춘다. 가로만 보고 키우면 큰 화면에서 지도가 목록보다 너무 커진다.
      const h = Math.min(760, Math.max(460, Math.round(Math.min(w * 1.05, window.innerHeight * 0.8))))
      setSize({ w, h })
      // 돔 비율(가로:세로 약 0.77)에 맞춰 세로를 잡고, 너무 커지지 않게만 제한한다.
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const id = requestAnimationFrame(() =>
      drawStadium(canvas, layout, selectedIds, hoverCell, focus?.sectionId ?? null, view, size.w, size.h, dpr),
    )
    return () => cancelAnimationFrame(id)
  }, [layout, selectedIds, hoverCell, focus, view, size])

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
    <div ref={wrapRef} className="relative w-full scroll-mt-24 select-none">
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
