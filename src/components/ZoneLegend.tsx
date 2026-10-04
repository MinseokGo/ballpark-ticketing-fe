import { useState } from 'react'
import { FAMILY_COLOR, parseSectionName, type Family } from '../lib/stadiumLayout'

export type ZoneInfo = {
  sectionId: number
  name: string
  price: number
  availableSeats: number
  totalSeats: number
}

const FAMILY_ORDER: Family[] = ['중앙석', '1루 필드석', '1루 외야석', '3루 필드석', '3루 외야석']

/** "A-1" → "A · 앞", "A-2" → "A · 뒤". 블록 번호가 없으면 층만 보인다. */
function zoneLabel(name: string) {
  const info = parseSectionName(name)
  if (!info) return name
  if (info.half === null) return info.tier
  return `${info.tier} · ${info.half === 1 ? '앞' : '뒤'}`
}

/**
 * 계열 탭 + 구역 카드 목록. 탭으로 계열을 고르고, 카드를 누르면 지도에서 그 구역으로 줌인된다.
 * 카드마다 남은 좌석 비율을 막대로 보여준다.
 */
export function ZoneLegend({
  zones,
  activeSectionId,
  onSelect,
}: {
  zones: ZoneInfo[]
  activeSectionId: number | null
  onSelect: (sectionId: number) => void
}) {
  const groups = new Map<Family, { zone: ZoneInfo; tier: string; half: number }[]>()
  for (const zone of zones) {
    const info = parseSectionName(zone.name)
    if (!info) continue
    const list = groups.get(info.family) ?? []
    list.push({ zone, tier: info.tier, half: info.half ?? 0 })
    groups.set(info.family, list)
  }
  const families = FAMILY_ORDER.filter((family) => groups.has(family))

  const [picked, setPicked] = useState<Family | null>(null)
  const family = picked && groups.has(picked) ? picked : (families[0] ?? null)
  const list = family
    ? [...groups.get(family)!].sort((a, b) => a.tier.localeCompare(b.tier) || a.half - b.half)
    : []

  if (!family) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3">
        {families.map((item) => {
          const active = item === family
          return (
            <button
              key={item}
              type="button"
              onClick={() => setPicked(item)}
              className="press shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={
                active
                  ? { backgroundColor: FAMILY_COLOR[item], color: '#fff' }
                  : undefined
              }
            >
              <span className={active ? '' : 'text-slate-500 dark:text-slate-400'}>{item}</span>
            </button>
          )
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto pr-1">
        {list.map(({ zone }) => {
          const active = zone.sectionId === activeSectionId
          const ratio = zone.totalSeats === 0 ? 0 : zone.availableSeats / zone.totalSeats
          const soldOut = zone.availableSeats === 0
          return (
            <button
              key={zone.sectionId}
              type="button"
              onClick={() => onSelect(zone.sectionId)}
              className={[
                'press group flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all',
                active
                  ? 'border-transparent bg-white shadow-md ring-2 dark:bg-slate-900'
                  : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900',
              ].join(' ')}
              style={active ? { boxShadow: `0 0 0 2px ${FAMILY_COLOR[family]}` } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{zoneLabel(zone.name)}</span>
                <span className="tabular text-[11px] font-semibold text-slate-500">
                  {soldOut ? '매진' : `${zone.availableSeats}석`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${ratio * 100}%`, backgroundColor: FAMILY_COLOR[family] }}
                />
              </div>
              <span className="tabular text-xs text-slate-500">{zone.price.toLocaleString()}원</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
