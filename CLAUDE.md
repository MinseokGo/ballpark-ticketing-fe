# CLAUDE.md

이 파일은 Claude Code(CLI)가 이 저장소에서 작업할 때 따르는 가이드다. 사람이 읽어도 되도록 쓴다.

## 프로젝트

[ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be)의 소비자 화면(홈·예매·일정·마이페이지)을
제공하는 React SPA. 백엔드가 v1~v7로 단계적으로 기능을 늘려가는 것과 병행해서, 그 시점에 실제로 존재하는 API를 바로
눈으로 확인할 수 있는 화면을 붙여나간다.

- 원칙: **백엔드에 없는 API를 프론트가 먼저 가정하고 만들지 않는다.** 화면은 그 시점에 실제로 호출 가능한
  API만 쓴다.
- 백엔드 저장소: `ballpark-ticketing-be` (로컬 경로 `/Users/minseokgo/workspaces/ballpark-ticketing-be`).
  API 계약, 에러 코드(`ErrorCode`), 진행 단계는 그 저장소의 `CLAUDE.md`가 기준이다. 애매하면 이 저장소를
  고치기 전에 그걸 먼저 확인한다.
- 설계 문서(저장소 밖, Obsidian): 백엔드와 공유 — `/Users/minseokgo/Documents/Obsidian/야구장 예매/`

## 기술 스택

- Node 20+, Vite, React 19 + TypeScript
- React Router (페이지 라우팅), TanStack Query (API 호출·캐싱)
- Tailwind CSS v4
- oxlint

## 명령어

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint      # oxlint
```

백엔드가 먼저 떠 있어야 한다(`ballpark-ticketing-be`에서 `docker compose up -d` → `./gradlew bootRun`).
`.env.local`의 `VITE_API_BASE_URL`로 주소를 바꿀 수 있다(기본 `http://localhost:8080`, `.env.example` 참고).
백엔드 `WebConfig`의 `app.cors.allowed-origins`가 이 앱의 오리진(기본 `localhost:5173`)을 허용해야 한다.

## 백엔드 API 상태 추적

이 레포는 백엔드가 그 시점에 제공하는 API만 호출한다. 작업 전에 백엔드 `CLAUDE.md`의 "진행 상황" 표와 열린
이슈를 확인해서, 아직 없는 API를 가정하고 화면을 만들지 않는다.

- 2026-10-04 기준 백엔드는 관리자 등록, 조회(경기 목록/상세, 구역별 잔여석, 좌석맵), 예매·Mock 결제·취소까지
  다 있다(백엔드 1~4단계). 관리자 화면은 쓸 일이 없어져서 프론트에서 지웠다(관리자 API 호출도 없다).
- `/booking`, `/booking/:gameId`(예매 화면)는 실제 조회 API(경기 목록, 좌석맵, 구역별 잔여석)로 서버 데이터를
  그대로 보여주고, 예매·결제·취소도 실제 API를 호출한다. 사용자는 `src/constants.ts`의 `CURRENT_USER_ID` 하나로
  고정한다. 사용자 전환 화면은 두지 않는다(인증이 생기면 로그인 사용자로 바꾼다).
- `/schedule`(팀별 일정)은 `GET /api/games`만 쓴다. 팀 목록도 백엔드 API가 없어서 경기 목록에서 모은다.
  경기 목록 API는 페이지 최대 100개라 데모 데이터(5경기)는 한 번에 들어오지만, 경기가 100개를 넘으면
  이 화면은 잘린다 — 그때 팀별 조회 API를 백엔드에 요청한다.
- **경기 결과(스코어, 종료 상태)는 백엔드에 아직 없다.** `GameStatus`는 `SCHEDULED`/`OPEN`/`CLOSED`뿐이고
  `CLOSED`는 "예매 마감"이지 "경기 종료"가 아니다. 그래서 결과 화면은 만들지 않았다(구현 시점에는 `FINISHED` 진행 상태로 판단한다). 아래 "결과·실시간 설계
  메모"의 백엔드 선행 작업이 끝난 뒤에 붙인다.
- 로컬 개발용 데이터는 백엔드 `seed` 프로필(`DemoDataSeeder`)이 만든다. 백엔드
  `CLAUDE.md` "테스트" 절의 예외에 따라, 이 데모 데이터는 구단 이름을 실제 KBO 10개 구단으로 쓴다(일정은
  임의 값, 실제 KBO API 연동은 하지 않는다).

## 패키지 구조

```
src
├── api          client.ts(fetch 래퍼, ProblemDetail 에러), booking.ts(엔드포인트별 함수), types.ts(요청/응답 타입)
├── components   여러 화면이 같이 쓰는 것 (Layout, Banner, GameTile, LiveGames, StadiumMap[canvas] 등)
├── hooks        useBookingHistory, useTheme
├── lib          teamColors.ts(팀 이름 → 강조색, 장식용), stadiumLayout.ts(구역 이름 → 돔 배치) 등 순수 유틸
├── pages        화면 단위 (HomePage, BookingGamesPage, BookingSeatMapPage, TeamSchedulePage, ProfilePage,
│                AdminHomePage, SectionsPage, SeatsPage, GamesPage)
└── constants.ts
```

(프론트 쪽 시드 스크립트는 백엔드 시더로 대체되어 삭제했다.)

새 화면을 추가할 때는 `api/`에 타입과 호출 함수를 먼저 추가하고, `pages/`에 화면을, `App.tsx`에 라우트를
추가하는 순서로 한다.

## 코드 규칙

- 함수형 컴포넌트 + Hooks만 쓴다. class 컴포넌트를 쓰지 않는다.
- `tsconfig.app.json`이 `verbatimModuleSyntax: true`다. 타입만 쓰는 import는 `import type`으로 분리한다.
- API 요청/응답 타입은 `src/api/types.ts`에 모은다. 백엔드 DTO(엔티티 아님)와 1:1로 맞춘다 — 백엔드가
  필드를 바꾸면 여기도 같이 바꾼다.
- API 호출은 `src/api/booking.ts`처럼 `api/` 아래 함수로만 하고, 컴포넌트에서 `fetch`를 직접 쓰지 않는다.
  컴포넌트는 TanStack Query의 `useMutation`/`useQuery`로 그 함수를 부른다.
- 에러는 `ApiError`(`problem: ProblemDetail`)로 받는다. 화면(`ErrorBanner`)에는 `problem.detail`과
  `problem.errors`(필드별 사유)만 보여준다 — 백엔드 에러 메시지를 프론트에서 새로 쓰지는 않지만,
  `problem.code`(`SEAT-002` 같은 내부 코드)는 실제 서비스라면 사용자에게 보일 이유가 없어 띄우지 않는다.
- 스타일은 Tailwind 유틸리티 클래스로 한다. 다크 모드는 `dark:` variant로 같이 처리한다. 테마는 `시스템 → 라이트 → 다크`
  순서로 헤더 버튼에서 바꾸고, 선택은 `localStorage`(`ballpark-booking.theme`)에 남긴다. `dark:` variant는
  `index.css`의 `@custom-variant dark`로 `html.dark` 클래스 기준이다(시스템 설정만 보지 않는다).
- 주석은 "왜"가 필요한 곳에만, 한국어로.

## 디자인

토스·당근마켓·카카오·배민 느낌의 "깔끔한 국내 빅테크 서비스" 톤을 따른다. 새 화면/컴포넌트를 만들 때는
아래를 기본값으로 쓰고, 벗어날 이유가 있을 때만 벗어난다.

- 색: 배경은 `slate-50`(dark: `slate-950`), 카드는 `white`(dark: `slate-900`), 테두리는 `slate-200`(dark:
  `slate-800`). 본문 글자는 `slate-900`/`slate-50`, 보조 설명은 `slate-500`. 주요 액션 버튼은 `blue-600`
  (hover `blue-700`), 위험한 액션(결제 실패 처리, 취소)은 `red-600`/outline, 성공 상태는 `emerald`.
- 모양: 카드·패널은 `rounded-2xl`, 입력 필드·작은 버튼은 `rounded-xl`, 배지·태그·둥근 버튼은
  `rounded-full`. 그림자는 과하게 쓰지 않는다(`shadow-md` 이하, hover에서만).
- 타이포: 제목은 `font-extrabold tracking-tight`, 숫자(가격·좌석 번호 등)는 `.tabular` 클래스로 자릿수가
  흔들리지 않게 한다.
- 팀 강조색: `src/lib/teamColors.ts`의 `teamColor(teamName)`을 쓴다. 실제 구단 로고가 아니라 카드를
  구분하기 쉽게 하는 장식용 배색이라는 걸 명확히 한다(주석·커밋 메시지에 "장식용"이라고 적어 둔다).
- 좌석 선택은 `src/components/StadiumMap.tsx` 하나로 끝난다. 경기장을 위에서 내려다본 돔 모양(원이 아니라
  홈플레이트~외야 방향으로 더 긴 타원)에 **좌석 하나하나를 실제 자리대로** 그린다 — 구역을 통짜로 보여준 뒤
  좌석 화면으로 넘어가지 않는다. 구역 이름이 "중앙석 A" 같은 5개 구역(중앙석 / 1루·3루 필드석 / 1루·3루 외야석)
  x A~C 체계를 따르면 중앙석·필드석은 홈플레이트 뒤 270도, 외야석은 외야 벽 너머 90도에 배치하고, A~C는
  안쪽부터 동심원(바깥쪽일수록 싸고 멀다)이며, 그 안을 구역의 행x열만큼 쪼갠다. 판정 로직
  (`parseSectionName`, `FAMILY_ANGLES` 등)은 `src/lib/stadiumLayout.ts`에 있다. 이름 체계를 벗어나는 데이터는
  좌석 단위로 못 쪼개니 구역을 통짜 조각으로 보여주고 선택은 막는다(`wedges`).
- **좌석이 2만 ~ 3만 석이라 DOM(SVG)이 아니라 `<canvas>`로 그린다.** 기하는 원 좌표계(CX, CY, 반지름, 각도)로
  계산하고, 그릴 때만 `setTransform`의 y 배율을 `VS`(1.3)로 줘서 타원으로 보이게 한다 — 그래서 호(arc)가
  비틀리지 않는다. 좌석 경로(`Path2D`)는 데이터가 바뀔 때 한 번만 만든다(`buildLayout`, `useMemo`로 메모).
  호버/탭 판정은 화면 점을 원 좌표로 역변환해서 극좌표(반지름→줄, 각도→열)로 O(1)에 찾는다(`hitTest`).
  화면에 보일 땐 데이터가 `sections`(useMemo) 덕에 안 바뀌면 다시 묶지 않는다 — 페이지에서 `sections`를
  매 렌더마다 새로 만들면 안 된다.
- 확대/축소: 마우스 휠(커서 기준), 두 손가락 핀치, 우측 상단 +/−/⟲ 버튼. 드래그로 옮긴다. 확대 배율은
  1배~40배이고, 패닝은 확대된 만큼만 허용한다(`clampView`). 탭은 6px 미만 움직임일 때만 선택으로 본다.
  좌석 행/열/가격/상태는 호버 툴팁으로 보여준다.
- 색: 예매 가능(구역 색), 선점(황색 흐림), 판매(회색 흐림), 선택(초록).
- 구역 둘러보기(`ZoneLegend`)는 지도 아래에 계열별로 30개 구역을 나열한다. 구역을 누르면 `StadiumMap`의 `focus`가 바뀌어서 그 구역 중심으로 줌인(`zoneView`, 450ms)되고 경계선을 친다. 같은 구역을 다시 눌러도 `nonce`로 다시 줌이 돈다.
- **모든 화면은 화면 폭을 다 쓴다.** `Layout`의 본문은 `w-full`이고, 글만 있는 화면이라도 `max-w-*`로 줄이지 않는다.
  화면 안에서 그리드(`lg:grid-cols-3`, `lg:grid-cols-[320px_minmax(0,1fr)]` 등)로 나눠서 넓은 화면을 채운다.
  하단 고정 바(예매 바)는 `Layout`과 같은 폭(`w-full` + 같은 패딩)을 쓴다.
- 좌석 배치(시드 기준): 구역마다 행·열 수를 다르게 둔다 — 중앙석은 뒤 층일수록 행이 많고(A 20행 → C 24행),
  외야석은 열이 길다(96~120열). 층(A/B/C)은 같은 계열 색을 `TIER_TINT`만큼 옅게 해서 구분한다. 블록 통로는
  `BLOCK_COLS`(12열)·`BLOCK_ROWS`(6행) 단위로 칸 사이를 넓혀서 그린다. 구역 경계도 같은 방식으로 틈을 준다.
  구역 이름표는 캔버스 화면 좌표(CSS px)에 따로 그린다 — 축소 땐 계열 이름("1루 외야석")만, `SECTION_LABEL_ZOOM`(2.5배) 이상이면 층별 이름("1루 외야석 B")으로 바뀐다.
- 내비게이션: 상단 `Layout`의 메인 탭은 홈(`/`)·예매(`/booking`)·마이페이지(`/profile`) 3개만 둔다.
  관리자 화면은 없다. 헤더에는 홈·예매·일정·마이페이지와 테마 버튼만 둔다.
- 움직임: 화면이 바뀔 때 `Layout`이 경로를 key로 줘서 `animate-fade-up`이 다시 돈다. 로딩은 "불러오는 중..."
  대신 `Skeleton`(shimmer)을 쓴다. 버튼은 `press` 클래스로 누를 때 살짝 줄어든다. 결제 완료는 `Celebration`
  (색종이 한 번)과 `animate-pop` 체크 배지로 알린다. 모든 움직임은 `prefers-reduced-motion`에서 꺼진다.
- 이벤트 배너(`EventBanner`, `src/lib/events.ts`)는 화면 콘텐츠다. 실제로 구현되지 않은 혜택(할인 등)은 문구로도 약속하지 않는다.
- 모바일(sm 미만)에서는 상단 메뉴 대신 하단 탭 바를 쓴다. 좌석 지도 화면은 하단 예매 바와 겹쳐서 탭 바를 숨긴다.
- 모바일 폭(390px 기준)에서 먼저 보고 깨지지 않는지 확인한다. 화면 하단에 고정되는 액션 바(예매 화면의
  "예매하기"/결제 버튼)는 `fixed inset-x-0 bottom-0` + `w-full`과 `Layout`과 같은 패딩으로 본문 폭과 맞춘다.
- **소비자 화면(홈·예매·일정·마이페이지)에는 "이건 데모/테스트다"를 드러내는 문구나 조작을 두지 않는다.**
  구체적으로: 에러에 내부 코드(`SEAT-002` 등)를 보여주지 않는다(`ErrorBanner`는 `detail`만 보여준다),
  `X-User-Id` 같은 HTTP 헤더 이름을 화면 문구에 쓰지 않는다, Mock 결제는 성공/실패를
  고르는 버튼 두 개 대신 "결제하기" 버튼 하나만 둔다(성공 경로만 기본 노출), "서버에 ~ API가 없어서"
  같은 구현 설명을 넣지 않는다. 이런 내부 사정은 코드 주석이나 이 문서에만 적는다.
- **성능 측정·사용자 전환 같은 개발용 조작은 화면에 두지 않는다.** 실제 서비스처럼 보이는 화면만 남긴다.

## 실시간 경기와 결과 (구현됨)

백엔드 설계는 `ballpark-ticketing-be/docs/design/live-and-results.md`에 있다. 프론트는 다음처럼 쓴다.

- 진행 상태 스냅샷: `GET /api/games/{id}/live`를 `useLiveState`(`src/hooks/useLiveGame.ts`)로 받는다. 홈의 진행 중 카드는 15초, 예매 화면은 10초마다 갱신한다.
- 실시간: 예매 화면에서 경기가 `LIVE`일 때만 `useLiveStream`이 SSE(`/live/stream`)를 연다. 이벤트마다 캐시를 고치고, 끝나는 이벤트에서 연결을 닫는다. 끊기면 폴링이 값을 맞춘다. 끝난 경기는 서버가 바로 닫으므로 `LIVE`일 때만 연다(재연결 반복 방지).
- 결과: 목록·상세의 `progress`, `homeScore`, `awayScore`, `winner`로 그린다. 승부 문구와 팀별 승·패·무는 `src/lib/gameResult.ts`에 있다.
- 시뮬레이션 값(`liveMock`)은 없다. 진행 데이터는 전부 백엔드 DB에서 온다.

## 테스트

아직 테스트 러너를 추가하지 않았다. 화면에 폼 검증·데이터 변환 같은 로직이 쌓이면 Vitest + React Testing
Library를 추가한다. 지금은 `npm run build`(타입 체크)와 `npm run lint`로만 확인한다.

## Git/GitHub 규칙

`ballpark-ticketing-be`와 동일하게 간다.

- **커밋, PR, 이슈는 모두 한국어로 쓴다.**
- **커밋 작성자를 직접 지정하지 않는다.** 이 Mac의 git 설정(`MinseokGo <rhalstjr1999@naver.com>`)을 그대로
  쓴다.
- 브랜치: `main` + 기능 브랜치(`feat/...`, `fix/...`, `docs/...`) → PR로 머지. `main`에 직접 push하지 않는다.
- 커밋 접두어: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`(마크업·스타일만 바뀔 때). 본문에
  무엇을·왜 바꿨는지 쓴다.
- PR 본문: Before / After / How / 테스트 결과(화면이면 가능한 스크린샷).
- 라벨은 직접 붙인다(아래 표). 작업 중 발견한 후속 과제는 라벨을 붙여 이슈로 등록한다.

### 라벨

| 구분 | 값 |
|---|---|
| 타입 | `타입: 기능`, `타입: 버그`, `타입: 리팩터링`, `타입: 설계`, `타입: 설정`, `타입: 문서`, `타입: 테스트` |
| 화면 | `화면: 홈`, `화면: 예매`, `화면: 마이페이지`, `화면: 구역`, `화면: 좌석`, `화면: 경기`, `화면: 공통` |
| 우선순위 | `우선순위: 높음`, `우선순위: 보통`, `우선순위: 낮음` |
| 버전 | `버전: v1`, `버전: v2` |

버전 라벨은 백엔드 로드맵 버전과 맞춘다. "화면"은 백엔드의 "도메인"(패키지) 라벨에 대응하는 FE 쪽 구분으로,
어느 페이지/기능 영역인지를 나타낸다.

## 진행 상황

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 뼈대 (Vite + React + TS + Tailwind + Router + Query) | 완료 |
| 1 | ~~관리자 콘솔: 구역 등록, 좌석 일괄 등록(격자 미리보기), 경기 등록~~ | 완료 후 삭제 (관리자 화면은 필요 없어짐) |
| 2 | 사용자 예매 화면: 경기 목록, 좌석맵 선택, 예매/Mock 결제/취소 | 완료 |
| 3 | 비주얼 리디자인: 홈/마이페이지 신설, 경기장 돔 모양 구역 선택(`StadiumMap`) | 완료 |

열린 과제: 예매 화면의 실시간 연결을 여러 경기에 나눠 쓰는 방식(목록 SSE)은 필요해질 때 정한다. 지금은 진행 중 카드가 폴링하고 예매 화면만 SSE를 쓴다.