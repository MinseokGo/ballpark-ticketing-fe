import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { listChatMessages, postChatMessage } from '../api/booking'
import { API_BASE_URL } from '../api/client'
import type { ChatMessageResponse } from '../api/types'
import { CURRENT_USER_ID } from '../constants'
import { streamSse } from '../lib/sse'

const RECONNECT_MS = 3_000

const chatKey = (gameId: number) => ['chat', gameId] as const

function appendMessage(list: ChatMessageResponse[] | undefined, message: ChatMessageResponse) {
  const current = list ?? []
  // 재접속이나 내 전송 응답과 스트림이 겹쳐 같은 메시지가 두 번 와도 한 번만 남긴다.
  if (current.some((item) => item.id === message.id)) return current
  return [...current, message]
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
 * 경기 채팅. 처음에는 최근 메시지를 받고, 그 뒤 SSE로 새 메시지를 받는다.
 * 끊기면 마지막 메시지 번호 이후만 다시 받는다. 내 메시지는 전송 응답으로 바로 붙인다.
 */
export function useLiveChat(gameId: number) {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const query = useQuery({
    queryKey: chatKey(gameId),
    queryFn: () => listChatMessages(gameId),
  })

  useEffect(() => {
    if (!query.isSuccess) return
    const controller = new AbortController()
    const { signal } = controller
    const url = `${API_BASE_URL}/api/games/${gameId}/chat/stream`
    let lastId = 0

    const latestId = (list: ChatMessageResponse[] | undefined) =>
      list && list.length > 0 ? list[list.length - 1].id : 0

    const run = async () => {
      while (!signal.aborted) {
        lastId = Math.max(lastId, latestId(queryClient.getQueryData<ChatMessageResponse[]>(chatKey(gameId))))
        try {
          await streamSse(url, {
            signal,
            lastEventId: lastId > 0 ? lastId : undefined,
            onFrame: (frame) => {
              setConnected(true)
              const message = JSON.parse(frame.data) as ChatMessageResponse
              lastId = Math.max(lastId, message.id)
              queryClient.setQueryData<ChatMessageResponse[]>(chatKey(gameId), (list) => appendMessage(list, message))
            },
          })
        } catch {
          // 연결 실패는 아래에서 다시 붙는다.
        }
        setConnected(false)
        if (signal.aborted) break
        await wait(RECONNECT_MS, signal)
      }
    }
    run()

    return () => {
      controller.abort()
      setConnected(false)
    }
  }, [gameId, query.isSuccess, queryClient])

  const send = useMutation({
    mutationFn: (content: string) => postChatMessage(gameId, CURRENT_USER_ID, content),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessageResponse[]>(chatKey(gameId), (list) => appendMessage(list, message))
    },
  })

  return { messages: query.data ?? [], loading: query.isPending, connected, send }
}
