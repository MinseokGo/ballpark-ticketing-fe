import { Link } from 'react-router-dom'
import { useBookingHistory } from '../hooks/useBookingHistory'
import { useUserId } from '../hooks/useUserId'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '결제 대기',
  CONFIRMED: '예매 완료',
  CANCELLED: '취소됨',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export function ProfilePage() {
  const [userId, setUserId] = useUserId()
  const { entries } = useBookingHistory()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">마이페이지</h1>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
          {userId}
        </div>
        <div className="flex-1">
          <p className="font-semibold">사용자 #{userId}</p>
          <p className="text-sm text-slate-500">야구장 멤버십 회원</p>
          <label className="mt-2 block w-32 text-xs text-slate-500">
            계정 전환
            <input
              type="number"
              min={1}
              value={userId}
              onChange={(event) => setUserId(Number(event.target.value) || 1)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">내 예약</h2>

        {entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            아직 예약한 경기가 없어요.{' '}
            <Link to="/booking" className="text-blue-600 hover:underline">
              예매하러 가기
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.reservationId}>
                <Link
                  to={`/booking/${entry.gameId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {entry.homeTeam} <span className="text-slate-400">vs</span> {entry.awayTeam}
                    </p>
                    <p className="tabular text-sm text-slate-500">
                      좌석 {entry.seatCount}개 · {entry.totalPrice.toLocaleString()}원
                    </p>
                  </div>
                  <span
                    className={['shrink-0 rounded-full px-3 py-1 text-xs font-semibold', STATUS_BADGE[entry.status]].join(
                      ' ',
                    )}
                  >
                    {STATUS_LABEL[entry.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
