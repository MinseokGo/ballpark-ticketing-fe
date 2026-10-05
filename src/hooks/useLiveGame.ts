import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getLiveState } from '../api/booking'
import { API_BASE_URL } from '../api/client'
import type { GameProgress, LiveEventResponse, LiveStateResponse } from '../api/types'
import { streamSse } from '../lib/sse'

const RECONNECT_MS = 3_000

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

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * 경기 중계 스트림. 이벤트가 올 때마다 목록에 붙이고 진행 상태 캐시를 고친다.
 * 끊기면 마지막 번호(Last-Event-ID) 이후만 다시 받는다. 끝나는 이벤트를 받으면 멈춘다.
 * enabled가 false면 연결하지 않는다.
 */
export function useLiveBroadcast(gameId: number, enabled: boolean) {
  const queryClient = useQueryClient()
  const [events, setEvents] = useState<LiveEventResponse[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const { signal } = controller
    const url = `${API_BASE_URL}/api/games/${gameId}/live/stream`
    let lastSeq = 0
    let ended = false

    const onFrame = (frame: { data: string }) => {
      const event = JSON.parse(frame.data) as LiveEventResponse
      // 재접속 때 겹쳐 오는 이벤트는 버린다. 점수와 이닝은 절대값이라 다시 적용해도 상태가 같다.
      if (event.seq <= lastSeq) return
      lastSeq = event.seq
      setEvents((prev) => [...prev, event])
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
        ended = true
        queryClient.invalidateQueries({ queryKey: ['games'] })
      }
    }

    const run = async () => {
      while (!signal.aborted && !ended) {
        try {
          await streamSse(url, {
            signal,
            lastEventId: lastSeq > 0 ? lastSeq : undefined,
            onFrame: (frame) => {
              setConnected(true)
              onFrame(frame)
            },
          })
        } catch {
          // 연결 실패는 아래에서 재시도한다.
        }
        setConnected(false)
        if (signal.aborted || ended) break
        await wait(RECONNECT_MS, signal)
      }
    }
    run()

    return () => {
      controller.abort()
      setConnected(false)
    }
  }, [gameId, enabled, queryClient])

  return { events, connected }
}
