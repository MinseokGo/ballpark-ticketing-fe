/** 로그인 토큰을 이 브라우저에 보관한다. 저장소를 못 쓰면 이번 탭 안에서만 유지된다. */
const STORAGE_KEY = 'ballpark-booking.token'

let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setToken(token: string | null) {
  memoryToken = token
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장소를 못 쓰면 메모리에만 둔다
  }
}
