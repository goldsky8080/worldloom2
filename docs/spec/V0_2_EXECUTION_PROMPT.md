# Worldloom2 v0.2 Codex 실행 프롬프트

현재 기준 소스는 `Worldloom2` 프로젝트다.

먼저 반드시 아래 문서를 읽어라.

`Worldloom2_v0.2_월드맵기반_거리이동_채광_첫플레이루프_Codex_상세설계서_2026-09-17.md`

이번 작업은 기존 Framework를 다시 만드는 작업이 아니다.

현재 구현되어 있는:

- React + Vite + TypeScript
- PixiJS World Map
- Gateway
- Command / Event
- Runtime Validation
- MockWorldServer
- Movement Interpolation
- AOI
- Chunk
- Module Registry
- Localization
- Asset System

구조를 유지하면서 **첫 실제 플레이 루프**를 만드는 작업이다.

## 최종 플레이 흐름

```text
구리 광맥 선택
↓
거리 확인
↓
광맥으로 이동
↓
거리 / 속도 기반 도착시간
↓
플레이어 Marker 실제 이동
↓
도착
↓
채광 시작
↓
서버 권위형 채광 진행
↓
채광 완료
↓
구리 광석 증가
↓
Notification
```

## 특히 먼저 고칠 것

현재 소스의 다음 하드코딩을 제거한다.

```text
World Width = 2400
World Height = 1600

Chunk max x = 5
Chunk max y = 3

MOVE duration = 6000ms fixed
DEMO_MINING = anywhere available
```

## 핵심 구현 원칙

1. `src/core/world/worldConfig.ts`를 만들고 월드 크기/Chunk/Camera 기본값을 중앙화한다.
2. WorldScene / Camera / Chunk / MOVE Contract가 이 Config를 사용한다.
3. WorldEntity에 `moveSpeed`를 추가한다.
4. MOVE duration은 현재 위치와 목적지 거리 / speed로 Mock Server가 결정한다.
5. Client는 실제 도착시간을 결정하지 않는다.
6. `DEMO_MINING`은 실제 `START_MINING` 흐름으로 승격한다.
7. Resource Node에 Interaction Range와 Duration 정보를 추가한다.
8. 광맥에서 멀리 있으면 채광을 거부한다.
9. 이동 중 채광 금지.
10. 채광 중 이동 금지.
11. `MINING_STARTED`, `MINING_COMPLETED` Event를 추가한다.
12. 채광 완료 시 Server가 Inventory를 갱신한다.
13. 중복 commandId로 이중 보상되지 않아야 한다.
14. 5개 언어를 모두 유지한다.
15. 기존 공통 Framework 기능을 깨뜨리지 않는다.

## 지도

현재 `WorldScene.drawTerrain()`은 최종 지도가 아니라 Mock Terrain이다.

최종 지도 이미지를 만들지 말고,
향후 Tile Renderer로 교체하기 쉽게 최소한 Terrain / Entity / Debug 책임을 분리한다.

과도한 리팩터링은 금지한다.

## UI

Resource Entity를 클릭했을 때 최소한 다음 정보가 보여야 한다.

```text
구리 광맥
거리
채광 가능 거리
예상 이동시간
```

멀리 있으면:

```text
[광맥으로 이동]
```

도착하면:

```text
[채광 시작]
```

채광 중:

```text
Countdown
Progress
```

완료:

```text
구리 광석 +3
```

## 테스트

기존 테스트를 유지하면서 다음을 반드시 추가한다.

- distance 계산
- dynamic chunk bounds
- MOVE 거리에 따른 duration
- 광맥 멀리서 START_MINING 실패
- 범위 내 START_MINING 성공
- 이동 중 채광 실패
- 채광 중 이동 실패
- 채광 완료 구리 증가
- idempotency 유지

기존의 “이동과 채광 동시 허용” 테스트는 새 규칙에 맞게 수정한다.

## 작업 방식

다음 순서로 진행하고 각 단계마다 깨짐 여부를 확인한다.

```text
World Config
→ Camera / Chunk / Contract
→ Terrain 책임 분리
→ moveSpeed
→ 거리 기반 MOVE
→ Resource Interaction
→ START_MINING
→ Mining Events
→ UI 연결
→ Localization
→ Tests
```

각 주요 단계 후:

```bash
npm run lint
npm test
npm run build
```

최종 작업 완료 후 반드시 다음을 보고한다.

1. 수정 파일 목록
2. 신규 파일 목록
3. 변경된 Contract
4. MOVE 계산 공식
5. 채광 판정 규칙
6. Event 흐름
7. 테스트 결과
8. 빌드 결과
9. 실제 수동 테스트 방법
10. v0.3으로 넘길 항목

설계서와 현재 실제 소스를 기준으로 구현하고,
새로운 대규모 라이브러리나 Microservice는 도입하지 마라.
