import type { StandingResponse } from '../api/types'
import { teamColor } from '../lib/teamColors'
import { formatGamesBehind, formatWinRate } from '../lib/standingFormat'

function TeamMark({ name }: { name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: teamColor(name) }} />
      <span className="truncate font-semibold">{name}</span>
    </span>
  )
}

/** 전체 순위표. 승·무·패, 승률, 게임차를 모두 보여준다. */
export function StandingsTable({ rows }: { rows: StandingResponse[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
        <thead className="text-xs text-slate-500">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="py-3 pl-2 font-semibold">순위</th>
            <th className="py-3 font-semibold">팀</th>
            <th className="py-3 text-right font-semibold">경기</th>
            <th className="py-3 text-right font-semibold">승</th>
            <th className="py-3 text-right font-semibold">패</th>
            <th className="py-3 text-right font-semibold">무</th>
            <th className="py-3 text-right font-semibold">승률</th>
            <th className="py-3 pr-2 text-right font-semibold">게임차</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.teamName} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-3 pl-2 font-extrabold">{row.rank}</td>
              <td className="py-3">
                <TeamMark name={row.teamName} />
              </td>
              <td className="py-3 text-right">{row.games}</td>
              <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{row.wins}</td>
              <td className="py-3 text-right">{row.losses}</td>
              <td className="py-3 text-right text-slate-500">{row.draws}</td>
              <td className="py-3 text-right font-semibold">{formatWinRate(row.winRate)}</td>
              <td className="py-3 pr-2 text-right text-slate-500">{formatGamesBehind(row.gamesBehind)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 홈 위젯용 요약. 상위 몇 팀만 순위·팀·승패·게임차로 보여준다. */
export function StandingsCompact({ rows, limit = 5 }: { rows: StandingResponse[]; limit?: number }) {
  return (
    <ol className="space-y-1.5 text-sm tabular-nums">
      {rows.slice(0, limit).map((row) => (
        <li key={row.teamName} className="flex items-center gap-2 rounded-xl px-2 py-1.5 odd:bg-slate-50 dark:odd:bg-slate-800/60">
          <span className="w-5 shrink-0 text-center font-extrabold">{row.rank}</span>
          <TeamMark name={row.teamName} />
          <span className="ml-auto shrink-0 text-slate-500">
            {row.wins}승 {row.losses}패
          </span>
          <span className="w-12 shrink-0 text-right font-semibold">{formatWinRate(row.winRate)}</span>
        </li>
      ))}
    </ol>
  )
}
