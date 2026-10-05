import { Link } from 'react-router-dom'

export function StatChip({ label, value, live = false }: { label: string; value: number; live?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
      {live && <span className="size-1.5 rounded-full bg-red-500" />}
      {label}
      <span className="tabular font-bold text-slate-900 dark:text-slate-50">{value}</span>
    </span>
  )
}

export function ActionPill({ to, emoji, label, primary = false }: { to: string; emoji: string; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={[
        'press flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5',
        primary
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700'
          : 'border border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700',
      ].join(' ')}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </Link>
  )
}
