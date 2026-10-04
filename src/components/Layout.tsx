import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '대시보드' },
  { to: '/sections', label: '구역 등록' },
  { to: '/seats', label: '좌석 일괄 등록' },
  { to: '/games', label: '경기 등록' },
]

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
  ].join(' ')
}

export function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <span className="mr-4 text-lg font-bold">⚾ Ballpark Admin</span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName} end>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
