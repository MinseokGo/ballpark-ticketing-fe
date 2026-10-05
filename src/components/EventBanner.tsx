import { Link } from 'react-router-dom'
import { HOME_EVENTS } from '../lib/events'

export function EventBanner() {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
      {HOME_EVENTS.map((event) => (
        <Link
          key={event.id}
          to={event.to}
          className={`press group relative w-[84%] shrink-0 snap-start overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg shadow-blue-500/10 sm:w-[60%] ${event.gradient}`}
        >
          <span className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
          <span className="absolute -bottom-10 right-10 size-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
          <p className="relative text-xs font-semibold text-white/80">{event.eyebrow}</p>
          <p className="relative mt-1 text-xl font-extrabold tracking-tight">{event.title}</p>
          <p className="relative mt-2 text-sm text-white/85">{event.description}</p>
          <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-bold">
            자세히 보기 <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
