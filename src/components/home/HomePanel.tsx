import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: { to: string; label: string }
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`animate-fade-up flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
