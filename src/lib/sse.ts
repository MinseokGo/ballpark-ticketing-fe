/**
 * SSE 응답을 fetch로 읽는다. EventSource는 닫힌 연결을 무조건 다시 붙어서, 끝난 경기에서 재연결이 반복된다.
 * fetch로 읽으면 끝을 직접 판단하고 Last-Event-ID도 직접 붙일 수 있다.
 */
export type SseFrame = {
  id?: string
  event?: string
  data: string
}

function parseBlock(block: string): SseFrame | null {
  let id: string | undefined
  let event: string | undefined
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line === '' || line.startsWith(':')) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const field = line.slice(0, colon)
    const value = line.slice(colon + 1).replace(/^ /, '')
    if (field === 'id') id = value
    else if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  if (data.length === 0) return null
  return { id, event, data: data.join('\n') }
}

/** 스트림이 끝날 때까지 프레임을 넘긴다. 서버가 닫으면 정상 종료, 실패하면 예외. */
export async function streamSse(
  url: string,
  options: { signal: AbortSignal; lastEventId?: number; onFrame: (frame: SseFrame) => void },
): Promise<void> {
  const headers: Record<string, string> = { Accept: 'text/event-stream' }
  if (options.lastEventId !== undefined) headers['Last-Event-ID'] = String(options.lastEventId)

  const response = await fetch(url, { headers, signal: options.signal })
  if (!response.ok || !response.body) {
    throw new Error(`스트림 연결 실패 (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    let end = buffer.indexOf('\n\n')
    while (end >= 0) {
      const frame = parseBlock(buffer.slice(0, end))
      buffer = buffer.slice(end + 2)
      if (frame) options.onFrame(frame)
      end = buffer.indexOf('\n\n')
    }
  }
}
