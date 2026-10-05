import { useState } from 'react'
import { DEFAULT_ITEMS, HOME_WIDGET_IDS, clampSpan, type HomeWidgetId, type WidgetItem } from '../lib/homeGrid'

const STORAGE_KEY = 'ballpark-booking.home-layout-v2'

function isWidgetId(value: unknown): value is HomeWidgetId {
  return typeof value === 'string' && (HOME_WIDGET_IDS as readonly string[]).includes(value)
}

/** 저장된 배치를 읽는다. 모르는 위젯은 버리고, 빠진 위젯은 기본 크기로 뒤에 붙인다. */
function readItems(): WidgetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const saved = raw ? (JSON.parse(raw) as Array<Partial<WidgetItem>>) : []
    const kept: WidgetItem[] = []
    for (const item of saved) {
      if (!isWidgetId(item.id) || kept.some((existing) => existing.id === item.id)) continue
      kept.push({ id: item.id, w: clampSpan(Number(item.w) || 1), h: clampSpan(Number(item.h) || 1) })
    }
    const missing = DEFAULT_ITEMS.filter((item) => !kept.some((existing) => existing.id === item.id))
    return [...kept, ...missing]
  } catch {
    return DEFAULT_ITEMS.map((item) => ({ ...item }))
  }
}

/** 홈 위젯의 순서와 크기. 편집기에서 바꾸고, 이 브라우저에 저장된다. */
export function useHomeLayout() {
  const [items, setItems] = useState<WidgetItem[]>(readItems)

  const persist = (next: WidgetItem[]) => {
    setItems(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 저장소를 못 쓰면 이번 세션에서만 적용된다
    }
  }

  const setSize = (id: HomeWidgetId, w: number, h: number) =>
    persist(items.map((item) => (item.id === id ? { ...item, w: clampSpan(w), h: clampSpan(h) } : item)))

  /** from 위젯을 to 위젯 자리(앞)로 옮긴다. */
  const move = (from: HomeWidgetId, to: HomeWidgetId) => {
    if (from === to) return
    const moving = items.find((item) => item.id === from)
    if (!moving) return
    const next = items.filter((item) => item.id !== from)
    next.splice(next.findIndex((item) => item.id === to), 0, moving)
    persist(next)
  }

  /** from 위젯을 맨 뒤로 옮긴다(편집기 하단 드롭 영역). */
  const moveToEnd = (from: HomeWidgetId) => {
    const moving = items.find((item) => item.id === from)
    if (!moving) return
    persist([...items.filter((item) => item.id !== from), moving])
  }

  const reset = () => persist(DEFAULT_ITEMS.map((item) => ({ ...item })))

  return { items, setSize, move, moveToEnd, reset }
}
