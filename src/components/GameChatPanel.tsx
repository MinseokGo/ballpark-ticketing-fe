import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLiveChat } from '../hooks/useLiveChat'
import { ApiError } from '../api/client'
import { formatKst } from '../lib/serverTime'
import { ErrorBanner } from './Banner'

const MAX_LENGTH = 200

/** 경기 채팅 패널. 내 메시지는 오른쪽, 다른 사람 메시지는 왼쪽에 놓는다. */
export function GameChatPanel({ gameId }: { gameId: number }) {
  const chat = useLiveChat(gameId)
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // 새 메시지가 오면 맨 아래로 내린다.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [chat.messages.length])

  const submit = () => {
    const content = draft.trim()
    if (!content || chat.send.isPending) return
    chat.send.mutate(content, { onSuccess: () => setDraft('') })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="flex h-[min(560px,70svh)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="font-bold">실시간 채팅</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`size-1.5 rounded-full ${chat.connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {chat.connected ? '같이 보는 중' : '다시 연결하는 중'}
          </p>
        </div>
        <span className="tabular text-xs text-slate-500">{chat.messages.length}개</span>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {chat.loading && <p className="text-center text-sm text-slate-500">불러오는 중...</p>}
        {!chat.loading && chat.messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-slate-500">첫 메시지를 남겨 보세요.</p>
        )}
        {chat.messages.map((message) => {
          const mine = user !== null && message.userId === user.id
          return (
            <div key={message.id} className={`animate-fade-up flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && <span className="mb-1 text-[11px] text-slate-500">{message.nickname ?? '알 수 없음'}</span>}
              <div
                className={[
                  'max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm',
                  mine
                    ? 'rounded-br-md bg-blue-600 text-white'
                    : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
                ].join(' ')}
              >
                {message.content}
              </div>
              {message.createdAt && (
                <span className="tabular mt-1 text-[10px] text-slate-400">
                  {formatKst(message.createdAt, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {chat.send.error instanceof ApiError && (
        <div className="px-4 pb-2">
          <ErrorBanner error={chat.send.error} />
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MAX_LENGTH}
          disabled={user === null}
          placeholder={user ? '메시지를 입력하세요' : '로그인하면 채팅할 수 있어요'}
          aria-label="채팅 메시지"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim() || chat.send.isPending}
          className="press shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {chat.send.isPending ? '보내는 중' : '보내기'}
        </button>
      </div>
    </section>
  )
}
