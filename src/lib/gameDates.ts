import { formatKst, kstDateKey } from './serverTime'

export function greeting(hour: number) {
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '오늘 야구 보러 갈까요?'
  return '오늘 저녁 경기 어때요?'
}

export function sameDay(a: Date, b: Date) {
  return kstDateKey(a) === kstDateKey(b)
}

/** 0 = 오늘, 1 = 내일 … 지난 날짜는 음수. 달력 날짜 기준으로 센다(시각 무시). */

export function dayDiff(iso: string, now: Date) {
  const toUtc = (key: string) => Date.parse(`${key}T00:00:00Z`)
  return Math.round((toUtc(kstDateKey(iso)) - toUtc(kstDateKey(now))) / 86_400_000)
}

export function timeLabel(iso: string) {
  return formatKst(iso, { hour: 'numeric', minute: '2-digit' })
}

export function dateLabel(iso: string) {
  return formatKst(iso, { month: 'long', day: 'numeric', weekday: 'short' })
}

/** 가장 가까운 예정 경기를 크게 보여준다. 두 팀 색으로 배경을 채우고 D-day와 상태를 올린다. */
