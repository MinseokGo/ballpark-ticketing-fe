import type { ReactNode } from 'react'
import type { ApiError } from '../api/client'

export function ErrorBanner({ error }: { error: ApiError }) {
  const { problem } = error
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <p className="font-semibold">
        {problem.code ? `${problem.code} · ` : ''}
        {problem.title ?? '요청 실패'}
      </p>
      {problem.detail && <p className="mt-1">{problem.detail}</p>}
      {problem.errors && problem.errors.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {problem.errors.map((fieldError) => (
            <li key={fieldError.field}>
              <span className="font-medium">{fieldError.field}</span>: {fieldError.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
      {children}
    </div>
  )
}
