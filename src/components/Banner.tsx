import type { ReactNode } from 'react'
import type { ApiError } from '../api/client'

export function ErrorBanner({ error }: { error: ApiError }) {
  const { problem } = error
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <p className="font-semibold">{problem.detail ?? '요청을 처리하지 못했어요. 다시 시도해 주세요.'}</p>
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
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
      {children}
    </div>
  )
}
