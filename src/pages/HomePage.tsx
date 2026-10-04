import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listGames } from '../api/booking'
import { GameCard } from '../components/GameCard'

export function HomePage() {
  const { data, isPending } = useQuery({
    queryKey: ['games', 0, 5],
    queryFn: () => listGames(0, 5),
  })

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white">
        <p className="text-sm font-medium text-blue-100">오늘도 야구 보러 갈까요?</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          좋아하는 팀의
          <br />
          경기를 예매해 보세요
        </h1>
        <Link
          to="/booking"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-blue-700 transition-transform hover:-translate-y-0.5"
        >
          예매하러 가기 <span aria-hidden>→</span>
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">다가오는 경기</h2>
          <Link to="/booking" className="text-sm text-slate-500 hover:underline">
            전체 보기
          </Link>
        </div>

        {isPending && <p className="text-sm text-slate-500">불러오는 중...</p>}
        {data?.content.length === 0 && (
          <p className="text-sm text-slate-500">아직 등록된 경기가 없다.</p>
        )}
        <div className="space-y-2">
          {data?.content.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/booking"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-2xl">🎟️</p>
          <p className="mt-2 font-semibold">예매하기</p>
          <p className="text-sm text-slate-500">좌석을 고르고 결제까지</p>
        </Link>
        <Link
          to="/profile"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-2xl">🙋</p>
          <p className="mt-2 font-semibold">마이페이지</p>
          <p className="text-sm text-slate-500">내 예약 확인하기</p>
        </Link>
      </section>
    </div>
  )
}
