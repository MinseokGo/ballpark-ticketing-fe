import { Link } from 'react-router-dom'
import type { GameSummaryResponse } from '../../api/types'
import { gameHref } from '../../lib/gameRoutes'
import { teamColor, teamInitial } from '../../lib/teamColors'
import { dayDiff, dateLabel, timeLabel } from '../../lib/gameDates'

export function NextGameHero({ game, now }: { game: GameSummaryResponse; now: Date }) {
  const days = dayDiff(game.startAt, now)
  const dday = days === 0 ? 'D-DAY' : days > 0 ? `D-${days}` : '지난 경기'
  const open = game.status === 'OPEN'
  return (
    <Link
      to={gameHref(game) ?? '/schedule'}
      className="press group relative block h-full overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8"
      style={{
        backgroundImage: `linear-gradient(135deg, ${teamColor(game.homeTeam)}, ${teamColor(game.awayTeam)})`,
      }}
    >
      <span className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-110" />
      <span className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-white/5 transition-transform duration-700 group-hover:scale-110" />

      <div className="relative flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">다음 경기</span>
        <span className="tabular rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur">{dday}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
          {open ? '예매 중' : '예매 전'}
        </span>
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular text-sm font-semibold text-white/80">
            {dateLabel(game.startAt)} · {timeLabel(game.startAt)}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="block truncate">{game.homeTeam}</span>
            <span className="my-1 block text-base font-semibold text-white/60">vs</span>
            <span className="block truncate">{game.awayTeam}</span>
          </p>
        </div>
        <div className="flex shrink-0 -space-x-3">
          {[game.homeTeam, game.awayTeam].map((team) => (
            <span
              key={team}
              className="flex size-16 items-center justify-center rounded-full border-4 border-white/30 text-lg font-extrabold text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              {teamInitial(team)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-8 flex items-center justify-between">
        <span className="text-sm text-white/80">홈 {game.homeTeam} · 원정 {game.awayTeam}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">
          {open ? '좌석 고르러 가기' : '일정 보기'}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}

/** 이 브라우저에서 한 예매. 서버 최신 상태와 다를 수 있어서 이 기기 기록이라는 점은 마이페이지에서 설명한다. */
