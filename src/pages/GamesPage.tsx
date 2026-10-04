import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createGame } from '../api/admin'
import { ApiError } from '../api/client'
import { ErrorBanner, SuccessBanner } from '../components/Banner'
import { GAMES_REGISTRY_KEY } from '../constants'
import { useLocalRegistry } from '../hooks/useLocalRegistry'
import type { GameResponse } from '../api/types'

export function GamesPage() {
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [startAt, setStartAt] = useState('')
  const [ticketOpenAt, setTicketOpenAt] = useState('')
  const { items: games, add: addGame } = useLocalRegistry<GameResponse>(GAMES_REGISTRY_KEY)

  const mutation = useMutation({
    mutationFn: () => createGame({ homeTeam, awayTeam, startAt, ticketOpenAt }),
    onSuccess: (game) => {
      addGame(game)
      setHomeTeam('')
      setAwayTeam('')
      setStartAt('')
      setTicketOpenAt('')
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">경기 등록</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          POST /api/admin/games — 등록과 동시에 현재 존재하는 모든 좌석에 GameSeat를 만든다.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            홈 팀
            <input
              required
              value={homeTeam}
              onChange={(event) => setHomeTeam(event.target.value)}
              placeholder="Seoul Comets"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block text-sm">
            원정 팀
            <input
              required
              value={awayTeam}
              onChange={(event) => setAwayTeam(event.target.value)}
              placeholder="Busan Gulls"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block text-sm">
            예매 오픈 시각
            <input
              required
              type="datetime-local"
              value={ticketOpenAt}
              onChange={(event) => setTicketOpenAt(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block text-sm">
            경기 시작 시각
            <input
              required
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          예매 오픈 시각은 경기 시작 시각보다 이전이어야 한다(그렇지 않으면 400 GAME-001).
        </p>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {mutation.isPending ? '등록 중...' : '경기 등록'}
        </button>
      </form>

      {mutation.isError && <ErrorBanner error={mutation.error as ApiError} />}
      {mutation.isSuccess && (
        <SuccessBanner>
          경기 #{mutation.data.id} &lsquo;{mutation.data.homeTeam} vs {mutation.data.awayTeam}
          &rsquo;을 등록했다. GameSeat {mutation.data.gameSeatCount.toLocaleString()}개가 함께
          생성됐다.
        </SuccessBanner>
      )}

      <div>
        <h2 className="font-semibold">이 브라우저에서 등록한 경기</h2>
        <p className="mb-2 text-xs text-neutral-500">
          서버 조회 API가 없어 이 목록도 localStorage 기록일 뿐이다.
        </p>
        {games.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 등록한 경기가 없다.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 pr-4">ID</th>
                <th className="py-1 pr-4">대결</th>
                <th className="py-1 pr-4">상태</th>
                <th className="py-1 pr-4">GameSeat</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-1 pr-4">{game.id}</td>
                  <td className="py-1 pr-4">
                    {game.homeTeam} vs {game.awayTeam}
                  </td>
                  <td className="py-1 pr-4">{game.status}</td>
                  <td className="py-1 pr-4">{game.gameSeatCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
