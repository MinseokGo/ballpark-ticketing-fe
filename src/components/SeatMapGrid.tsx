import { groupIntoBlocks } from '../lib/seatBlocks'
import type { SeatMapItemResponse } from '../api/types'

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-100',
  HELD: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100',
  SOLD: 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500',
}

const SELECTED_STYLE =
  'bg-emerald-500 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-400'

/**
 * 한 구역을 실제 경기장처럼 여러 블록으로 나눠서 그린다(블록마다 작은 격자 + 블록 번호).
 * AVAILABLE 좌석만 클릭해서 선택할 수 있다.
 */
export function SeatMapGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items: SeatMapItemResponse[]
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const blocks = groupIntoBlocks(items)

  return (
    <div className="flex flex-wrap justify-center gap-5">
      {blocks.map((blockItems, blockIndex) => {
        const cols = new Set(blockItems.map((item) => item.seatNo)).size

        return (
          <div key={blockIndex} className="flex flex-col items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {blockIndex + 1}블록
            </span>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {blockItems.map((item) => {
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
                      selected ? SELECTED_STYLE : STATUS_STYLE[item.status],
                    ].join(' ')}
                  >
                    {item.seatNo}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
