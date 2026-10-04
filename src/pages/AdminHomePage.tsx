import { Link } from 'react-router-dom'

const CARDS = [
  {
    to: '/admin/sections',
    title: '구역 등록',
    description: '좌석 등급·가격 단위인 구역(Section)을 만든다.',
  },
  {
    to: '/admin/seats',
    title: '좌석 일괄 등록',
    description: '구역 하나를 행 x 열 격자로 보고 좌석을 한 번에 채운다.',
  },
  {
    to: '/admin/games',
    title: '경기 등록',
    description: '경기를 등록하면 현재 존재하는 모든 좌석에 GameSeat가 자동 생성된다.',
  },
]

export function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">관리자 도구</h1>
        <p className="mt-1 text-slate-500">
          ballpark-ticketing-be의 관리자 API를 호출하는 화면이다. 일반적인 데모 일정은
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-800">
            scripts/seed-demo-data.sh
          </code>
          로 한 번에 만들고, 여기는 추가·수정이 필요할 때만 쓴다.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        이 3개 화면은 아직 목록 조회 API를 쓰지 않는다. "이 브라우저에서 등록한 것" 표는 localStorage
        메모일 뿐 서버의 실제 목록이 아니다.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-700"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
