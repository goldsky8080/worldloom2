# v0.2 검증 기록 · 2026-09-17

기준 문서: docs/spec/V0_2_DESIGN.md(50개 절), V0_2_EXECUTION_PROMPT.md. Windows / Node 22.9.0 / npm 10.8.3, 동일 React/Vite/Pixi 스택.

## 단계별 확인

| 단계                                          | 테스트    | lint | build |
| --------------------------------------------- | --------- | ---- | ----- |
| v0.2A World Config / Terrain / Chunk / Camera | 60개 통과 | 통과 | 통과  |
| v0.2B Distance Movement / moveSpeed           | 63개 통과 | 통과 | 통과  |
| v0.2C Mining / Event / Snapshot / UI          | 90개 통과 | 통과 | 통과  |

브라우저: 데스크톱 1440×900 및 Pixel 7 412×839, 설치된 Chromium + SwiftShader WebGL, 전용 임시 포트 5192. 최종 **16개 시나리오가 모두 통과했습니다(3.8분)**.

## 검증 내용

- 거리 3-4-5, 동적 Chunk 경계와 부분 Chunk, Config Bounds, Camera/Zoom Clamp.
- 작은 이동 500ms·720단위 6초·실제 보간 출발점·서버 도착시각.
- 원거리 채광 거절, 범위 경계 수락·경계 밖 거절, 유효하지 않은 Node·캐릭터.
- 이동/채광 상호 배제, ACCEPTED 실행 대기 중 경쟁, 실행 직전 재검증과 예약 해제.
- 5초 채광 이벤트 순서, 구리 12→15→18, 이중 지급 방지.
- 시작/최근 결과 Snapshot 복원, 연결 끊김 후 Replay 복구, 로컬 Timer로 보상/입력 해제 없음.
- Entity/Mining 패널 상태 공유, 패널 닫기·다시 열기, 5개 언어 즉시 갱신.
- 기존 로그인·가입·Mock 인증, 캐릭터·인벤토리, 우편·채팅·설정, Gap·세션 만료, 키보드 카메라·창 복원.

기존 '이동과 채광 동시 허용' 테스트를 새 상호 배제 규칙으로 변경했습니다. 완료 명령 재전송에서 상태가 ACCEPTED로 회귀하는 문제를 신규 테스트로 발견하고 수정했습니다.

## 화면

- [이동 데스크톱](screenshots/v02-travel-desktop.png) / [이동 모바일](screenshots/v02-travel-mobile.png)
- [채광 데스크톱](screenshots/v02-mining-desktop.png) / [채광 모바일](screenshots/v02-mining-mobile.png)
- [보상 데스크톱](screenshots/v02-reward-desktop.png) / [보상 모바일](screenshots/v02-reward-mobile.png)

기존 사용자 아트를 보존했으며 새 최종 지도 아트는 만들지 않았습니다. Terrain은 기존 Mock 도형입니다.

## 재현과 한계

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

기존 Chromium 사용 시 PLAYWRIGHT_CHROMIUM_EXECUTABLE을 지정합니다. 이미 실행 중인 이 프로젝트 테스트 서버는 PLAYWRIGHT_EXTERNAL_SERVER=1과 PLAYWRIGHT_BASE_URL로 지정합니다.

Mock 메모리 세계만 시험했습니다. 새로고침 영속성, 실제 API 인증·DB·WebSocket·Simulator, 실기기 GPU·사운드, 대규모 Chunk/Entity 부하, 최종 아트 품질은 검증 범위가 아닙니다. Pixi 청크 경고는 유지합니다.

모바일 메뉴가 패널 뒤에서 입력을 가리는 문제와 최초 지도 준비 시점의 클릭 경쟁을 수정했습니다. 채광 진행바가 화면 안에 있는지도 브라우저에서 검사합니다. 파일 저장 중 빈 모듈을 감시하지 않도록 HMR 설정을 보강했습니다.

최종 운영 빌드: CSS 25.45 kB (gzip 5.98), 앱 395.89 kB (gzip 119.19), WorldScene 10.74 kB (gzip 4.12), Pixi 576.64 kB (gzip 168.78). 기능 검증 수치는 대규모 성능 보증이 아닙니다.

추가로 기본 자동 테스트 서버(5187) 시작을 검증해 로그인/Pixi 시나리오 1개가 통과했습니다. 이 Windows 실행 환경에서는 테스트 서버 종료 대기가 남아 해당 임시 프로세스를 명시적으로 종료했습니다. 5187과 별도 검증 서버 5192의 LISTENING이 없는 것을 netstat로 확인했습니다. 작업 시작 전부터 실행 중이던 5190 서버는 유지했습니다.

최종 npm run lint, npm run format:check, npm test(90/90), npm run build가 통과했습니다. v0.2 상세설계서와 실행프롬프트 사본은 원본과 바이트가 동일함을 확인했습니다.
