import { Link } from 'react-router-dom'

const CARDS = [
  {
    to: '/sections',
    title: '구역 등록',
    description: '좌석 등급·가격 단위인 구역(Section)을 만든다.',
  },
  {
    to: '/seats',
    title: '좌석 일괄 등록',
    description: '구역 하나를 행 x 열 격자로 보고 좌석을 한 번에 채운다.',
  },
  {
    to: '/games',
    title: '경기 등록',
    description: '경기를 등록하면 현재 존재하는 모든 좌석에 GameSeat가 자동 생성된다.',
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리자 콘솔</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          ballpark-ticketing-be의 관리자 API(2단계)를 호출하는 화면이다.
        </p>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        백엔드에는 아직 조회(GET) API가 없다(3단계 "조회 API"에서 추가될 예정). 그래서 이 화면은 등록 결과를
        그 자리에서 보여주는 수준이고, 구역/경기 목록은 이 브라우저에 임시로 기록해 둔 것일 뿐 서버의 실제
        목록이 아니다.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
