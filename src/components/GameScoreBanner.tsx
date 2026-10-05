import type { GameResponse, LiveStateResponse } from '../api/types'
import { winnerLabel } from '../lib/gameResult'
import { teamColor, teamInitial } from '../lib/teamColors'

/**
 * 예매 화면 상단의 경기 상태 띠. 진행 중이면 실시간 점수, 끝났으면 최종 점수와 승부를 보여준다.
 * streaming은 SSE 연결이 살아 있는지다. 끊겨 있으면 폴링 값으로 보여준다.
 */
export function GameScoreBanner({
  game,
  live,
  streaming,
}: {
  game: GameResponse
  live: LiveStateResponse | undefined
  streaming: boolean
}) {
  const progress = live?.progress ?? game.progress
  if (progress === 'NOT_STARTED') return null

  const homeScore = live?.homeScore ?? game.homeScore
  const awayScore = live?.awayScore ?? game.awayScore
  const inning = live?.inning ?? null
  const half = live?.half ?? null

  return (
    <section
      aria-label="경기 상태"
      className="animate-fade-up flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex min-w-0 items-center gap-3">
        <TeamBadge team={game.homeTeam} />
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{game.homeTeam}</p>
          <p className="tabular text-3xl font-extrabold leading-none">{homeScore}</p>
        </div>
      </div>

      <div className="text-center">
        {progress === 'LIVE' && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
            <p className="tabular mt-1 text-sm font-semibold text-slate-500">
              {inning && half ? `${inning}회 ${half === 'TOP' ? '초' : '말'}` : '진행 중'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{streaming ? '실시간 연결' : '주기적으로 갱신'}</p>
          </>
        )}
        {progress === 'FINISHED' && (
          <>
            <span className="text-xs font-bold text-slate-500">경기 종료</span>
            <p className="text-sm font-semibold">{winnerLabel(game.winner, game.homeTeam, game.awayTeam)}</p>
          </>
        )}
        {progress === 'CANCELLED' && <span className="text-sm font-bold text-slate-500">취소된 경기</span>}
      </div>

      <div className="flex min-w-0 flex-row-reverse items-center gap-3 text-right">
        <TeamBadge team={game.awayTeam} />
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{game.awayTeam}</p>
          <p className="tabular text-3xl font-extrabold leading-none">{awayScore}</p>
        </div>
      </div>
    </section>
  )
}

function TeamBadge({ team }: { team: string }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: teamColor(team) }}
    >
      {teamInitial(team)}
    </span>
  )
}
