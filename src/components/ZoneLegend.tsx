import { FAMILY_COLOR, parseSectionName, type Family } from '../lib/stadiumLayout'

export type ZoneInfo = {
  sectionId: number
  name: string
  price: number
  availableSeats: number
  totalSeats: number
}

const FAMILY_ORDER: Family[] = ['중앙석', '1루 필드석', '1루 외야석', '3루 필드석', '3루 외야석']

/** 범례이자 구역 목록. 계열별로 묶어서 층·블록 단위까지 나열하고, 누르면 지도에서 그 구역으로 줌인된다. */
export function ZoneLegend({
  zones,
  activeSectionId,
  onSelect,
}: {
  zones: ZoneInfo[]
  activeSectionId: number | null
  onSelect: (sectionId: number) => void
}) {
  const groups = new Map<Family, ZoneInfo[]>()
  for (const zone of zones) {
    const info = parseSectionName(zone.name)
    if (!info) continue
    const list = groups.get(info.family) ?? []
    list.push(zone)
    groups.set(info.family, list)
  }

  return (
    <div className="space-y-4">
      {FAMILY_ORDER.filter((family) => groups.has(family)).map((family) => {
        const list = [...groups.get(family)!].sort((a, b) => a.name.localeCompare(b.name))
        return (
          <div key={family}>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: FAMILY_COLOR[family] }} />
              {family}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((zone) => {
                const active = zone.sectionId === activeSectionId
                const soldOut = zone.availableSeats === 0
                return (
                  <button
                    key={zone.sectionId}
                    type="button"
                    onClick={() => onSelect(zone.sectionId)}
                    className={[
                      'press flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors',
                      active
                        ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/20 dark:bg-blue-950'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold">{zone.name.replace(`${family} `, '')}</span>
                    <span className="tabular text-xs text-slate-500">
                      {zone.price.toLocaleString()}원 · {soldOut ? '매진' : `${zone.availableSeats}석`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
