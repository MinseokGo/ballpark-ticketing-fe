import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getLiveState } from '../api/booking'
import { API_BASE_URL } from '../api/client'
import type { GameProgress, LiveEventResponse, LiveStateResponse } from '../api/types'

const EVENT_TYPES = [
  'GAME_STARTED',
  'INNING_CHANGED',
  'SCORE_CHANGED',
  'SCORE_CORRECTED',
  'GAME_FINISHED',
  'GAME_CANCELLED',
] as const

export const liveKey = (gameId: number) => ['live', gameId] as const

/** 진행 상태 스냅샷을 주기적으로 받는다. pollMs가 false면 자동 갱신을 끈다. */
export function useLiveState(gameId: number, pollMs: number | false) {
  return useQuery({
    queryKey: liveKey(gameId),
    queryFn: () => getLiveState(gameId),
    refetchInterval: pollMs,
  })
}

function progressAfter(type: string): GameProgress {
  if (type === 'GAME_FINISHED') return 'FINISHED'
  if (type === 'GAME_CANCELLED') return 'CANCELLED'
  return 'LIVE'
}

/**
 * 진행 중 경기의 SSE 스트림. 연결되면 true.
 * 이벤트마다 상태 캐시를 바로 고치고, 끝나는 이벤트에서는 연결을 닫고 목록을 다시 받는다.
 * 끝난 경기는 서버가 바로 닫으므로 호출하는 쪽은 enabled를 LIVE일 때만 켠다(재연결 반복 방지).
 */
export function useLiveStream(gameId: number, enabled: boolean): boolean {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const source = new EventSource(`${API_BASE_URL}/api/games/${gameId}/live/stream`)
    const onEvent = (message: Event) => {
      const event = JSON.parse((message as MessageEvent<string>).data) as LiveEventResponse
      queryClient.setQueryData<LiveStateResponse>(liveKey(gameId), {
        gameId,
        progress: progressAfter(event.type),
        inning: event.inning,
        half: event.half,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
        seq: event.seq,
      })
      if (event.terminal) {
        source.close()
        setConnected(false)
        queryClient.invalidateQueries({ queryKey: ['games'] })
      }
    }
    EVENT_TYPES.forEach((type) => source.addEventListener(type, onEvent))
    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)
    return () => {
      source.close()
    }
  }, [gameId, enabled, queryClient])

  return connected
}
