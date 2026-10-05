import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'ballpark-booking.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // 저장소를 못 쓰면 시스템 설정을 따른다
  }
  return 'system'
}

function applyChoice(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** 시스템 → 라이트 → 다크 순서로 순환한다. '시스템'일 때는 OS 설정이 바뀌면 바로 따라간다. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeChoice>(readChoice)

  useEffect(() => {
    applyChoice(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // 저장되지 않아도 이번 세션 안에서는 동작한다
    }
    if (theme !== 'system') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => applyChoice('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const cycle = useCallback(() => {
    setTheme((prev) => (prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'))
  }, [])

  return { theme, cycle }
}
