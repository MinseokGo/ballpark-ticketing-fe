import { SEAT_STATUS_COLOR, SEAT_STATUS_LABEL } from '../lib/stadiumPalette'

/**
 * 좌석 상태 범례. 지도 색과 같은 값을 쓰도록 stadiumPalette에서 가져온다.
 * 예매 가능 좌석은 구역 계열 색으로 칠해지므로 그라데이션 견본으로 보여준다.
 */
export function SeatStatusLegend() {
  return (
    <div className="mt-4 shrink-0 space-y-2 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
      <p className="font-semibold text-slate-700 dark:text-slate-300">좌석 상태</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: SEAT_STATUS_COLOR.selected }} />
          {SEAT_STATUS_LABEL.selected}
        </li>
        <li className="flex items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-sm bg-gradient-to-r from-blue-600 via-violet-600 to-lime-600"
            aria-hidden
          />
          {SEAT_STATUS_LABEL.available}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: SEAT_STATUS_COLOR.held }} />
          {SEAT_STATUS_LABEL.held}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: SEAT_STATUS_COLOR.sold }} />
          {SEAT_STATUS_LABEL.sold}
        </li>
      </ul>
      <p className="flex items-center gap-2 pt-1 text-slate-500">
        <span className="size-3 shrink-0 rounded-sm border-2 border-slate-900 bg-slate-900/10 dark:border-white" />
        선택한 구역 테두리
      </p>
    </div>
  )
}
