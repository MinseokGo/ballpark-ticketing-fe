import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../api/client'
import type { GameSeatStatus, SeatMapItemResponse } from '../api/types'
import { streamSse } from '../lib/sse'

export type SeatChange = { gameSeatId: number; status: GameSeatStatus }

const RECONNECT_MS = 3_000
// 좌석 변경은 짧게 모아서 한 번에 반영한다. 2만 석 좌석표는 다시 그리는 비용이 커서 낱개로 바꾸지 않는다.
const FLUSH_MS = 250

/**
 * 좌석 상태 실시간 반영. 다른 사용자의 선점·판매·취소가 좌석표에 바로 나타나고,
 * onChanges로 호출한 쪽에 알린다(내가 고른 좌석이 빠졌는지 확인할 때 쓴다).
 * 연결이 끊기면 좌석표를 다시 받는다.
 */
export function useSeatStream(gameId: number, onChanges: (changes: SeatChange[]) => void): boolean {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const onChangesRef = useRef(onChanges)

  useEffect(() => {
    onChangesRef.current = onChanges
  }, [onChanges])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const url = `${API_BASE_URL}/api/games/${gameId}/seats/stream`
    let pending: SeatChange[] = []
    let timer: number | undefined
    let hadConnection = false

    const flush = () => {
      timer = undefined
      const changes = pending
      pending = []
      if (changes.length === 0) return
      const byId = new Map(changes.map((change) => [change.gameSeatId, change.status] as const))
      queryClient.setQueryData<SeatMapItemResponse[]>(['seatMap', gameId], (list) =>
        list?.map((item) => (byId.has(item.gameSeatId) ? { ...item, status: byId.get(item.gameSeatId)! } : item)),
      )
      queryClient.invalidateQueries({ queryKey: ['sectionAvailability', gameId] })
      onChangesRef.current(changes)
    }

    const run = async () => {
      while (!signal.aborted) {
        try {
          await streamSse(url, {
            signal,
            onFrame: (frame) => {
              if (!hadConnection) {
                hadConnection = true
                setConnected(true)
                // 연결 전에 바뀐 좌석이 있을 수 있으니, 연결 뒤 한 번 다시 받는다.
                queryClient.invalidateQueries({ queryKey: ['seatMap', gameId] })
              }
              const changes = JSON.parse(frame.data) as SeatChange[]
              pending.push(...changes)
              if (timer === undefined) timer = window.setTimeout(flush, FLUSH_MS)
            },
          })
        } catch {
          // 끊기면 아래에서 다시 붙는다.
        }
        setConnected(false)
        hadConnection = false
        if (signal.aborted) break
        await new Promise<void>((resolve) => {
          const wait = window.setTimeout(resolve, RECONNECT_MS)
          signal.addEventListener('abort', () => {
            window.clearTimeout(wait)
            resolve()
          })
        })
        queryClient.invalidateQueries({ queryKey: ['seatMap', gameId] })
      }
    }
    run()

    return () => {
      controller.abort()
      if (timer !== undefined) window.clearTimeout(timer)
      setConnected(false)
    }
  }, [gameId, queryClient])

  return connected
}
