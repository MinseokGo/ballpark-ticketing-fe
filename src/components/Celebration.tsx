const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']
const PIECES = 28

/** 결제 완료 순간에 한 번 터지는 색종이. 위치와 흔들림은 인덱스로 정해서 렌더마다 바뀌지 않는다. */
export function Celebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, index) => {
        const left = (index * 37) % 100
        const delay = (index % 7) * 0.06
        const drift = ((index % 5) - 2) * 26
        const size = 6 + (index % 4) * 2
        return (
          <span
            key={index}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: COLORS[index % COLORS.length],
              animation: `confetti 1.6s ${delay}s cubic-bezier(0.2, 0.7, 0.3, 1) both`,
              ['--drift' as string]: `${drift}px`,
            }}
          />
        )
      })}
    </div>
  )
}
