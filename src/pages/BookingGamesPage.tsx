import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: '예매 전',
  OPEN: '예매 중',
  CLOSED: '예매 마감',
}

export function BookingGamesPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 0, 20],
    queryFn: () => listGames(0, 20),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">예매하기</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          경기를 골라 좌석을 선택하고 예매·결제까지 해 본다. "예매 중"인 경기만 좌석을 선점할 수 있다.
        </p>
      </div>

      {isPending && <p className="text-sm text-neutral-500">불러오는 중...</p>}
      {isError && <p className="text-sm text-red-600">경기 목록을 불러오지 못했다.</p>}

      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {data?.content.map((game) => {
          const open = game.status === 'OPEN'
          const row = (
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">
                  {game.homeTeam} vs {game.awayTeam}
                </p>
                <p className="text-sm text-neutral-500">{new Date(game.startAt).toLocaleString('ko-KR')}</p>
              </div>
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  open
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                ].join(' ')}
              >
                {STATUS_LABEL[game.status] ?? game.status}
              </span>
            </div>
          )
          return (
            <li key={game.id}>
              {open ? (
                <Link to={`/booking/${game.id}`} className="block hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  {row}
                </Link>
              ) : (
                <div className="opacity-60">{row}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
