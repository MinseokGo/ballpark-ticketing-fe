import { STADIUM_PALETTE } from '../lib/stadiumPalette'

const SIZE = 320
const CENTER = SIZE / 2

// 파울 구역(중앙석·필드석)은 안쪽부터, 페어 구역(외야석)은 외야 벽 너머부터 좌석이 시작한다.
const INFIELD_R = 45
const WALL_R = 80
const OUTER_R = 145

type Tier = 'A' | 'B' | 'C'

type Family = '중앙석' | '1루 필드석' | '1루 외야석' | '3루 필드석' | '3루 외야석'

// 0도 = 외야 정면(타자 배경판 방향), 시계방향. 180도 = 홈플레이트 뒤.
// 가운데 90도(-45~45)는 페어 구역(필드+외야석), 나머지 270도는 파울 구역(중앙석+필드석).
const FAMILY_ANGLES: Record<Family, [number, number]> = {
  '1루 외야석': [0, 45],
  '1루 필드석': [45, 135],
  중앙석: [135, 225],
  '3루 필드석': [225, 315],
  '3루 외야석': [315, 360],
}

const FAMILY_COLOR: Record<Family, string> = {
  중앙석: STADIUM_PALETTE[0]!,
  '1루 필드석': STADIUM_PALETTE[1]!,
  '1루 외야석': STADIUM_PALETTE[2]!,
  '3루 필드석': STADIUM_PALETTE[3]!,
  '3루 외야석': STADIUM_PALETTE[4]!,
}

const TIER_ORDER: Tier[] = ['A', 'B', 'C']

function parseSectionName(name: string): { family: Family; tier: Tier } | null {
  const match = /^(중앙석|1루 필드석|1루 외야석|3루 필드석|3루 외야석)\s*([ABC])$/.exec(name.trim())
  if (!match) {
    return null
  }
  return { family: match[1] as Family, tier: match[2] as Tier }
}

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

export type StadiumSectionInput = { sectionId: number; name: string; availableSeats: number; totalSeats: number }

function Field() {
  return (
    <>
      <path d={sectorPath(-45, 45, INFIELD_R, WALL_R)} fill="#4ADE80" />
      <circle cx={CENTER} cy={CENTER} r={INFIELD_R} fill="#86EFAC" />
      <rect
        x={CENTER - 18}
        y={CENTER + 10}
        width={36}
        height={36}
        fill="#D2B48C"
        rx={3}
        transform={`rotate(45 ${CENTER} ${CENTER + 28})`}
      />
      <circle cx={CENTER} cy={CENTER + 28} r={3.5} fill="#fff" />
    </>
  )
}

function Wedge({
  section,
  startAngle,
  endAngle,
  innerR,
  outerR,
  color,
  label,
  selected,
  onSelect,
}: {
  section: StadiumSectionInput
  startAngle: number
  endAngle: number
  innerR: number
  outerR: number
  color: string
  label: string
  selected: boolean
  onSelect: (sectionId: number) => void
}) {
  const midAngle = (startAngle + endAngle) / 2
  const labelPos = polarToCartesian(innerR + (outerR - innerR) / 2, midAngle)
  const ratio = section.totalSeats === 0 ? 0 : section.availableSeats / section.totalSeats
  const soldOut = section.availableSeats === 0

  return (
    <g onClick={() => onSelect(section.sectionId)} className="cursor-pointer">
      <path
        d={sectorPath(startAngle, endAngle, innerR, outerR)}
        fill={color}
        fillOpacity={soldOut ? 0.12 : selected ? 0.6 + ratio * 0.4 : 0.25 + ratio * 0.45}
        strokeWidth={selected ? 2.5 : 1}
        className={selected ? 'stroke-white dark:stroke-slate-950' : 'stroke-slate-50 dark:stroke-slate-900'}
      />
      <text
        x={labelPos.x}
        y={labelPos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none select-none text-[10px] font-bold"
        fill={soldOut ? '#94A3B8' : '#fff'}
      >
        {label}
      </text>
    </g>
  )
}

/**
 * 경기장을 위에서 내려다본 돔 모양으로 구역을 보여준다. 구역 이름이 "중앙석 A" 같은 5개 구역
 * (중앙석 / 1루·3루 필드석 / 1루·3루 외야석) x A~C 체계를 따르면, 실제 자리처럼 중앙석·필드석은
 * 홈 플레이트 뒤 파울 구역에, 외야석은 외야 벽 너머 페어 구역에 배치하고 A~C는 안쪽부터 바깥쪽
 * 동심원으로 그린다. 이 이름 체계를 따르지 않는 데이터가 섞여 있으면 원 둘레에 균등하게 나눠
 * 그리는 방식으로 되돌아간다(아직 예전 시드 데이터일 때 깨지지 않도록).
 */
export function StadiumMap({
  sections,
  selectedSectionId,
  onSelect,
}: {
  sections: StadiumSectionInput[]
  selectedSectionId: number | null
  onSelect: (sectionId: number) => void
}) {
  const parsed = sections.map((section) => ({ section, parsed: parseSectionName(section.name) }))
  const allRecognized = parsed.length > 0 && parsed.every((item) => item.parsed !== null)

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm">
      {allRecognized
        ? parsed.map(({ section, parsed: info }) => {
            const { family, tier } = info!
            const [familyStart, familyEnd] = FAMILY_ANGLES[family]
            const isOutfield = family === '1루 외야석' || family === '3루 외야석'
            const innerBound = isOutfield ? WALL_R : INFIELD_R
            const tierIndex = TIER_ORDER.indexOf(tier)
            const ringWidth = (OUTER_R - innerBound) / TIER_ORDER.length
            return (
              <Wedge
                key={section.sectionId}
                section={section}
                startAngle={familyStart}
                endAngle={familyEnd}
                innerR={innerBound + tierIndex * ringWidth}
                outerR={innerBound + (tierIndex + 1) * ringWidth}
                color={FAMILY_COLOR[family]}
                label={tier}
                selected={section.sectionId === selectedSectionId}
                onSelect={onSelect}
              />
            )
          })
        : sections.map((section, index) => {
            const sliceAngle = 360 / sections.length
            return (
              <Wedge
                key={section.sectionId}
                section={section}
                startAngle={index * sliceAngle}
                endAngle={(index + 1) * sliceAngle}
                innerR={INFIELD_R}
                outerR={OUTER_R}
                color={STADIUM_PALETTE[index % STADIUM_PALETTE.length]!}
                label={section.name.slice(0, 2)}
                selected={section.sectionId === selectedSectionId}
                onSelect={onSelect}
              />
            )
          })}

      <Field />
    </svg>
  )
}
