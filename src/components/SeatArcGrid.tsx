import { familySide, parseSectionName } from '../lib/stadiumLayout'
import type { SeatMapItemResponse } from '../api/types'

const STATUS_FILL: Record<string, string> = {
  AVAILABLE: '#E0F2FE',
  HELD: '#FEF3C7',
  SOLD: '#E2E8F0',
}
const STATUS_STROKE: Record<string, string> = {
  AVAILABLE: '#7DD3FC',
  HELD: '#FCD34D',
  SOLD: '#CBD5E1',
}
const STATUS_TEXT: Record<string, string> = {
  AVAILABLE: '#0C4A6E',
  HELD: '#92400E',
  SOLD: '#94A3B8',
}
const SELECTED_FILL = '#10B981'

const WIDTH = 320
const FOCUS_X = WIDTH / 2
const SPAN_DEG = 56
const BASE_R = 86
const ROW_GAP = 48
const SEAT_R = 14
const TOP_MARGIN = 30

/**
 * 좌석을 한 줄씩 호(arc)로 그린다 — 가까운 줄(1열)이 안쪽, 뒷줄일수록 바깥쪽으로 둥글게 퍼진다.
 * StadiumMap에서 쓰는 구역 이름(예: "1루 외야석 B")을 알면 1루/3루 방향에 맞게 좌우를 뒤집어서,
 * 큰 지도에서 그 구역을 봤을 때와 같은 방향으로 보이게 한다. 이름을 모르면(옛 데이터) 평평한
 * 격자로 되돌아간다.
 */
export function SeatArcGrid({
  items,
  sectionName,
  selectedIds,
  onToggle,
}: {
  items: SeatMapItemResponse[]
  sectionName: string
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const info = parseSectionName(sectionName)
  if (!info) {
    return <FlatFallbackGrid items={items} selectedIds={selectedIds} onToggle={onToggle} />
  }
  const mirror = familySide(info.family) === 'left'

  const rows = new Map<number, SeatMapItemResponse[]>()
  for (const item of items) {
    const list = rows.get(item.rowNo) ?? []
    list.push(item)
    rows.set(item.rowNo, list)
  }
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b)
  const maxRadius = BASE_R + (rowNumbers.length - 1) * ROW_GAP
  const height = maxRadius + TOP_MARGIN + SEAT_R + 24
  const focusY = height - 16

  const seatPos = (rowIndex: number, t: number) => {
    const radius = BASE_R + rowIndex * ROW_GAP
    const angle = (mirror ? -1 : 1) * (-SPAN_DEG / 2 + t * SPAN_DEG)
    const rad = (angle * Math.PI) / 180
    return { x: FOCUS_X + radius * Math.sin(rad), y: focusY - radius * Math.cos(rad) }
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full max-w-md">
        {rowNumbers.map((rowNo, rowIndex) => {
          const rowItems = [...rows.get(rowNo)!].sort((a, b) => a.seatNo - b.seatNo)
          const labelAngle = -SPAN_DEG / 2 - 11
          const labelRad = (labelAngle * Math.PI) / 180
          const labelRadius = BASE_R + rowIndex * ROW_GAP
          const labelPos = { x: FOCUS_X + labelRadius * Math.sin(labelRad), y: focusY - labelRadius * Math.cos(labelRad) }

          return (
            <g key={rowNo}>
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="select-none text-[11px] font-semibold fill-slate-400"
              >
                {rowNo}열
              </text>
              {rowItems.map((item, seatIndex) => {
                const t = rowItems.length === 1 ? 0.5 : seatIndex / (rowItems.length - 1)
                const pos = seatPos(rowIndex, t)
                const selected = selectedIds.has(item.gameSeatId)
                const clickable = item.status === 'AVAILABLE'
                return (
                  <g
                    key={item.gameSeatId}
                    onClick={() => onToggle(item.gameSeatId)}
                    className={clickable || selected ? 'cursor-pointer' : 'cursor-not-allowed'}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={SEAT_R}
                      fill={selected ? SELECTED_FILL : STATUS_FILL[item.status]}
                      stroke={selected ? '#059669' : STATUS_STROKE[item.status]}
                      strokeWidth={selected ? 2 : 1.5}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none select-none text-[10px] font-bold"
                      fill={selected ? '#fff' : STATUS_TEXT[item.status]}
                    >
                      {item.seatNo}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <p className="mt-1 text-xs text-slate-400">⚾ 필드 방향</p>
    </div>
  )
}

function FlatFallbackGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items: SeatMapItemResponse[]
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const seatsPerRow = Math.max(...items.map((item) => item.seatNo))
  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const selected = selectedIds.has(item.gameSeatId)
        const clickable = item.status === 'AVAILABLE'
        return (
          <button
            key={item.gameSeatId}
            type="button"
            disabled={!clickable && !selected}
            title={`${item.rowNo}행 ${item.seatNo}번 · ${item.status}`}
            onClick={() => onToggle(item.gameSeatId)}
            className={[
              'flex size-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors',
              clickable ? 'cursor-pointer' : 'cursor-not-allowed',
              selected
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : item.status === 'AVAILABLE'
                  ? 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-100'
                  : item.status === 'HELD'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100'
                    : 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500',
            ].join(' ')}
          >
            {item.seatNo}
          </button>
        )
      })}
    </div>
  )
}
