import { useState } from 'react'

const STORAGE_KEY = 'ballpark-booking.userId'

/**
 * v1은 인증이 없고 X-User-Id 헤더로만 사용자를 식별한다(백엔드 CLAUDE.md 참고).
 * 데모에서 "나는 몇 번 사용자다"를 바꿔볼 수 있게 localStorage에 적어 둔다.
 */
export function useUserId(): [number, (id: number) => void] {
  const [userId, setUserIdState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? Number(raw) : 1
    } catch {
      return 1
    }
  })

  const setUserId = (id: number) => {
    setUserIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // 프라이빗 모드 등 localStorage를 쓸 수 없어도 세션 내 상태는 유지한다
    }
  }

  return [userId, setUserId]
}
