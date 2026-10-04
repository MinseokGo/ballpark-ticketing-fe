const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#06B6D4', '#EC4899', '#F43F5E', '#84CC16']

const SIZE = 320
const CENTER = SIZE / 2
const INNER_R = 58
const OUTER_R = 140

function polarToCartesian(r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) }
}

function sectorPath(startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(OUTER_R, startAngle)
  const outerEnd = polarToCartesian(OUTER_R, endAngle)
  const innerEnd = polarToCartesian(INNER_R, endAngle)
  const innerStart = polarToCartesian(INNER_R, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export type StadiumSection = {
  sectionId: number
  name: string
  availableSeats: number
  totalSeats: number
}

/** 경기장을 위에서 내려다본 돔 모양으로 구역을 보여준다. 구역을 탭하면 그 구역의 좌석을 고를 수 있다. */
export function StadiumMap({
  sections,
  selectedSectionId,
  onSelect,
}: {
  sections: StadiumSection[]
  selectedSectionId: number | null
  onSelect: (sectionId: number) => void
}) {
  const sliceAngle = 360 / Math.max(sections.length, 1)

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm">
      {sections.map((section, index) => {
        const startAngle = index * sliceAngle
        const endAngle = startAngle + sliceAngle
        const midAngle = (startAngle + endAngle) / 2
        const labelPos = polarToCartesian(INNER_R + (OUTER_R - INNER_R) / 2, midAngle)
        const ratio = section.totalSeats === 0 ? 0 : section.availableSeats / section.totalSeats
        const selected = section.sectionId === selectedSectionId
        const soldOut = section.availableSeats === 0

        return (
          <g
            key={section.sectionId}
            onClick={() => !soldOut && onSelect(section.sectionId)}
            className={soldOut ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <path
              d={sectorPath(startAngle, endAngle)}
              fill={PALETTE[index % PALETTE.length]}
              fillOpacity={soldOut ? 0.15 : selected ? 1 : 0.35 + ratio * 0.5}
              strokeWidth={3}
              className="stroke-slate-50 transition-all dark:stroke-slate-900"
            />
            <text
              x={labelPos.x}
              y={labelPos.y - 6}
              textAnchor="middle"
              className="pointer-events-none select-none text-[11px] font-bold"
              fill={selected || ratio > 0.4 ? '#fff' : '#334155'}
            >
              {section.name}
            </text>
            <text
              x={labelPos.x}
              y={labelPos.y + 9}
              textAnchor="middle"
              className="pointer-events-none select-none text-[9px] font-medium tabular"
              fill={selected || ratio > 0.4 ? '#fff' : '#334155'}
            >
              {soldOut ? '매진' : `${section.availableSeats}석 남음`}
            </text>
          </g>
        )
      })}

      {/* 중앙 필드 */}
      <circle cx={CENTER} cy={CENTER} r={INNER_R - 6} fill="#4ADE80" />
      <rect
        x={CENTER - 26}
        y={CENTER - 26}
        width={52}
        height={52}
        fill="#D2B48C"
        transform={`rotate(45 ${CENTER} ${CENTER})`}
        rx={4}
      />
      <text x={CENTER} y={CENTER + 6} textAnchor="middle" className="select-none text-xl">
        ⚾
      </text>
    </svg>
  )
}
