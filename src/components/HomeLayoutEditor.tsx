import { useState } from 'react'
import { COLUMNS, MAX_SPAN, type HomeWidgetId, type PlacedWidget } from '../lib/homeGrid'

// 홈 격자와 같은 비율로 줄인 칸 크기: 한 칸 96px·간격 24px을 0.6배 한 값
const CELL_H = 58
const GAP = 14

/**
 * 홈 위젯 편집 팝업. 모눈종이 위에 실제 홈과 같은 배치로 위젯을 보여준다.
 * 위젯을 끌어서 순서를 바꾸고, 드롭다운으로 가로·세로 칸 수(1~5)를 고른다.
 */
export function HomeLayoutEditor({
  placed,
  labels,
  onSetSize,
  onMove,
  onReset,
  onClose,
}: {
  placed: PlacedWidget[]
  labels: Record<HomeWidgetId, string>
  onSetSize: (id: HomeWidgetId, w: number, h: number) => void
  onMove: (from: HomeWidgetId, to: HomeWidgetId) => void
  onReset: () => void
  onClose: () => void
}) {
  const [dragId, setDragId] = useState<HomeWidgetId | null>(null)
  const [overId, setOverId] = useState<HomeWidgetId | null>(null)
  const rows = Math.max(6, ...placed.map((item) => item.row + item.h + 1))
  const sizes = Array.from({ length: MAX_SPAN }, (_, index) => index + 1)
  const cell = 100 / COLUMNS

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="홈 레이아웃 편집"
        onClick={(event) => event.stopPropagation()}
        className="animate-pop max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">홈 레이아웃</p>
            <h2 className="text-xl font-extrabold">위젯 옮기기 · 크기 정하기</h2>
            <p className="mt-1 text-xs text-slate-500">위젯 상단을 끌어서 옮기고, 드롭다운에서 가로·세로 칸 수를 고르세요. 가로·세로 최대 5칸입니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="press flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
          <div
            className="relative w-full"
            style={{
              height: rows * CELL_H,
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)',
              backgroundSize: `${cell}% ${CELL_H}px`,
            }}
          >
            {placed.map((item) => (
              <div
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (dragId && dragId !== item.id) setOverId(item.id)
                }}
                onDragLeave={() => setOverId((current) => (current === item.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  if (dragId) onMove(dragId, item.id)
                  setDragId(null)
                  setOverId(null)
                }}
                className={[
                  'absolute flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-[box-shadow,opacity] dark:bg-slate-800',
                  overId === item.id ? 'border-blue-400 ring-2 ring-blue-400' : 'border-slate-300 dark:border-slate-600',
                  dragId === item.id ? 'opacity-50' : '',
                ].join(' ')}
                style={{
                  left: `calc(${item.col * cell}% + ${GAP / 2}px)`,
                  top: item.row * CELL_H + GAP / 2,
                  width: `calc(${item.w * cell}% - ${GAP}px)`,
                  height: item.h * CELL_H - GAP,
                }}
              >
                <div
                  draggable
                  onDragStart={(event) => {
                    setDragId(item.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', item.id)
                  }}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverId(null)
                  }}
                  className="flex shrink-0 cursor-grab items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  <span className="truncate">⠿ {labels[item.id]}</span>
                </div>
                <div className="flex min-h-0 flex-1 items-center gap-2 px-2.5 text-[11px] text-slate-500">
                  <SizeSelect
                    label="가로"
                    value={item.w}
                    options={sizes}
                    onChange={(value) => onSetSize(item.id, value, item.h)}
                  />
                  <SizeSelect
                    label="세로"
                    value={item.h}
                    options={sizes}
                    onChange={(value) => onSetSize(item.id, item.w, value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="press rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300"
          >
            기본 배치로
          </button>
          <button
            type="button"
            onClick={onClose}
            className="press rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}

function SizeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: number[]
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-1">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}칸
          </option>
        ))}
      </select>
    </label>
  )
}
