import { useQuery } from '@tanstack/react-query'
import { GameCard } from '../components/GameCard'
import { SkeletonList } from '../components/Skeleton'
import { listGames } from '../api/booking'

export function BookingGamesPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['games', 0, 20],
    queryFn: () => listGames(0, 20),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">예매하기</h1>
        <p className="mt-1 text-slate-500">
          경기를 골라 좌석을 선택하고 예매·결제까지 해 본다. "예매 중"인 경기만 좌석을 고를 수 있다.
        </p>
      </div>

      {isPending && <SkeletonList count={4} />}
      {isError && <p className="text-sm text-red-600">경기 목록을 불러오지 못했다.</p>}

      <div className="space-y-2">
        {data?.content.map((game, index) => (
          <div key={game.id} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </div>
  )
}
