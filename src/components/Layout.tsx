import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/booking', label: '예매' },
  { to: '/profile', label: '마이페이지' },
]

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  ].join(' ')
}

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
            <span>⚾</span>
            <span>야구장</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName} end>
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin"
              className="ml-1 rounded-full px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              관리자
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
