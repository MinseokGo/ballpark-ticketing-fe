import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme, type ThemeChoice } from '../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/booking', label: '예매', icon: '🎟️' },
  { to: '/standings', label: '순위', icon: '📊' },
  { to: '/profile', label: '마이페이지', icon: '🙋' },
]

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'press rounded-full px-4 py-2 text-sm font-semibold',
    isActive
      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  ].join(' ')
}

function tabClassName({ isActive }: { isActive: boolean }) {
  return [
    'press flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold',
    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500',
  ].join(' ')
}

const THEME_LABEL: Record<ThemeChoice, string> = {
  system: '시스템 설정',
  light: '라이트',
  dark: '다크',
}

const THEME_ICON: Record<ThemeChoice, string> = {
  system: '🖥️',
  light: '☀️',
  dark: '🌙',
}

export function Layout() {
  const { pathname, key } = useLocation()
  const { theme, cycle } = useTheme()
  // 좌석 지도 화면은 하단에 예매·결제 바가 떠 있어서 탭 바와 겹치지 않게 숨긴다.
  const onSeatMap = /^\/booking\/\d+/.test(pathname)
  // 모든 화면은 화면 폭을 다 쓴다. 화면 안에서 그리드로 나눠 배치한다.
  const contentClass = 'w-full px-4 py-6 pb-24 sm:px-6 sm:pb-8 lg:px-10'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
        <div className="flex w-full items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-10">
          <NavLink to="/" className="press flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
            <span className="inline-block transition-transform duration-500 hover:rotate-45">⚾</span>
            <span>야구장</span>
          </NavLink>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClassName} end>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <AuthControl />
            <button
              type="button"
              onClick={cycle}
              aria-label={`테마: ${THEME_LABEL[theme]} (눌러서 바꾸기)`}
              title={`테마: ${THEME_LABEL[theme]}`}
              className="press flex size-9 items-center justify-center rounded-full text-base hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span aria-hidden>{THEME_ICON[theme]}</span>
            </button>
          </div>
        </div>
      </header>

      <main className={contentClass}>
        {/* key를 경로로 주면 화면이 바뀔 때마다 등장 모션이 다시 돈다. */}
        <div key={key} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      {!onSeatMap && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/90 backdrop-blur-md sm:hidden dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex w-full">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={tabClassName} end>
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

/** 헤더의 로그인 상태: 로그인 전에는 로그인 버튼, 후에는 닉네임과 로그아웃. */
function AuthControl() {
  const { user, logout } = useAuth()
  if (!user) {
    return (
      <NavLink
        to="/login"
        className="press ml-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900"
      >
        로그인
      </NavLink>
    )
  }
  return (
    <div className="ml-1 flex items-center gap-2">
      <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-slate-600 sm:inline dark:text-slate-300">
        {user.nickname}
      </span>
      <button
        type="button"
        onClick={logout}
        className="press rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
      >
        로그아웃
      </button>
    </div>
  )
}
