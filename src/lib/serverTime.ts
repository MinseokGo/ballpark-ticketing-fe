/**
 * 서버 시각은 offset 없는 한국 현지 시각(LocalDateTime)이다(백엔드 ISSUE-06). 기기 시간대와 상관없이
 * 한국 시각으로 읽고 보여주려고 이 파일에 모은다. 이미 offset이 있는 값(updatedAt 등 ISO 문자열)은 그대로 쓴다.
 */
const KST = 'Asia/Seoul'

export function parseServerTime(value: string): Date {
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasOffset ? value : `${value}+09:00`)
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseServerTime(value) : value
}

/** 한국 시각 기준으로 날짜·시각을 포맷한다. */
export function formatKst(value: string | Date, options: Intl.DateTimeFormatOptions): string {
  return toDate(value).toLocaleString('ko-KR', { ...options, timeZone: KST })
}

/** 한국 날짜의 yyyy-mm-dd. 같은 날 비교와 날짜 차이 계산에 쓴다. */
export function kstDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(toDate(value))
}

/** 한국 기준 일(day) 숫자. */
export function kstDay(value: string | Date): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: KST, day: 'numeric' }).format(toDate(value)))
}
