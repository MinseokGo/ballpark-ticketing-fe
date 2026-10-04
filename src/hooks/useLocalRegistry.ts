import { useCallback, useState } from 'react'

/**
 * 백엔드에 아직 조회(GET) API가 없어서(3단계 예정), 이 세션에서 만든 구역·경기를
 * localStorage에 간단히 적어 두고 다른 화면(좌석 등록 등)에서 고르는 용도로만 쓴다.
 * 실제 데이터 소스가 아니라 단순 메모이므로 서버 상태와 어긋날 수 있다.
 */
export function useLocalRegistry<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T[]) : []
    } catch {
      return []
    }
  })

  const add = useCallback(
    (item: T) => {
      setItems((prev) => {
        const next = [item, ...prev]
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // 프라이빗 모드 등 localStorage를 쓸 수 없어도 세션 내 상태는 유지한다
        }
        return next
      })
    },
    [key],
  )

  return { items, add }
}
