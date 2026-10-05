import type { GameResponse, LiveEventResponse, LiveStateResponse } from '../api/types'
import { computeLinescore } from '../lib/linescore'
import { winnerLabel } from '../lib/gameResult'
import { teamColor, teamInitial } from '../lib/teamColors'

/**
 * 중계 상단 스코어보드. 팀 색 그라데이션 위에 현재 점수와 이닝, 이닝별 득점표를 보여준다.
 * 점수와 이닝은 중계 상태, 득점표는 이벤트 기록으로 만든다.
 */
export function LiveScoreboard({
  game,
  live,
  events,
  streaming,
}: {
  game: GameResponse
  live: LiveStateResponse | undefined
  events: LiveEventResponse[]
  streaming: boolean
}) {
  const progress = live?.progress ?? game.progress
  const homeScore = live?.homeScore ?? game.homeScore
  const awayScore = live?.awayScore ?? game.awayScore
  const inning = live?.inning ?? null
  const half = live?.half ?? null
  const linescore = computeLinescore(events)
  const columns = Array.from({ length: linescore.innings }, (_, index) => index + 1)

  const statusLabel =
    progress === 'LIVE'
      ? streaming
        ? '실시간 중계'
        : '중계 연결 중'
      : progress === 'FINISHED'
        ? '경기 종료'
        : progress === 'CANCELLED'
          ? '취소된 경기'
          : '경기 전'

  return (
    <section
      aria-label="스코어보드"
      className="animate-fade-up relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8"
      style={{
        backgroundImage: `linear-gradient(120deg, ${teamColor(game.awayTeam)} 0%, #0f172a 50%, ${teamColor(game.homeTeam)} 100%)`,
      }}
    >
      <span className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span
          className={[
            'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold backdrop-blur',
            progress === 'LIVE' ? 'bg-red-500/90' : 'bg-white/15',
          ].join(' ')}
        >
          {progress === 'LIVE' && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
          )}
          {statusLabel}
        </span>
        <span className="tabular text-sm font-semibold text-white/80">
          {progress === 'LIVE' && inning && half
            ? `${inning}회 ${half === 'TOP' ? '초' : '말'}`
            : progress === 'FINISHED'
              ? '최종'
              : ''}
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TeamSide team={game.awayTeam} score={awayScore} align="left" />
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-white/60">VS</p>
          {progress === 'FINISHED' && game.winner && (
            <p className="mt-1 text-xs font-bold text-white/80">{winnerLabel(game.winner, game.homeTeam, game.awayTeam)}</p>
          )}
        </div>
        <TeamSide team={game.homeTeam} score={homeScore} align="right" />
      </div>

      {columns.length > 0 && (
        <div className="relative mt-8 overflow-x-auto rounded-2xl bg-black/20 p-3 backdrop-blur">
          <table className="tabular w-full min-w-max text-center text-sm">
            <thead>
              <tr className="text-xs text-white/60">
                <th className="px-3 py-1 text-left font-semibold">팀</th>
                {columns.map((col) => (
                  <th key={col} className="w-9 px-1 py-1 font-semibold">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-1 font-extrabold text-white">R</th>
              </tr>
            </thead>
            <tbody>
              <LinescoreRow label={game.awayTeam} runs={linescore.away} columns={columns} total={awayScore} />
              <LinescoreRow label={game.homeTeam} runs={linescore.home} columns={columns} total={homeScore} />
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TeamSide({ team, score, align }: { team: string; score: number; align: 'left' | 'right' }) {
  const right = align === 'right'
  return (
    <div className={`flex min-w-0 items-center gap-3 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-base font-extrabold backdrop-blur sm:size-14">
        {teamInitial(team)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white/80">{team}</p>
        <p className="tabular text-5xl font-extrabold leading-none sm:text-6xl">{score}</p>
      </div>
    </div>
  )
}

function LinescoreRow({
  label,
  runs,
  columns,
  total,
}: {
  label: string
  runs: number[]
  columns: number[]
  total: number
}) {
  return (
    <tr className="border-t border-white/10">
      <td className="max-w-[10rem] truncate px-3 py-2 text-left font-semibold">{label}</td>
      {columns.map((col) => (
        <td key={col} className="px-1 py-2 text-white/90">
          {runs[col - 1] ?? 0}
        </td>
      ))}
      <td className="px-3 py-2 font-extrabold">{total}</td>
    </tr>
  )
}
