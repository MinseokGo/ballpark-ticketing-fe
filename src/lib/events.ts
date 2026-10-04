/**
 * 홈 화면 이벤트 배너. 백엔드 데이터가 아니라 화면 콘텐츠라서 여기서 관리한다.
 * 혜택을 약속하는 문구는 넣지 않는다 — 실제로 구현되지 않은 할인 같은 건 보여주지 않는다.
 */
export type HomeEvent = {
  id: string
  eyebrow: string
  title: string
  description: string
  to: string
  gradient: string
}

export const HOME_EVENTS: HomeEvent[] = [
  {
    id: 'weekend-game',
    eyebrow: '이번 주말',
    title: '주말 경기 한눈에 보기',
    description: '예매 중인 경기만 모아서 좌석부터 골라보세요.',
    to: '/booking',
    gradient: 'from-blue-600 via-blue-500 to-indigo-500',
  },
  {
    id: 'center-seat',
    eyebrow: '처음 오셨나요?',
    title: '중앙석에서 보는 야구',
    description: '홈플레이트 뒤 중앙석은 층마다 색이 달라요. 지도를 확대해 보세요.',
    to: '/booking',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    id: 'my-tickets',
    eyebrow: '내 예매',
    title: '예매 내역은 마이페이지에서',
    description: '이 기기에서 한 예매를 모아서 보여드려요.',
    to: '/profile',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
  },
]
