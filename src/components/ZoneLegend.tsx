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
 * 계열별로 묶은 구역 카드 목록. 계열 제목을 누르면 그 계열의 구역 카드가 접히거나 펼쳐진다.
 * 기본은 모두 펼침. 카드를 누르면 지도에서 그 구역으로 줌인된다.
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
  // 접힌 계열만 기억한다. 기본은 모두 펼쳐 둔다.
  const [closed, setClosed] = useState<Set<Family>>(() => new Set())
  const toggle = (family: Family) =>
    setClosed((prev) => {
      const next = new Set(prev)
      if (next.has(family)) next.delete(family)
      else next.add(family)
      return next
    })

  if (families.length === 0) return null

  return (
    // 목록이 길어서 패널 안에서만 세로로 스크롤한다. 가로 스크롤은 쓰지 않는다.
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {families.map((family) => {
        const list = [...groups.get(family)!].sort((a, b) => a.tier.localeCompare(b.tier) || a.half - b.half)
        const available = list.reduce((sum, { zone }) => sum + zone.availableSeats, 0)
        const open = !closed.has(family)
        return (
          <section key={family} aria-label={family}>
            <button
              type="button"
              onClick={() => toggle(family)}
              aria-expanded={open}
              className="press mb-2 flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: FAMILY_COLOR[family] }} />
                {family}
                <span className="tabular text-xs font-medium text-slate-500">{list.length}구역</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular text-xs text-slate-500">잔여 {available.toLocaleString()}석</span>
                <span
                  aria-hidden
                  className={['text-slate-400 transition-transform duration-300', open ? 'rotate-180' : ''].join(' ')}
                >
                  ▾
                </span>
              </span>
            </button>
            {open && (
              <div className="animate-fade-up grid grid-cols-2 gap-2">
                {list.map(({ zone }) => {
                  const active = zone.sectionId === activeSectionId
                  const ratio = zone.totalSeats === 0 ? 0 : zone.availableSeats / zone.totalSeats
                  const soldOut = zone.availableSeats === 0
                  return (
                    <button
                      key={zone.sectionId}
                      type="button"
                      onClick={() => onSelect(zone.sectionId)}
                      aria-pressed={active}
                      className={[
                        'press group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-3 pl-4 text-left transition-all',
                        active
                          ? 'bg-white shadow-md dark:bg-slate-900'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900',
                      ].join(' ')}
                      style={active ? { borderColor: FAMILY_COLOR[family] } : undefined}
                    >
                      {/* 선택 표시는 카드 안쪽에 그린다. 바깥에 그리면 스크롤 영역에 잘린다. */}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-1"
                          style={{ backgroundColor: FAMILY_COLOR[family] }}
                        />
                    )}
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
            )}
          </section>
        )
      })}
    </div>
  )
}
