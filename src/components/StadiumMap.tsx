import {
  FAMILY_ANGLES,
  FAMILY_COLOR,
  TIER_ORDER,
  isOutfieldFamily,
  parseSectionName,
} from '../lib/stadiumLayout'
import { STADIUM_PALETTE } from '../lib/stadiumPalette'

// 원이 아니라 위아래로 긴 타원으로 그린다 — 홈플레이트~외야 방향이 더 길어 실제 구장 돔에 가깝다.
const SIZE_X = 320
const SIZE_Y = 400
const CENTER_X = SIZE_X / 2
const CENTER_Y = 200
const VERTICAL_SCALE = 1.3

// 파울 구역(중앙석·필드석)은 안쪽부터, 페어 구역(외야석)은 외야 벽 너머부터 좌석이 시작한다.
const INFIELD_R = 40
const WALL_R = 72
const OUTER_R = 130

function polarToCartesian(r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER_X + r * Math.sin(rad), y: CENTER_Y - r * Math.cos(rad) * VERTICAL_SCALE }
}

function sectorPath(startAngle: number, endAngle: number, innerR: number, outerR: number) {
  const outerStart = polarToCartesian(outerR, startAngle)
  const outerEnd = polarToCartesian(outerR, endAngle)
  const innerEnd = polarToCartesian(innerR, endAngle)
  const innerStart = polarToCartesian(innerR, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR * VERTICAL_SCALE} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR * VERTICAL_SCALE} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export type StadiumSectionInput = { sectionId: number; name: string; availableSeats: number; totalSeats: number }

function Field() {
  return (
    <>
      <path d={sectorPath(-45, 45, INFIELD_R, WALL_R)} fill="#4ADE80" />
      <circle cx={CENTER_X} cy={CENTER_Y} r={INFIELD_R} fill="#86EFAC" />
      <rect
        x={CENTER_X - 18}
        y={CENTER_Y + 10}
        width={36}
        height={36}
        fill="#D2B48C"
        rx={3}
        transform={`rotate(45 ${CENTER_X} ${CENTER_Y + 28})`}
      />
      <circle cx={CENTER_X} cy={CENTER_Y + 28} r={3.5} fill="#fff" />
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
    <svg viewBox={`0 0 ${SIZE_X} ${SIZE_Y}`} className="mx-auto w-full max-w-xs">
      <defs>
        {/* 필드 쪽에서 빛이 퍼지는 느낌을 주는 은은한 하이라이트 — 평평한 조각보다 자연스럽게 보이게 한다. */}
        <radialGradient id="stadium-shine" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {allRecognized
        ? parsed.map(({ section, parsed: info }) => {
            const { family, tier } = info!
            const [familyStart, familyEnd] = FAMILY_ANGLES[family]
            const innerBound = isOutfieldFamily(family) ? WALL_R : INFIELD_R
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

      <ellipse
        cx={CENTER_X}
        cy={CENTER_Y}
        rx={OUTER_R}
        ry={OUTER_R * VERTICAL_SCALE}
        fill="url(#stadium-shine)"
        className="pointer-events-none"
      />
      <Field />
    </svg>
  )
}
