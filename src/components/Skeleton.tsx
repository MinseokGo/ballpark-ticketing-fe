export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} aria-hidden="true" />
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-20" />
      ))}
    </div>
  )
}
