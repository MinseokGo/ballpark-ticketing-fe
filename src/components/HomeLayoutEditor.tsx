import { useState } from 'react'
import { COLUMNS, MAX_SPAN, type HomeWidgetId, type PlacedWidget } from '../lib/homeGrid'

// 홈 격자와 같은 비율로 줄인 칸 크기: 한 칸 96px·간격 24px을 0.6배 한 값
const CELL_H = 58
const GAP = 14
const SIZES = Array.from({ length: MAX_SPAN }, (_, index) => index + 1)

/**
 * 홈 위젯 편집 팝업. 위쪽 모눈종이에서 위젯을 끌어 순서를 바꾸고(맨 아래로 끌면 맨 뒤로),
 * 아래 크기 패널에서 각 위젯의 가로·세로 칸 수를 드롭다운으로 고른다.
 * 위젯이 아래로 내려가면 모눈종이도 같이 늘어난다.
 */
export function HomeLayoutEditor({
  placed,
  labels,
  onSetSize,
  onMove,
  onMoveToEnd,
  onReset,
  onClose,
}: {
  placed: PlacedWidget[]
  labels: Record<HomeWidgetId, string>
  onSetSize: (id: HomeWidgetId, w: number, h: number) => void
  onMove: (from: HomeWidgetId, to: HomeWidgetId) => void
  onMoveToEnd: (from: HomeWidgetId) => void
  onReset: () => void
  onClose: () => void
}) {
  const [dragId, setDragId] = useState<HomeWidgetId | null>(null)
  const [overId, setOverId] = useState<HomeWidgetId | null>(null)
  const [overEnd, setOverEnd] = useState(false)
  // 맨 아래 빈 줄: 드래그 중이면 아래로 한 줄 더 늘려서 끌어 놓을 자리를 준다.
  const usedRows = Math.max(0, ...placed.map((item) => item.row + item.h))
  const rows = Math.max(6, usedRows + (dragId ? 3 : 1))
  const cell = 100 / COLUMNS

  const endDrag = () => {
    setDragId(null)
    setOverId(null)
    setOverEnd(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="홈 레이아웃 편집"
        onClick={(event) => event.stopPropagation()}
        className="animate-pop my-auto w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">홈 레이아웃</p>
            <h2 className="text-xl font-extrabold">위젯 옮기기 · 크기 정하기</h2>
            <p className="mt-1 text-xs text-slate-500">
              위젯 어디든 끌어서 옮깁니다. 맨 아래 빈 줄에 놓으면 맨 뒤로 갑니다. 크기는 아래 패널에서 고르세요.
            </p>
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

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
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
                draggable
                onDragStart={(event) => {
                  setDragId(item.id)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', item.id)
                }}
                onDragEnd={endDrag}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (dragId && dragId !== item.id) setOverId(item.id)
                }}
                onDragLeave={() => setOverId((current) => (current === item.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  if (dragId) onMove(dragId, item.id)
                  endDrag()
                }}
                className={[
                  'absolute flex cursor-grab flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-[box-shadow,opacity] active:cursor-grabbing dark:bg-slate-800',
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
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <span className="truncate">⠿ {labels[item.id]}</span>
                  <span className="tabular shrink-0 font-semibold text-slate-400">
                    {item.w}×{item.h}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setOverEnd(true)
            }}
            onDragLeave={() => setOverEnd(false)}
            onDrop={(event) => {
              event.preventDefault()
              if (dragId) onMoveToEnd(dragId)
              endDrag()
            }}
            className={[
              'mt-2 flex items-center justify-center rounded-xl border-2 border-dashed text-[11px] font-semibold transition-colors',
              overEnd ? 'border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-950' : 'border-slate-200 text-slate-400 dark:border-slate-700',
            ].join(' ')}
            style={{ height: CELL_H }}
          >
            {dragId ? '여기에 놓으면 맨 뒤로 이동' : '위젯을 끌면 여기가 열립니다'}
          </div>
        </div>

        <section className="mt-5">
          <p className="mb-2 text-sm font-bold">위젯 크기</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {placed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="truncate text-sm font-semibold">{labels[item.id]}</span>
                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                  <SizeSelect label="가로" value={item.w} onChange={(value) => onSetSize(item.id, value, item.h)} />
                  <SizeSelect label="세로" value={item.h} onChange={(value) => onSetSize(item.id, item.w, value)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
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

function SizeSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex items-center gap-1">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        {SIZES.map((size) => (
          <option key={size} value={size}>
            {size}칸
          </option>
        ))}
      </select>
    </label>
  )
}
