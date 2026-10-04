import type { SeatMapItemResponse } from '../api/types'

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-100',
  HELD: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100',
  SOLD: 'bg-neutral-200 border-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-500',
}

const SELECTED_STYLE =
  'bg-emerald-500 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-400'

/** 한 구역의 좌석을 행x열 격자로 그린다. AVAILABLE 좌석만 클릭해서 선택할 수 있다. */
export function SeatMapGrid({
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
    <div
      className="inline-grid gap-1"
      style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}
    >
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
              'flex size-7 items-center justify-center rounded border text-[10px] font-medium transition-colors',
              clickable ? 'cursor-pointer' : 'cursor-not-allowed',
              selected ? SELECTED_STYLE : STATUS_STYLE[item.status],
            ].join(' ')}
          >
            {item.seatNo}
          </button>
        )
      })}
    </div>
  )
}
