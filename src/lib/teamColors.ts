/**
 * 팀 이름 → 강조색. 실제 구단 엠블럼/로고가 아니라 카드를 구분하기 쉽게 하는 장식용 배색이다.
 * KBO 10개 구단 이름을 키로 쓴다(백엔드 데모 데이터와 맞춤, ballpark-ticketing-be CLAUDE.md 참고).
 */
const TEAM_COLORS: Record<string, string> = {
  '두산 베어스': '#131230',
  'LG 트윈스': '#C30452',
  'KIA 타이거즈': '#EA0029',
  '삼성 라이온즈': '#074CA1',
  'SSG 랜더스': '#CE0E2D',
  '롯데 자이언츠': '#041E42',
  '한화 이글스': '#FF6600',
  'NC 다이노스': '#1D467C',
  'KT 위즈': '#000000',
  '키움 히어로즈': '#591A2C',
}

const FALLBACK_COLORS = ['#3182F6', '#00C2A8', '#8B5CF6', '#F59E0B', '#EF4444']

export function teamColor(teamName: string): string {
  if (TEAM_COLORS[teamName]) {
    return TEAM_COLORS[teamName]
  }
  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) | 0
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

export function teamInitial(teamName: string): string {
  return teamName.trim().at(0) ?? '?'
}
