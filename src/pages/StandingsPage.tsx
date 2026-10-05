import { Skeleton } from '../components/Skeleton'
import { StandingsTable } from '../components/StandingsTable'
import { useStandings } from '../hooks/useStandings'

export function StandingsPage() {
  const { data, isPending, isError } = useStandings()
  const hasGames = data?.some((row) => row.games > 0) ?? false

  return (
    <div className="space-y-6">
      <header className="animate-fade-up space-y-1">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">순위</p>
        <h1 className="text-3xl font-extrabold tracking-tight">팀 순위</h1>
        <p className="text-sm text-slate-500">
          끝난 경기만 집계해요. 승률은 무승부를 뺀 승/(승+패)이고, 게임차는 1위와의 차이예요.
        </p>
      </header>

      {isPending && <Skeleton className="h-96" />}
      {isError && (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          순위를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {data && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <StandingsTable rows={data} />
          {!hasGames && (
            <p className="mt-4 text-center text-sm text-slate-500">아직 끝난 경기가 없어요. 첫 경기가 끝나면 순위가 채워져요.</p>
          )}
        </section>
      )}
    </div>
  )
}
