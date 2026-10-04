import { STADIUM_PALETTE } from '../lib/stadiumPalette'

const SIZE = 320
const CENTER = SIZE / 2
const INNER_R = 50
const OUTER_R = 140

// 필드(그린)는 정중앙이 아니라 살짝 아래(홈플레이트 쪽)로 치우친 타원이다 —
// 외야 쪽은 깊게, 홈플레이트 뒤는 얕게 만들어서 실제 경기장 윤곽에 가깝게 한다.
const FIELD_CENTER_Y = CENTER + 30
const FIELD_RX = 70
const FIELD_RY = 95

function polarToCartesian(r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) }
}

function sectorPath(startAngle: number, endAngle: number, innerR: number, outerR: number) {
  const outerStart = polarToCartesian(outerR, startAngle)
  const outerEnd = polarToCartesian(outerR, endAngle)
  const innerEnd = polarToCartesian(innerR, endAngle)
  const innerStart = polarToCartesian(innerR, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export type StadiumBlock = { label: string; available: number; total: number }
export type StadiumSectionData = { sectionId: number; name: string; blocks: StadiumBlock[] }

/**
 * 경기장을 위에서 내려다본 모양으로 구역을 보여준다. 구역마다 블록(실제 경기장의 104, 105...
 * 같은 단위)으로 더 쪼개서 보여주고, 블록/구역을 탭하면 그 구역의 좌석을 고를 수 있다.
 */
export function StadiumMap({
  sections,
  selectedSectionId,
  onSelect,
}: {
  sections: StadiumSectionData[]
  selectedSectionId: number | null
  onSelect: (sectionId: number) => void
}) {
  const sliceAngle = 360 / Math.max(sections.length, 1)

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm">
      {sections.map((section, sectionIndex) => {
        const sectionStart = sectionIndex * sliceAngle
        const blockAngle = sliceAngle / Math.max(section.blocks.length, 1)
        const color = STADIUM_PALETTE[sectionIndex % STADIUM_PALETTE.length]
        const selected = section.sectionId === selectedSectionId

        return (
          <g key={section.sectionId} onClick={() => onSelect(section.sectionId)} className="cursor-pointer">
            {section.blocks.map((block, blockIndex) => {
              const startAngle = sectionStart + blockIndex * blockAngle
              const endAngle = startAngle + blockAngle
              const midAngle = (startAngle + endAngle) / 2
              const labelPos = polarToCartesian(INNER_R + (OUTER_R - INNER_R) / 2, midAngle)
              const ratio = block.total === 0 ? 0 : block.available / block.total
              const soldOut = block.available === 0

              return (
                <g key={block.label}>
                  <path
                    d={sectorPath(startAngle, endAngle, INNER_R, OUTER_R)}
                    fill={color}
                    fillOpacity={soldOut ? 0.12 : selected ? 0.55 + ratio * 0.45 : 0.25 + ratio * 0.4}
                    strokeWidth={selected ? 2.5 : 1}
                    className={selected ? 'stroke-white dark:stroke-slate-950' : 'stroke-slate-50 dark:stroke-slate-900'}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none text-[9px] font-bold"
                    fill={soldOut ? '#94A3B8' : '#fff'}
                  >
                    {blockIndex + 1}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {/* 외야까지 이어지는 필드. 중심에서 살짝 아래로 치우쳐서 홈플레이트 쪽은 얕고 외야 쪽은 깊다. */}
      <ellipse cx={CENTER} cy={FIELD_CENTER_Y} rx={FIELD_RX} ry={FIELD_RY} fill="#4ADE80" />
      <rect
        x={CENTER - 20}
        y={FIELD_CENTER_Y + 35}
        width={40}
        height={40}
        fill="#D2B48C"
        transform={`rotate(45 ${CENTER} ${FIELD_CENTER_Y + 55})`}
        rx={3}
      />
      <circle cx={CENTER} cy={FIELD_CENTER_Y + 75} r={4} fill="#fff" />
    </svg>
  )
}
