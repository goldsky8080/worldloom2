# Fief Gameplay v0.2 검증 · 2026-09-18

환경: Windows, Node 22.9.0, 기존 React/Vite/TypeScript/Pixi 프로젝트. 실제 Chromium(WebGL 소프트웨어 fallback 지원), 데스크톱 1440×900 / Pixel 7 412×839. 기존 개발 서버 5190과 전용 Playwright 서버 5187에서 검증했습니다. 새 패키지는 추가하지 않았습니다.

## 코어·정적 검사

- 전체 코어 테스트 **132개 통과**: 기존 115개 + 게임플레이 모델 14개 + StrictMode UI·시간 수명 3개.
- ESLint, TypeScript·운영 빌드, Prettier 통과.
- 원본 영지 설계서 보존: docs/spec/FIEF_SYSTEM_DESIGN_v0.2.md SHA-256 **8EF78072BEE1E917688DA244E553E376975DE7D6833B93D778D6876D937701CC**.
- 첨부 실행 프롬프트와 docs/spec/FIEF_GAMEPLAY_EXECUTION_v0.2.md SHA-256 일치: **1811DEA4F3F2DC90638D9AAC40EBD51330B00870F295329167EE126673508C5E**.

기존 등급·도시 범위·주기·던전 ID·성 독립·예고 테스트 14개를 유지합니다. 새 모델 테스트는 압력 자연 증가와 에테르 분리, 모집 비용·정원, 순찰 비용·병력 조건·지연 완료, 공략 준비·진행·완료, 의뢰 비용·수락·파티 진행, 중복 시작·완료 방지, 잔액 부족, 수치 하한, 폭주 1회당 피해 1회, 회복 후 재폭주, 겹치는 웨이브 보존, 자연 최대치 도달 시점, 큰 시간 증가와 작은 tick의 동일 결과를 확인합니다.

UI 테스트는 StrictMode에서 interval 1개만 활성화되는지, pause·이탈 시 interval과 visibilitychange 리스너가 정리되는지, DEV 기본 닫힘·Escape 포커스 복귀, 직접 공략의 실제 진행 표시와 중복 시작 방지를 확인합니다. 숨김 탭의 시간 합산 방지는 기존 브라우저 시나리오로 유지합니다.

기존 채광 UI 테스트의 시간 기준을 테스트 fixture의 Date.now와 같은 tick으로 맞췄습니다. 생산용 이동·채광·시간 서비스는 수정하지 않았습니다. Pixi의 기존 500 kB 청크 경고가 있으나 운영 빌드는 성공합니다.

## 실제 브라우저

고유 시나리오 **52개 통과**: 새 게임플레이 14개, 기존 영지 12개, 기존 게임·아틀라스 26개. 모두 데스크톱·모바일을 포함합니다.

새 게임플레이 시나리오 7개 × 2개 화면:

1. 지도 중심 HUD, DEV 기본 닫힘, 시설 터치·키보드 선택, 실제 WebP 프레임, 5개 언어, 가로 넘침 없음.
2. 모집 500 G·20명 증가, 순찰 250 G·성→던전 경비병 이동, 완료 시 압력만 감소.
3. 직접 공략 준비→진행→완료, 완료 전 에테르 미감소, 중복 방지.
4. 의뢰 1,000 G 1회 차감, POSTED→ACCEPTED→IN_PROGRESS→SUCCEEDED, 파티 마커와 1회 완료.
5. 압력 100만으로 폭주하지 않음, 에테르 폭주·5개 몬스터의 도시 이동, 민심/치안/번영 피해 1회, 회복 후 재폭주, 장원 사건 기록.
6. 반복 지출로 잔액 0, 모집 정원·의뢰 잔액 부족 차단, DEV 금고 추가 후 행동 재개.
7. 진행 행동 중 /fief→/atlas→/fief→/game 이동, 재진입 초기 상태, Pixi 캔버스 생성·제거와 브라우저 오류 없음.

기존 영지 6개 시나리오의 주기·등급·폭주·즉시 DEV 공략·자동 시간·숨김/정지·시간 모드·다국어·아틀라스 왕복은 새 DEV 패널 위치에 맞춰 유지했습니다. 시간 모드 검증은 정확한 초기 상태에서 가상 시계를 고정합니다.

기존 게임·아틀라스 26개는 로그인·가입·패널·우편·채팅·다국어, 거리 이동·채광·인벤토리 보상, Gap/Replay·세션 만료·패널 복구, 아틀라스 LOD·모바일 핀치·소유/통치·장면·아이템·오류 재시도를 확인합니다.

행동 시간 검증은 Playwright 가상 시계를 사용합니다. 화면 지연 로드·Pixi를 포함하는 왕복 검증은 실제 시계를 사용하여 가상 시계가 라우트 스케줄링을 지연시키는 영향을 제거했습니다. 새 게임플레이 시나리오는 Chromium의 기본 그래픽 합성을 사용합니다. 강제 ANGLE 소프트웨어 합성과 가상 시계의 조합에서 생기는 스크롤 캡처 잔상을 방지하며, WebGL 소프트웨어 fallback은 유지합니다. 기존 게임·아틀라스 시나리오의 그래픽 설정은 유지합니다.

두 브라우저 실행의 임시 기록 폴더가 겹쳐 종료 시 ENOENT가 난 검사는 별도 output 위치에서 재실행하여 통과했습니다. 게임 동작의 assertion 실패가 아니었으며 생산 코드를 변경하지 않았습니다.

## 화면·5190 서버 검수

실제 5190 서버에서 최종 새 게임플레이 14개를 통과했습니다. 별도 모바일 확인에서도 모집·순찰 후 금고 9,250 G, 병력 60/80, 시설 4개, DEV 닫힘, 문서 폭 412px / 뷰포트 412px, pageerror 없음이 확인되었습니다.

새 캡처 8개를 저장하고 지도·HUD·선택 패널·순찰·웨이브를 시각 검수했습니다. 모바일은 HUD→지도→하단 패널이며 페이지 스크롤로 행동에 접근합니다.

| 화면          | 데스크톱                                               | 모바일                                                |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| 기본 플레이   | [지도](screenshots/fief-gameplay-overview-desktop.png) | [지도](screenshots/fief-gameplay-overview-mobile.png) |
| 순찰          | [순찰](screenshots/fief-patrol-desktop.png)            | [순찰](screenshots/fief-patrol-mobile.png)            |
| 가상 의뢰     | [의뢰](screenshots/fief-contract-desktop.png)          | [의뢰](screenshots/fief-contract-mobile.png)          |
| 몬스터 웨이브 | [웨이브](screenshots/fief-wave-desktop.png)            | [웨이브](screenshots/fief-wave-mobile.png)            |

기존 체크인된 게임·아틀라스·v0.1 영지 캡처는 변경하지 않았습니다. 기존 시나리오의 캡처는 기본적으로 무시되는 test-results에 저장합니다. 명시적으로 이전 참고 이미지를 갱신할 때만 PLAYWRIGHT_UPDATE_REFERENCE_SCREENSHOTS=1을 지정합니다.

검증에서 시작한 5187 서버는 작업 종료 시 자동 종료합니다. 기존 5190 서버는 유지합니다.

## 재현·범위

```powershell
npm test
npm run lint
npm run build
npm run format:check
npm run test:e2e
```

별도 Chromium을 사용할 경우 PLAYWRIGHT_CHROMIUM_EXECUTABLE을 지정합니다. Playwright는 별도 .cache/vite-playwright를 사용합니다. 기존 서버를 검증할 때는 PLAYWRIGHT_EXTERNAL_SERVER=1과 PLAYWRIGHT_BASE_URL을 지정합니다.

PROTOTYPE_CONFIG의 금고·비용·증가율·시간·피해는 모두 임시 검증 수치입니다. 실제 작위 권한·서버 DB·21일 스케줄러·전투·PvP·경제·타 유저 의뢰 매칭·월드 던전·SS 레이드·실기기 GPU 성능은 검증 범위가 아닙니다. 새로고침은 초기 상태로 돌아갑니다.
