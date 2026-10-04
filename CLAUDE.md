# CLAUDE.md

이 파일은 Claude Code(CLI)가 이 저장소에서 작업할 때 따르는 가이드다. 사람이 읽어도 되도록 쓴다.

## 프로젝트

[ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be)의 관리자/예매 화면을 제공하는
React SPA. 백엔드가 v1~v7로 단계적으로 기능을 늘려가는 것과 병행해서, 그 시점에 실제로 존재하는 API를 바로
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

- 2026-10-04 기준 백엔드는 관리자 등록(`POST`) API만 있다 — 구역 등록, 좌석 일괄 등록, 경기 등록. 조회
  (`GET`) API는 없다(백엔드 3단계 "조회 API"에서 추가될 예정).
- 그래서 지금 화면은 "등록하면 결과를 그 자리에서 보여주는" 수준이다. 목록처럼 보이는 것(구역·경기 표)은
  `localStorage`에 이 브라우저가 기록해 둔 메모일 뿐이고(`src/hooks/useLocalRegistry.ts`), 서버의 실제
  데이터가 아니다.
- 백엔드에 조회 API가 생기면 해당 화면은 `localStorage` 메모를 걷어내고 TanStack Query로 실제 서버 데이터를
  가져오도록 바꾼다.

## 패키지 구조

```
src
├── api          client.ts(fetch 래퍼, ProblemDetail 에러), admin.ts(엔드포인트별 함수), types.ts(요청/응답 타입)
├── components   여러 화면이 같이 쓰는 것 (Layout, Banner, SeatGridPreview)
├── hooks        useLocalRegistry 등
├── pages        화면 단위 (DashboardPage, SectionsPage, SeatsPage, GamesPage)
└── constants.ts
```

새 화면을 추가할 때는 `api/`에 타입과 호출 함수를 먼저 추가하고, `pages/`에 화면을, `App.tsx`에 라우트를
추가하는 순서로 한다.

## 코드 규칙

- 함수형 컴포넌트 + Hooks만 쓴다. class 컴포넌트를 쓰지 않는다.
- `tsconfig.app.json`이 `verbatimModuleSyntax: true`다. 타입만 쓰는 import는 `import type`으로 분리한다.
- API 요청/응답 타입은 `src/api/types.ts`에 모은다. 백엔드 DTO(엔티티 아님)와 1:1로 맞춘다 — 백엔드가
  필드를 바꾸면 여기도 같이 바꾼다.
- API 호출은 `src/api/admin.ts`처럼 `api/` 아래 함수로만 하고, 컴포넌트에서 `fetch`를 직접 쓰지 않는다.
  컴포넌트는 TanStack Query의 `useMutation`/`useQuery`로 그 함수를 부른다.
- 에러는 `ApiError`(`problem: ProblemDetail`)로 받는다. 화면에 보여줄 땐 `problem.code`, `problem.detail`,
  `problem.errors`(필드별 사유)를 그대로 쓴다 — 백엔드 에러 메시지를 프론트에서 새로 쓰지 않는다.
- 스타일은 Tailwind 유틸리티 클래스로 한다. 다크 모드는 `dark:` variant로 같이 처리한다(별도 다크모드
  토글은 두지 않는다. 시스템 설정을 따른다).
- 주석은 "왜"가 필요한 곳에만, 한국어로.

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
| 화면 | `화면: 구역`, `화면: 좌석`, `화면: 경기`, `화면: 공통` |
| 우선순위 | `우선순위: 높음`, `우선순위: 보통`, `우선순위: 낮음` |
| 버전 | `버전: v1`, `버전: v2` |

버전 라벨은 백엔드 로드맵 버전과 맞춘다. "화면"은 백엔드의 "도메인"(패키지) 라벨에 대응하는 FE 쪽 구분으로,
어느 페이지/기능 영역인지를 나타낸다.

## 진행 상황

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 뼈대 (Vite + React + TS + Tailwind + Router + Query) | 완료 |
| 1 | 관리자 콘솔: 구역 등록, 좌석 일괄 등록(격자 미리보기), 경기 등록 | 완료 |
| 2 | 백엔드 3단계(조회 API) 대응: 구역·경기 목록, 좌석맵 화면으로 교체 | 백엔드 3단계 이후 |

열린 과제: 백엔드 3단계가 끝나면 `localStorage` 메모(`useLocalRegistry`)를 실제 조회 API 호출로 교체한다.
