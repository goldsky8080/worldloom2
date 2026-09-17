# v0.1 검증 기록 · 2026-09-17

## 환경

- Windows, Node.js 22.9.0, npm 10.8.3, TypeScript 5.7.3.
- React 19.3.0, Vite 6.4.3, PixiJS 8.20.1, Vitest 4.1.11, Playwright 1.63.0.
- 설치되어 있던 Chromium을 명시적으로 지정했습니다. WebGL은 SwiftShader로 검사했습니다.
- 개발 서버 5190을 사용했으며, 다른 앱이 사용 중인 5173은 변경하지 않았습니다.

## 자동 검증

| 검사                   | 결과                 | 내용                               |
| ---------------------- | -------------------- | ---------------------------------- |
| `npm test`             | 54 / 54 통과         | Core 23, Runtime 19, Component 12  |
| `npm run lint`         | 통과                 | 경고 허용 수 0                     |
| `npm run format:check` | 통과                 | 소스·설정·작성 문서 형식 검사      |
| `npm run build`        | 통과                 | TypeScript 검사 및 운영 번들 생성  |
| Playwright             | 12 / 12 통과 (2.5분) | 데스크톱 / Pixel 7 각 6개 시나리오 |

Core 검사는 Registry, 메뉴 잠금, 설정, 사전 키 일치, 계약 검증, UUID, Sequence, 자산 Fallback, AOI/Chunk, 이동 보간, Panel Manager, UI EventBus를 포함합니다.

Runtime 검사는 명령 단계, 채광 결과, 보상 중복 방지, Replay/Snapshot, 수신 중 이벤트 버퍼, 서버 시간 보정, 지연된 응답 취소, 세션 만료, 재인증, 재연결 백오프, 모듈 이벤트 구독, 동시 명령 충돌을 포함합니다.

Component 검사는 공통 UI, Countdown, 다국어, 단일 창·최소화·복원·모달, 알림, 예정 공지와 새 공지 팝업을 포함합니다.

브라우저 시나리오: 로그인과 Pixi Canvas, 캐릭터 풀·인벤토리, 채광 12→15, 우편 골드 1250→1325, 채팅, 언어 전환, 연결 끊김·Replay, Sequence 누락·Snapshot, 세션 만료, 가입·Mock 인증, 지도 선택·이동·키보드 카메라 및 창 복원.

설치 및 의존성 갱신 시 npm audit은 취약점 0개를 보고했습니다. 이는 설치 시점의 결과이며 이후 보안 상태를 보장하지 않습니다.

## 시각 검수

- 데스크톱 1440×900 및 Pixel 7 412×839 화면을 실제 Chromium에서 생성했습니다.
- 로그인, 월드, 인벤토리의 양쪽 화면을 확인했습니다. 다크 테마, HUD, 메뉴, 부유 창, 모바일 Sheet와 하단 메뉴, 채팅, 설명형 자산을 점검했습니다.
- 화면 파일: [데스크톱 월드](screenshots/world-desktop.png), [모바일 월드](screenshots/world-mobile.png), [데스크톱 로그인](screenshots/login-desktop.png), [모바일 로그인](screenshots/login-mobile.png), [데스크톱 인벤토리](screenshots/inventory-desktop.png), [모바일 인벤토리](screenshots/inventory-mobile.png).

## 빌드 경고와 검증 한계

Pixi 청크가 576.64 kB, gzip 168.78 kB로 Vite의 500 kB 경고 기준을 넘습니다. 렌더러는 동적 import로 진입 시 로드하며 경고를 숨기지 않았습니다. 향후 실제 콘텐츠와 함께 분할 전략을 재평가해야 합니다.

브라우저 검증은 Mock 모드의 기능 검증입니다. 실제 서버 권한·영속성·인증·이메일·WebSocket, 실기기 GPU와 음향, 대규모 월드의 부하/FPS, 최종 아트 품질은 검증하지 않았습니다. 현재 44개 샘플 객체가 대규모 부하 시험을 대신하지 않습니다.

실제 SpriteSheet 재생·군집 집계·서버 공간 스트리밍은 Skeleton 또는 확장 계약입니다. 기본 detail/icon/dot LOD, 화면 Culling, Chunk/AOI Debug, 자산 대체 경로는 구현했습니다.

## 재현

```powershell
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

이미 실행 중인 이 프로젝트 서버를 사용할 경우:

```powershell
$env:PLAYWRIGHT_EXTERNAL_SERVER='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5190'
npm run test:e2e
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE`은 기존 Chromium 실행 파일을 지정할 때만 추가합니다. HTML 보고서는 `playwright-report/`, 실패 Trace는 `test-results/`에 생성됩니다.

최신 v0.2 검증은 [VALIDATION_v0.2.md](VALIDATION_v0.2.md)에 기록합니다.
