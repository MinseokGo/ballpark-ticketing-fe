import { Link } from 'react-router-dom'
import type { GameSummaryResponse } from '../../api/types'
import { type BookingHistoryEntry } from '../../hooks/useBookingHistory'
import { gameHref } from '../../lib/gameRoutes'
import { dateLabel, timeLabel } from '../../lib/gameDates'

export function MyReservationCard({ entry, game }: { entry: BookingHistoryEntry; game?: GameSummaryResponse }) {
  const confirmed = entry.status === 'CONFIRMED'
  const href = (game && gameHref(game)) ?? `/booking/${entry.gameId}`
  return (
    <Link
      to={href}
      className="press group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
            confirmed
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
          ].join(' ')}
        >
          <span className={`size-1.5 rounded-full ${confirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {confirmed ? '예매 완료' : '결제 대기'}
        </span>
        <span className="tabular text-xs text-slate-500">예약 #{entry.reservationId}</span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold">
          {entry.homeTeam} <span className="text-sm font-semibold text-slate-400">vs</span> {entry.awayTeam}
        </p>
        {game && (
          <p className="tabular mt-1 text-sm text-slate-500">
            {dateLabel(game.startAt)} · {timeLabel(game.startAt)}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500">좌석</p>
          <p className="tabular font-bold">{entry.seatCount}석</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">결제 금액</p>
          <p className="tabular font-bold">{entry.totalPrice.toLocaleString()}원</p>
        </div>
      </div>
    </Link>
  )
}
