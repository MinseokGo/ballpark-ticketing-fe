const MAX_PREVIEW_ROWS = 20
const MAX_PREVIEW_COLS = 30

/** rowCount x seatsPerRow 격자를 작은 사각형으로 그려 "방금 무엇을 만들었는지" 눈으로 보여준다. */
export function SeatGridPreview({
  rowCount,
  seatsPerRow,
}: {
  rowCount: number
  seatsPerRow: number
}) {
  const visibleRows = Math.min(rowCount, MAX_PREVIEW_ROWS)
  const visibleCols = Math.min(seatsPerRow, MAX_PREVIEW_COLS)
  const truncated = visibleRows < rowCount || visibleCols < seatsPerRow

  return (
    <div>
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${visibleCols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: visibleRows * visibleCols }).map((_, index) => (
          <div
            key={index}
            className="size-3 rounded-sm bg-sky-400 dark:bg-sky-500"
            title={`row ${Math.floor(index / visibleCols) + 1}, seat ${(index % visibleCols) + 1}`}
          />
        ))}
      </div>
      {truncated && (
        <p className="mt-2 text-xs text-slate-500">
          전체 {rowCount}행 x {seatsPerRow}열 중 {visibleRows}행 x {visibleCols}열만 미리보기로
          표시했다.
        </p>
      )}
    </div>
  )
}
