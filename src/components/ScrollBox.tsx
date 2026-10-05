import type { ReactNode } from 'react'

/**
 * 위젯 안에서 스크롤되는 영역. 위젯 높이를 따라 늘어나고, 화면이 좁으면 최대 높이로 제한한다.
 */
export function ScrollBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-0 flex-1 max-h-[60svh] overflow-y-auto overscroll-contain pr-1 lg:max-h-none ${className}`}>
      {children}
    </div>
  )
}
