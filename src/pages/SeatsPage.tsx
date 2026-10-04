import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createSeatsInBulk } from '../api/admin'
import { ApiError } from '../api/client'
import { ErrorBanner, SuccessBanner } from '../components/Banner'
import { SeatGridPreview } from '../components/SeatGridPreview'
import { SECTIONS_REGISTRY_KEY } from '../constants'
import { useLocalRegistry } from '../hooks/useLocalRegistry'
import type { SectionResponse } from '../api/types'

export function SeatsPage() {
  const [sectionId, setSectionId] = useState('')
  const [rowCount, setRowCount] = useState('10')
  const [seatsPerRow, setSeatsPerRow] = useState('20')
  const { items: sections } = useLocalRegistry<SectionResponse>(SECTIONS_REGISTRY_KEY)

  const mutation = useMutation({
    mutationFn: () =>
      createSeatsInBulk(Number(sectionId), {
        rowCount: Number(rowCount),
        seatsPerRow: Number(seatsPerRow),
      }),
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">좌석 일괄 등록</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          POST /api/admin/sections/&#123;sectionId&#125;/seats
        </p>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            구역 ID
            <input
              required
              type="number"
              min={1}
              list="known-sections"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              placeholder="1"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <datalist id="known-sections">
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </datalist>
          </label>
          <label className="block text-sm">
            행 수 (rowCount)
            <input
              required
              type="number"
              min={1}
              max={1000}
              value={rowCount}
              onChange={(event) => setRowCount(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-sm">
            행당 좌석 수 (seatsPerRow)
            <input
              required
              type="number"
              min={1}
              max={1000}
              value={seatsPerRow}
              onChange={(event) => setSeatsPerRow(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>
        {sections.length === 0 && (
          <p className="text-xs text-slate-500">
            아직 이 브라우저에서 등록한 구역이 없다. 구역 등록 화면에서 먼저 만들거나, 이미 아는
            구역 ID를 직접 입력한다.
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? '등록 중...' : '좌석 일괄 등록'}
        </button>
      </form>

      {mutation.isError && <ErrorBanner error={mutation.error as ApiError} />}
      {mutation.isSuccess && (
        <div className="space-y-4">
          <SuccessBanner>
            구역 #{mutation.data.sectionId}에 좌석 {mutation.data.createdCount.toLocaleString()}개를
            만들었다.
          </SuccessBanner>
          <SeatGridPreview rowCount={Number(rowCount)} seatsPerRow={Number(seatsPerRow)} />
        </div>
      )}
    </div>
  )
}
