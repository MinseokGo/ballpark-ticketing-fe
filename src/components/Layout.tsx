import { NavLink, Outlet, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/booking', label: '예매', icon: '🎟️' },
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

export function Layout() {
  const { pathname, key } = useLocation()
  // 좌석 지도 화면은 하단에 예매·결제 바가 떠 있어서 탭 바와 겹치지 않게 숨긴다.
  const onSeatMap = /^\/booking\/\d+/.test(pathname)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="press flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
            <span className="inline-block transition-transform duration-500 hover:rotate-45">⚾</span>
            <span>야구장</span>
          </NavLink>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName} end>
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin"
              className="press ml-1 rounded-full px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              관리자
            </NavLink>
          </nav>
        </div>
      </header>

      <main className={`mx-auto max-w-3xl px-4 py-8 ${onSeatMap ? '' : 'pb-24 sm:pb-8'}`}>
        {/* key를 경로로 주면 화면이 바뀔 때마다 등장 모션이 다시 돈다. */}
        <div key={key} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      {!onSeatMap && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/90 backdrop-blur-md sm:hidden dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-3xl">
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
