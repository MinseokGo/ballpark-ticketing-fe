import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createSection } from '../api/admin'
import { ApiError } from '../api/client'
import { ErrorBanner, SuccessBanner } from '../components/Banner'
import { SECTIONS_REGISTRY_KEY } from '../constants'
import { useLocalRegistry } from '../hooks/useLocalRegistry'
import type { SectionResponse } from '../api/types'

export function SectionsPage() {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [price, setPrice] = useState('')
  const { items: sections, add: addSection } = useLocalRegistry<SectionResponse>(
    SECTIONS_REGISTRY_KEY,
  )

  const mutation = useMutation({
    mutationFn: () => createSection({ name, grade, price: Number(price) }),
    onSuccess: (section) => {
      addSection(section)
      setName('')
      setGrade('')
      setPrice('')
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">구역 등록</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          POST /api/admin/sections
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            이름
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Infield 101"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block text-sm">
            등급
            <input
              required
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="R"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block text-sm">
            가격(원)
            <input
              required
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="30000"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {mutation.isPending ? '등록 중...' : '구역 등록'}
        </button>
      </form>

      {mutation.isError && <ErrorBanner error={mutation.error as ApiError} />}
      {mutation.isSuccess && (
        <SuccessBanner>
          구역 #{mutation.data.id} &lsquo;{mutation.data.name}&rsquo;을 등록했다.
        </SuccessBanner>
      )}

      <div>
        <h2 className="font-semibold">이 브라우저에서 등록한 구역</h2>
        <p className="mb-2 text-xs text-neutral-500">
          서버 조회 API가 없어 이 목록은 localStorage 기록일 뿐이다. 좌석 등록 화면에서 구역을
          고를 때 쓴다.
        </p>
        {sections.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 등록한 구역이 없다.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 pr-4">ID</th>
                <th className="py-1 pr-4">이름</th>
                <th className="py-1 pr-4">등급</th>
                <th className="py-1 pr-4">가격</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-1 pr-4">{section.id}</td>
                  <td className="py-1 pr-4">{section.name}</td>
                  <td className="py-1 pr-4">{section.grade}</td>
                  <td className="py-1 pr-4">{section.price.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
