import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import { EventBanner } from '../components/EventBanner'
import { GameCard } from '../components/GameCard'
import { SkeletonList } from '../components/Skeleton'

function greeting(hour: number) {
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '오늘 야구 보러 갈까요?'
  return '오늘 저녁 경기 어때요?'
}

export function HomePage() {
  const [hour] = useState(() => new Date().getHours())
  const { data, isPending } = useQuery({
    queryKey: ['games', 0, 5],
    queryFn: () => listGames(0, 5),
  })

  return (
    <div className="space-y-10">
      <section className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{greeting(hour)}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">야구장</h1>
      </section>

      <section className="animate-fade-up [animation-delay:60ms]">
        <EventBanner />
      </section>

      <section className="animate-fade-up [animation-delay:120ms]">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">다가오는 경기</h2>
          <Link to="/booking" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
            전체 보기
          </Link>
        </div>

        {isPending && <SkeletonList count={3} />}
        {data?.content.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            아직 열린 경기가 없어요.
          </p>
        )}
        <div className="space-y-2">
          {data?.content.map((game, index) => (
            <div key={game.id} className="animate-fade-up" style={{ animationDelay: `${180 + index * 60}ms` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-up grid grid-cols-2 gap-3 [animation-delay:240ms]">
        <Link
          to="/booking"
          className="press rounded-2xl border border-slate-200 bg-white p-5 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <p className="text-2xl">🎟️</p>
          <p className="mt-2 font-semibold">예매하기</p>
          <p className="text-sm text-slate-500">좌석을 고르고 결제까지</p>
        </Link>
        <Link
          to="/profile"
          className="press rounded-2xl border border-slate-200 bg-white p-5 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <p className="text-2xl">🙋</p>
          <p className="mt-2 font-semibold">마이페이지</p>
          <p className="text-sm text-slate-500">내 예약 확인하기</p>
        </Link>
      </section>
    </div>
  )
}
