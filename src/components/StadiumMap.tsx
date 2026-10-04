import {
  FAMILY_ANGLES,
  FAMILY_COLOR,
  TIER_ORDER,
  isOutfieldFamily,
  parseSectionName,
} from '../lib/stadiumLayout'
import { STADIUM_PALETTE } from '../lib/stadiumPalette'
import type { SeatMapItemResponse } from '../api/types'

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

const SOLD_FILL = '#CBD5E1'
const SELECTED_FILL = '#10B981'

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

export type StadiumSectionSeats = { sectionId: number; name: string; items: SeatMapItemResponse[] }

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

/** 한 구역(예: "1루 외야석 B")의 좌석을 실제 자리 수만큼 쪼개서, 줄은 동심원으로, 좌석은 그 안에서 각도로 나눠 그린다. */
function SeatCells({
  section,
  familyStart,
  familyEnd,
  innerR,
  outerR,
  color,
  selectedIds,
  onToggle,
}: {
  section: StadiumSectionSeats
  familyStart: number
  familyEnd: number
  innerR: number
  outerR: number
  color: string
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const rows = new Map<number, SeatMapItemResponse[]>()
  for (const item of section.items) {
    const list = rows.get(item.rowNo) ?? []
    list.push(item)
    rows.set(item.rowNo, list)
  }
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b)
  const rowCount = Math.max(rowNumbers.length, 1)
  const rowThickness = (outerR - innerR) / rowCount

  return (
    <>
      {rowNumbers.map((rowNo, rowIndex) => {
        const rowItems = [...rows.get(rowNo)!].sort((a, b) => a.seatNo - b.seatNo)
        const seatCount = Math.max(rowItems.length, 1)
        const angleStep = (familyEnd - familyStart) / seatCount
        const rInner = innerR + rowIndex * rowThickness
        const rOuter = innerR + (rowIndex + 1) * rowThickness

        return rowItems.map((item, seatIndex) => {
          const aStart = familyStart + seatIndex * angleStep
          const aEnd = aStart + angleStep
          const selected = selectedIds.has(item.gameSeatId)
          const clickable = item.status === 'AVAILABLE'
          const fill = selected ? SELECTED_FILL : item.status === 'AVAILABLE' ? color : SOLD_FILL
          const fillOpacity = selected ? 1 : item.status === 'AVAILABLE' ? 0.85 : item.status === 'HELD' ? 0.45 : 0.3

          return (
            <path
              key={item.gameSeatId}
              d={sectorPath(aStart, aEnd, rInner, rOuter)}
              fill={fill}
              fillOpacity={fillOpacity}
              strokeWidth={0.75}
              className={[
                'stroke-slate-50 transition-[fill-opacity] dark:stroke-slate-900',
                clickable || selected ? 'cursor-pointer' : 'cursor-not-allowed',
              ].join(' ')}
              onClick={() => onToggle(item.gameSeatId)}
            >
              <title>
                {section.name} {item.rowNo}열 {item.seatNo}번 · {item.status}
              </title>
            </path>
          )
        })
      })}
    </>
  )
}

/** 이름 체계를 모르는 구역(옛 시드 데이터 등)은 좌석 단위로 못 쪼개니 구역 하나를 통짜 조각으로 보여준다. */
function FallbackWedge({
  section,
  startAngle,
  endAngle,
  color,
}: {
  section: StadiumSectionSeats
  startAngle: number
  endAngle: number
  color: string
}) {
  const available = section.items.filter((item) => item.status === 'AVAILABLE').length
  const ratio = section.items.length === 0 ? 0 : available / section.items.length
  return (
    <path
      d={sectorPath(startAngle, endAngle, INFIELD_R, OUTER_R)}
      fill={color}
      fillOpacity={0.25 + ratio * 0.5}
      strokeWidth={1}
      className="stroke-slate-50 dark:stroke-slate-900"
    />
  )
}

/**
 * 경기장을 위에서 내려다본 돔 모양으로 "구역"이 아니라 좌석 하나하나를 보여준다. 구역 이름이
 * "중앙석 A" 같은 5개 구역(중앙석 / 1루·3루 필드석 / 1루·3루 외야석) x A~C 체계를 따르면, 그 구역의
 * 실제 자리(행x열)만큼 쪼개서 각자 자리에 그린다 — 예매 가능(AVAILABLE)한 자리는 그 구역 색으로,
 * 선점·판매된 자리는 흐리게. 탭하면 바로 그 좌석이 선택된다(별도 좌석 선택 화면 없음). 이름 체계를
 * 벗어나는 데이터가 섞이면 구역을 통짜 조각으로 보여주는 방식으로 되돌아간다.
 */
export function StadiumMap({
  sections,
  selectedIds,
  onToggle,
}: {
  sections: StadiumSectionSeats[]
  selectedIds: Set<number>
  onToggle: (gameSeatId: number) => void
}) {
  const parsed = sections.map((section) => ({ section, parsed: parseSectionName(section.name) }))
  const allRecognized = parsed.length > 0 && parsed.every((item) => item.parsed !== null)

  return (
    <svg viewBox={`0 0 ${SIZE_X} ${SIZE_Y}`} className="mx-auto w-full max-w-sm">
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
              <SeatCells
                key={section.sectionId}
                section={section}
                familyStart={familyStart}
                familyEnd={familyEnd}
                innerR={innerBound + tierIndex * ringWidth}
                outerR={innerBound + (tierIndex + 1) * ringWidth}
                color={FAMILY_COLOR[family]}
                selectedIds={selectedIds}
                onToggle={onToggle}
              />
            )
          })
        : sections.map((section, index) => {
            const sliceAngle = 360 / sections.length
            return (
              <FallbackWedge
                key={section.sectionId}
                section={section}
                startAngle={index * sliceAngle}
                endAngle={(index + 1) * sliceAngle}
                color={STADIUM_PALETTE[index % STADIUM_PALETTE.length]!}
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
