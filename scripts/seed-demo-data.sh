#!/usr/bin/env bash
# ballpark-ticketing-be 관리자 API를 호출해 로컬 개발용 데모 데이터를 만든다.
# 화면이 실제 서비스처럼 보이도록 구단 이름은 실제 KBO 10개 구단을 쓰지만,
# 일정(날짜·시간)은 실제 경기 일정이 아니라 데모용 임의 값이다.
# (ballpark-ticketing-be CLAUDE.md "테스트" 절의 예외 참고. 실제 KBO API 연동은 하지 않는다.)
#
# 좌석은 구역당 20행 x (필드석 60열 / 외야석 100열) — 15개 구역 합쳐서 약 2만 2천 석이다.
# 구역 이름은 "중앙석 A" 같은 5개 구역(중앙석 / 1루·3루 필드석 / 1루·3루 외야석) x A~C 체계를
# 따른다 — StadiumMap이 이 이름을 보고 실제 자리처럼 배치한다(src/components/StadiumMap.tsx 참고).
# 이름이 이 체계를 벗어나면 StadiumMap은 원 둘레에 균등하게 나눠 그리는 방식으로 되돌아간다.
#
# 사용법: BASE_URL=http://localhost:8081 ./scripts/seed-demo-data.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

post() {
	curl -sS -X POST "${BASE_URL}${1}" -H 'Content-Type: application/json' -d "$2"
}

patch() {
	curl -sS -X PATCH "${BASE_URL}${1}"
}

echo "구역·좌석 생성 중... (${BASE_URL})"

create_section_with_seats() {
	local name="$1" grade="$2" price="$3" rows="$4" cols="$5"
	local section_id
	section_id=$(post /api/admin/sections "{\"name\":\"${name}\",\"grade\":\"${grade}\",\"price\":${price}}" | jq -r '.id')
	post "/api/admin/sections/${section_id}/seats" "{\"rowCount\":${rows},\"seatsPerRow\":${cols}}" >/dev/null
	echo "  - ${name} (id=${section_id}, ${price}원, ${rows}x${cols})"
}

create_section_with_seats "중앙석 A" "A" 50000 20 60
create_section_with_seats "중앙석 B" "B" 40000 20 60
create_section_with_seats "중앙석 C" "C" 30000 20 60

create_section_with_seats "1루 필드석 A" "A" 35000 20 60
create_section_with_seats "1루 필드석 B" "B" 28000 20 60
create_section_with_seats "1루 필드석 C" "C" 22000 20 60

create_section_with_seats "3루 필드석 A" "A" 35000 20 60
create_section_with_seats "3루 필드석 B" "B" 28000 20 60
create_section_with_seats "3루 필드석 C" "C" 22000 20 60

create_section_with_seats "1루 외야석 A" "A" 15000 20 100
create_section_with_seats "1루 외야석 B" "B" 12000 20 100
create_section_with_seats "1루 외야석 C" "C" 9000 20 100

create_section_with_seats "3루 외야석 A" "A" 15000 20 100
create_section_with_seats "3루 외야석 B" "B" 12000 20 100
create_section_with_seats "3루 외야석 C" "C" 9000 20 100

echo "경기 생성 중..."

create_game() {
	local home="$1" away="$2" start_at="$3" open_at="$4"
	post /api/admin/games "{\"homeTeam\":\"${home}\",\"awayTeam\":\"${away}\",\"startAt\":\"${start_at}\",\"ticketOpenAt\":\"${open_at}\"}" \
		| jq -r '.id'
}

game1=$(create_game "두산 베어스" "LG 트윈스" "2026-10-10T18:30:00" "2026-10-05T11:00:00")
game2=$(create_game "KIA 타이거즈" "삼성 라이온즈" "2026-10-11T18:30:00" "2026-10-05T11:00:00")
game3=$(create_game "SSG 랜더스" "롯데 자이언츠" "2026-10-15T18:30:00" "2026-10-12T11:00:00")
game4=$(create_game "한화 이글스" "NC 다이노스" "2026-10-16T18:30:00" "2026-10-13T11:00:00")
game5=$(create_game "KT 위즈" "키움 히어로즈" "2026-10-17T18:30:00" "2026-10-14T11:00:00")

echo "경기 ${game1}, ${game2} 예매 오픈 중..."
patch "/api/admin/games/${game1}/open" >/dev/null
patch "/api/admin/games/${game2}/open" >/dev/null

echo "완료. OPEN: ${game1}(두산-LG), ${game2}(KIA-삼성) / SCHEDULED: ${game3}, ${game4}, ${game5}"
