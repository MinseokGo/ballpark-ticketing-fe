import type { ReactNode } from 'react'

/**
 * 고정 높이 안에서만 스크롤되는 영역. 홈의 목록 섹션들이 화면을 길게 늘리지 않도록 높이를 정해 둔다.
 * 화면이 작으면 높이도 같이 줄어든다(70svh 상한).
 */
export function ScrollBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`h-[min(440px,60svh)] overflow-y-auto overscroll-contain pr-1 ${className}`}>{children}</div>
  )
}
