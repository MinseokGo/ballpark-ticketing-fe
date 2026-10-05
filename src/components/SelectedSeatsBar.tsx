import { SEAT_STATUS_COLOR } from '../lib/stadiumPalette'

export type SelectedSeat = {
  gameSeatId: number
  sectionName: string
  rowNo: number
  seatNo: number
  price: number
}

/**
 * 하단에 고정되는 선택 좌석 바. 고른 좌석마다 지도와 같은 선택 색 칩을 달고, 구역·열·번호·가격을 보여준다.
 * 칩의 × 를 누르면 지도에서도 같이 빠진다.
 */
export function SelectedSeatsBar({
  seats,
  max,
  total,
  reserving,
  onRemove,
  onReserve,
}: {
  seats: SelectedSeat[]
  max: number
  total: number
  reserving: boolean
  onRemove: (gameSeatId: number) => void
  onReserve: () => void
}) {
  return (
    <div className="animate-slide-up fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4 lg:px-10">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-medium text-slate-500">
            선택한 좌석 <span className="tabular font-bold text-slate-900 dark:text-slate-50">{seats.length}</span> / {max}
          </p>
          {seats.length === 0 ? (
            <p className="text-sm text-slate-500">지도에서 좌석을 눌러 골라 주세요.</p>
          ) : (
            <ul className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
              {seats.map((seat) => {
                return (
                  <li
                    key={seat.gameSeatId}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-2 pr-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SEAT_STATUS_COLOR.selected }}
                    />
                    <span className="font-semibold">{seat.sectionName}</span>
                    <span className="tabular text-slate-500">
                      {seat.rowNo}열 {seat.seatNo}번
                    </span>
                    <span className="tabular text-slate-500">{seat.price.toLocaleString()}원</span>
                    <button
                      type="button"
                      onClick={() => onRemove(seat.gameSeatId)}
                      aria-label={`${seat.sectionName} ${seat.rowNo}열 ${seat.seatNo}번 빼기`}
                      className="press flex size-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="tabular text-right">
            <span className="block text-xs text-slate-500">총 결제 금액</span>
            <span className="text-lg font-extrabold">{total.toLocaleString()}원</span>
          </p>
          <button
            type="button"
            disabled={seats.length === 0 || reserving}
            onClick={onReserve}
            className="press shrink-0 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none"
          >
            {reserving ? '예매하는 중...' : '이 좌석으로 예매하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
