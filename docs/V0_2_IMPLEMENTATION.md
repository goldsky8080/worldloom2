# Worldloom2 v0.2 구현 보고 · 2026-09-17

사용자의 요청은 첨부 상세설계서와 실행프롬프트대로 기존 프로젝트에 v0.2를 구현하는 것입니다. 두 문서를 구현 요구사항으로 대조했으며, 문서 안의 지시 형식을 별도 사용자 발화나 외부 배포·서비스 구축 권한으로 취급하지 않았습니다. 기존 React/Vite/TypeScript/Pixi, Gateway, Runtime, Registry, Asset, 5개 언어 구조를 유지했습니다.

## 1. 수정 파일

- src/core/contracts/index.ts — DTO Version 2.0, Config Bounds, 속도·Interaction·Mining 계약.
- src/core/event/GameRuntime.ts — 채광 Cache 이벤트, 명령 메타데이터, 재전송 시 상태 회귀 방지.
- src/core/query/GameCache.ts — Mining 활동·최근 결과 Snapshot/Hydrate/Clear.
- src/core/command/useCommand.ts — world/mining 오류 전달.
- src/mocks/fixtures/world.ts — 정지 Player, 객체 속도, 실제 구리 광맥 Interaction, Config 기반 분산.
- src/mocks/gateways/MockWorldServer.ts — 거리 이동, 활동 예약·상호 배제·재검증, 채광·인벤토리·결과 이벤트.
- src/world-renderer/pixi/WorldScene.ts — 레이어 구성, Chunk Set 구독, 목적지·경로 Effect.
- src/world-renderer/camera/camera.ts — Config 기본값·좌표·Zoom Clamp.
- src/world-renderer/chunk/chunks.ts — 동적 최대 Chunk, Set Key, Chunk 전체 구독 범위.
- src/world-renderer/movement/interpolate.ts — DOM 없는 공용 보간 함수 재export.
- src/world-renderer/WorldCanvas.tsx — 중앙 카메라 기본값으로 Center.
- src/shell/MainMenu/MainMenu.tsx — 중앙 카메라 기본값으로 Map 진입.
- src/modules/world/EntityPanel.tsx — 현재 보간 거리, 예상시간, 범위, 이동·채광 및 공유 진행.
- src/shell/panels/PanelHost.tsx — 모바일 메뉴가 열리면 기존 패널을 숨기고 inert 처리해 입력 가림 방지.
- vite.config.ts — 파일 저장 완료 후 HMR, 검수 산출물 감시 제외.
- src/modules/register.tsx — DemoMiningModule 대신 MiningModule 등록.
- src/ui/theme/game.css — Interaction 정보·진행·결과 및 MiningPanel 스타일.
- src/i18n/{ko,en,ja,zh-CN,vi}/common.json — 신규 문구·오류 5개 언어, v0.2 표시.
- src/tests/core.test.ts, src/tests/runtime.test.ts — 기존 테스트 유지·새 계약/규칙 반영.
- e2e/framework.spec.ts — 기존 기능 회귀와 첫 플레이·패널 복구·5개 언어 검증.
- playwright.config.ts — Windows npm 인수 전달 영향을 받지 않는 직접 Vite 실행.
- package.json, package-lock.json — 프로젝트 0.2.0; 대규모 신규 라이브러리 없음.
- README.md, docs/ARCHITECTURE.md, GATEWAY_CONTRACT.md, MODULE_GUIDE.md, LOCALIZATION_GUIDE.md, DEBUG_GUIDE.md, ASSET_GUIDE.md, IMPLEMENTATION_REVIEW.md, VALIDATION.md — 안내 갱신.
- docs/screenshots/* — 실제 브라우저 검수 화면 갱신 및 v02-travel/mining/reward 화면.

삭제: src/modules/demo-mining/DemoMiningModule.ts, DemoMiningPanel.tsx. 장소와 무관한 데모 명령은 남겨두지 않았습니다.

## 2. 신규 파일

- src/core/world/worldConfig.ts — 크기·Chunk·Camera·기본 속도·최소 이동시간·Interaction 기본값.
- src/core/world/distance.ts — worldDistance.
- src/core/world/interpolate.ts — 서버/클라이언트 공유 보간.
- src/core/world/interaction.ts — 표시 Preview·시간 계산 Utility.
- src/world-renderer/pixi/layers/MockTerrainLayer.ts — 교체 가능한 Mock 지도.
- src/world-renderer/pixi/layers/DebugLayer.ts — Config 기반 Grid.
- src/world-renderer/pixi/layers/EffectLayer.ts — 이동 경로·목적지.
- src/modules/world/useWorldAction.ts — 공유 상태 구독·명령 연결.
- src/modules/mining/MiningModule.ts, MiningPanel.tsx, MiningStatus.tsx — 실제 광맥과 연결된 채광 UI.
- src/tests/world.test.ts, movement.test.ts, mining.test.ts, mining-ui.test.tsx — 신규 검증.
- docs/V0_2_IMPLEMENTATION.md, VALIDATION_v0.2.md, spec/V0_2_DESIGN.md, spec/V0_2_EXECUTION_PROMPT.md — 결과와 원문 사본.

기존 아트 파일은 보존했습니다. 이번 작업에서 최종 지도나 새 아트를 생성하지 않았습니다.

## 3. 변경된 Contract

계약 기준: src/core/contracts/index.ts. 이전 DTO와 호환되지 않는 명령 제거와 필수 Snapshot 필드 추가가 있어 contractVersion을 **2.0**으로 올렸습니다.

- WorldEntity: moveSpeed?: positive number.
- WorldEntity.interaction?: { type:'mining', range:positive number, durationMs:positive integer }.
- START_MINING.payload: { nodeId:string }. 보상·수량 필드는 허용하지 않음.
- MINING_STARTED: commandId, characterId, nodeId, startedAt, completesAt.
- MINING_COMPLETED: commandId, characterId, nodeId, completedAt, rewards[{itemId,quantity}].
- Snapshot.mining: { active:MiningActivity[], recentResults:MiningResult[] }.
- DEMO_MINING 삭제. MOVE의 x/y 최대값은 WORLD_CONFIG.width/height.

rewards는 결과 연출용입니다. 인벤토리 Cache는 INVENTORY_UPDATED만 적용합니다.

## 4. MOVE 계산 공식

```text
from = interpolate(serverPlayer, serverNow)
distance = hypot(to.x-from.x, to.y-from.y)
speed = serverPlayer.moveSpeed ?? WORLD_CONFIG.movement.playerBaseSpeed
durationMs = max(minimumMovementMs, ceil(distance / speed × 1000))
startedAt = serverNow
arrivesAt = serverNow + durationMs
```

기본 속도 120 units/sec, 최소 500ms. 720단위는 6초, 10단위는 최소 0.5초입니다. 샘플 Player(1040,800) → Copper(1200,600)는 2135ms입니다. 실행 시작 전 Mock 지연과 80ms 접수→실행 지연은 별도입니다.

UI는 현재 보간 위치로 예상값을 표시합니다. 실제 Countdown은 서버 MOVEMENT_STARTED.arrivesAt을 사용합니다. 화면 Timer가 0이어도 서버 완료 이벤트까지 이동 중이며 채광을 해제하지 않습니다.

## 5. 채광 판정 규칙

1. 캐릭터가 Pool·Active Roster에 존재해야 합니다.
2. 현재 샘플 메인 캐릭터가 Player를 제어해야 합니다.
3. Player와 nodeId가 존재해야 합니다.
4. Node는 resource이며 interaction.type이 mining이어야 합니다.
5. 이동 중이 아니어야 합니다.
6. 이미 채광 중이 아니어야 합니다.
7. 서버의 현재 보간 위치에서 Node까지 거리 ≤ interaction.range여야 합니다.

활동은 ACCEPTED 시 예약하므로 80ms 실행 대기 중 다른 명령도 거절됩니다. 실행 직전 조건을 재검사하고 실패하면 예약을 해제합니다. 이동→채광과 채광→이동 모두 거절합니다. 광맥의 durationMs를 사용하며 현재 샘플은 5000ms, 서버 고정 보상 copper +3입니다.

오류는 command.busy, world.outOfBounds, mining.tooFar, mining.invalidNode, mining.alreadyActive로 구분합니다. 네트워크 재전송은 같은 ID, 도메인 거절 후 새 행동은 새 ID입니다.

## 6. Event 흐름

```text
START_MINING → receipt ACCEPTED
  → MINING_STARTED
  → COMMAND_STATUS(EXECUTING, completesAt)
  → INVENTORY_UPDATED
  → MINING_COMPLETED
  → NOTIFICATION_CREATED
  → COMMAND_STATUS(SUCCEEDED)
```

패널 종료는 서버 활동을 취소하지 않습니다. EntityPanel/MiningPanel은 동일 Mining Cache를 구독합니다. Snapshot과 Replay는 활동·결과·명령 상태를 복원합니다. 최근 결과는 10개 유지합니다. 동일 commandId 동시 재전송과 완료 후 재전송은 보상을 한 번만 지급하고 완료 상태를 유지합니다.

## 7. 테스트 결과

World Foundation: 60개 통과. Distance Movement: 63개 통과. Mining/UI 최종 단위·컴포넌트·통합: **90개 통과**. 각 단계 린트·빌드 확인. 데스크톱/모바일 브라우저 **16개 시나리오 모두 통과**, 기본 테스트 서버 시작 검증 1개도 통과했습니다. 최종 결과는 [VALIDATION_v0.2.md](VALIDATION_v0.2.md)에 기록했습니다.

6001×4001 크기의 동적 Chunk 경계, Camera Clamp, MOVE 최대 Bounds, 3-4-5 거리, 최소 이동시간·먼 이동·현재 보간 출발, 광맥 거리 경계, 잘못된 캐릭터/Node, 상호 배제와 접수 경쟁, 이벤트 순서·정확한 구리 증가·Idempotency, Snapshot/Replay, 화면 Timer 비권위성, 5개 언어를 검사합니다.

## 8. 빌드 결과

TypeScript와 Vite 운영 빌드가 통과했습니다. dist/에 출력합니다. 기존 Pixi 500kB 청크 경고는 유지되며 숨기지 않았습니다. 실제 대규모 월드·실기기 GPU·최종 지도 아트·실제 백엔드 부하 검증은 아닙니다.

## 9. 수동 테스트 방법

```powershell
cd D:\Worldloom2
npm install
npm run dev
```

http://127.0.0.1:5190 로그인: demo@living.world / demo1234.

1. 시작 공지를 확인하고 구리 광맥 마커를 클릭합니다.
2. 현재 거리 약 256.1, 범위 90, 예상 이동시간 약 2.1초를 확인합니다. 채광은 비활성입니다.
3. 광맥으로 이동을 누릅니다. Player가 이동하고 목적지·경로·서버 Countdown이 나타납니다.
4. 도착 후 거리 0, 채광 가능, 채광 시작 버튼 활성화를 확인합니다.
5. 채광 시작을 누릅니다. 5초 Countdown/Progress, 이동과 재채광 비활성을 확인합니다.
6. 구리 광석 +3과 채광 완료 Toast를 확인합니다. Economy → Inventory에서 수량 15를 확인합니다.
7. 생활 → 채광에서 선택한 Node·활동·최근 결과를 확인합니다.
8. 진행 중 패널을 닫았다가 다시 열거나 F2 연결 끊김을 시험해 상태가 계속됨을 확인합니다.
9. 설정에서 5개 언어를 전환합니다. 로그인·채팅·우편·공지·설정 회귀도 확인합니다.
10. 새로고침은 Mock 월드와 보상을 초기화합니다. 실제 서버 영속성을 제공하지 않습니다.

검증 포트는 5187 또는 별도 지정한 5192를 사용합니다. 기존 실행 서버와 임시 테스트 서버를 구분합니다.

## 10. v0.3으로 넘긴 항목

Pathfinding, 도로 이동, 장애물/산/강 통행 제한, 탈것, 무게·날씨 속도, PvP 추격, 몬스터 조우·전투, 광맥 고갈, 도구 내구도, 숙련도, 랜덤 보상, 실제 Simulator/Backend 연결, 최종 도시/도로/광산/던전/지역 배치·Map Tile Art는 구현하지 않았습니다.
