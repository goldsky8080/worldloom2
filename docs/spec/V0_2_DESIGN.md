# Worldloom2 v0.2 — 월드맵 기반 · 거리 기반 이동 · 채광 첫 플레이 루프 Codex 상세 설계서

- **대상 프로젝트:** `Worldloom2.zip`
- **기준일:** 2026-09-17
- **목표 버전:** v0.2
- **기준:** 현재 구현된 공통 프레임워크를 유지하면서, 처음으로 실제 게임 플레이 흐름을 만든다.

---

# 1. v0.2의 한 문장 목표

이번 버전에서는 아래 흐름이 실제로 플레이 가능해야 한다.

```text
월드맵에서 구리 광맥 선택
        ↓
현재 플레이어와 광맥의 거리 확인
        ↓
광맥까지 이동 명령
        ↓
거리와 이동속도로 도착시간 계산
        ↓
월드맵에서 플레이어가 실제로 이동
        ↓
광맥 도착
        ↓
채광 시작
        ↓
서버 권위형 시간 진행
        ↓
채광 완료
        ↓
구리 광석 인벤토리 증가
        ↓
알림 표시
```

이것이 Worldloom2 최초의 **실제 플레이 루프(First Playable Loop)** 다.

---

# 2. 현재 소스에서 이미 존재하는 기반

현재 Worldloom2에는 다음이 이미 구현되어 있다.

## 월드맵

```text
src/world-renderer/pixi/WorldScene.ts
```

이미 존재:

- PixiJS 렌더링
- 카메라 이동
- 확대 / 축소
- World Entity 표시
- Entity 선택
- Entity 이동 보간
- AOI 화면 판정
- Chunk 디버그
- LOD
- 이동 중 객체 표시

## 카메라

```text
src/world-renderer/camera/camera.ts
```

현재:

```ts
camera = {
  x: 1150,
  y: 780,
  zoom: 0.85
}
```

Zoom 범위:

```text
0.35 ~ 2.4
```

## 현재 Mock 월드 크기

현재 다음 값이 여러 코드에 직접 하드코딩되어 있다.

```text
WIDTH  = 2400
HEIGHT = 1600
```

## 현재 Chunk

```text
src/world-renderer/chunk/chunks.ts
```

현재:

```ts
CHUNK_SIZE = 400
```

하지만 최대 Chunk Index가:

```ts
x <= 5
y <= 3
```

으로 하드코딩되어 있다.

즉 현재 `2400 / 400 = 6`, `1600 / 400 = 4` 구조에 종속되어 있다.

## 이동

현재 이미 존재:

```text
MOVE Command
MOVEMENT_STARTED Event
MOVEMENT_COMPLETED Event
```

클라이언트 이동 보간:

```text
src/world-renderer/movement/interpolate.ts
```

현재 이동은 시간 구간을 기반으로 부드럽게 표시된다.

## 현재 문제

Mock Server의 MOVE 소요시간은 거리에 관계없이:

```text
6초 고정
```

이다.

즉 10m를 이동해도 6초, 1000m를 이동해도 6초인 상태다.

## 채광

현재:

```text
DEMO_MINING Command
```

이 존재하며 4초 뒤:

```text
구리 +3
```

을 지급한다.

하지만 문제는:

- 플레이어 위치를 확인하지 않는다.
- 광맥까지 이동하지 않아도 채광 가능하다.
- 광맥과의 거리를 확인하지 않는다.
- 이동 중에도 채광 가능하다.
- 특정 Resource Node와 실제 플레이가 연결되어 있지 않다.

v0.2에서는 이것을 실제 플레이 루프로 바꾼다.

---

# 3. v0.2 개발 범위

이번 버전은 크게 세 부분이다.

```text
v0.2A
World Map Foundation
월드맵 기반 정리

v0.2B
Real Movement
거리 기반 실제 이동

v0.2C
Real Mining Loop
이동과 연결된 실제 채광
```

각 단계가 완료될 때마다 테스트와 빌드를 통과한 뒤 다음 단계로 진행한다.

---

# 4. v0.2A — World Map Foundation

## 4.1 월드 크기 하드코딩 제거

현재 다음 숫자를 직접 쓰는 코드가 존재한다.

```text
2400
1600
```

반드시 중앙 설정으로 이동한다.

권장 신규 파일:

```text
src/core/world/worldConfig.ts
```

예:

```ts
export const WORLD_CONFIG = {
  width: 2400,
  height: 1600,
  chunkSize: 400,

  camera: {
    defaultX: 1150,
    defaultY: 780,
    defaultZoom: 0.85,
    minZoom: 0.35,
    maxZoom: 2.4,
  },

  movement: {
    playerBaseSpeed: 120,
  },

  interaction: {
    defaultRange: 90,
  },
} as const;
```

중요:

**이번 버전에서는 실제 월드 크기를 무작정 크게 늘리지 않는다.**

먼저 현재 `2400 × 1600`을 유지하면서 하드코딩을 완전히 제거한다.

이후:

```ts
width: 6000,
height: 4000
```

처럼 한 곳만 수정하여 확장 가능해야 한다.

---

# 5. 반드시 WORLD_CONFIG를 사용해야 하는 위치

## WorldScene.ts

현재:

```ts
.rect(0, 0, 2400, 1600)
```

변경:

```ts
.rect(0, 0, WORLD_CONFIG.width, WORLD_CONFIG.height)
```

Grid:

```text
2400 / 1600 하드코딩 제거
```

Camera Clamp:

```text
Math.min(2400 ...)
Math.min(1600 ...)
```

전부 WORLD_CONFIG 사용.

---

# 6. Camera 설정 중앙화

현재:

```text
src/world-renderer/camera/camera.ts
```

에서 직접:

```ts
{ x: 1150, y: 780, zoom: 0.85 }
```

사용.

변경:

```ts
export const camera = new Atom<CameraState>({
  x: WORLD_CONFIG.camera.defaultX,
  y: WORLD_CONFIG.camera.defaultY,
  zoom: WORLD_CONFIG.camera.defaultZoom,
});
```

`clampZoom()`도:

```ts
WORLD_CONFIG.camera.minZoom
WORLD_CONFIG.camera.maxZoom
```

사용.

---

# 7. WorldCanvas Center 버튼 수정

현재:

```text
src/world-renderer/WorldCanvas.tsx
```

에서 Center 버튼에 다시:

```ts
{ x: 1150, y: 780, zoom: 0.85 }
```

가 하드코딩되어 있다.

반드시 중앙 설정 사용.

---

# 8. Command Schema의 월드 크기 하드코딩 제거

현재:

```text
src/core/contracts/index.ts
```

MOVE:

```ts
x: z.number().min(0).max(2400)
y: z.number().min(0).max(1600)
```

이를:

```ts
.max(WORLD_CONFIG.width)
.max(WORLD_CONFIG.height)
```

로 변경.

중요:

계약 코드가 UI 코드에 의존하면 안 된다.

따라서 `WORLD_CONFIG`는 `world-renderer` 아래가 아니라:

```text
src/core/world/
```

에 둔다.

---

# 9. Chunk 하드코딩 제거

현재:

```text
src/world-renderer/chunk/chunks.ts
```

에:

```ts
Math.min(5, ...)
Math.min(3, ...)
```

가 존재한다.

이를 제거한다.

계산:

```ts
const maxChunkX =
  Math.ceil(WORLD_CONFIG.width / WORLD_CONFIG.chunkSize) - 1;

const maxChunkY =
  Math.ceil(WORLD_CONFIG.height / WORLD_CONFIG.chunkSize) - 1;
```

`CHUNK_SIZE`도 가능하면:

```ts
WORLD_CONFIG.chunkSize
```

를 기준으로 한다.

향후 월드 크기와 Chunk 크기가 달라져도 자동 계산되어야 한다.

---

# 10. Mock Terrain을 최종 지도와 분리

현재 `WorldScene.drawTerrain()`에 다음이 모두 들어 있다.

```text
바닥
숲 타원
강
도로
나무
지역 사각형
지역 텍스트
Grid
```

지금은 Mock 지도이므로 유지할 수 있다.

하지만 앞으로 실제 Map Tile을 넣기 위해 분리한다.

권장 구조:

```text
src/world-renderer/pixi/
├ WorldScene.ts
└ layers/
   ├ MockTerrainLayer.ts
   ├ EntityLayer.ts
   ├ EffectLayer.ts
   └ DebugLayer.ts
```

단, v0.2에서 과도하게 복잡하게 쪼갤 필요는 없다.

최소한:

```text
Terrain
Entity
Debug
```

책임은 분리한다.

목표:

> 향후 MockTerrainLayer만 제거하고 실제 MapTileLayer로 교체 가능해야 한다.

---

# 11. Renderer Layer 순서

권장 PixiJS Container 구조:

```text
WorldRoot
│
├ TerrainLayer
│  ├ Land
│  ├ Forest
│  ├ Water
│  ├ Road
│  └ Location
│
├ EntityLayer
│  ├ Player
│  ├ Monster
│  ├ Resource
│  ├ NPC
│  └ Transport
│
├ EffectLayer
│  ├ Selection
│  ├ Destination
│  └ MovementRoute
│
└ DebugLayer
   ├ ChunkGrid
   └ AOI
```

향후 실제 Map Tile이 들어와도 Entity 로직을 건드리지 않게 한다.

---

# 12. AOI 개선

현재 `WorldScene.tick()`에서 카메라 좌표가 변하면 약 120ms 단위로:

```ts
realtimeGateway.subscribeArea(area)
```

를 호출한다.

v0.2에서는 가능하면 카메라의 **픽셀 단위 변화가 아니라 Chunk Set 변화**를 기준으로 Area Subscription을 갱신한다.

예:

```text
현재 Visible Chunk
1:1
1:2
2:1
2:2
```

카메라가 조금 움직였지만 Chunk가 그대로라면 재구독 불필요.

Chunk가 바뀔 때만 재구독.

최소 구현이 부담스러우면 현재 방식 유지 가능하지만,
`visibleChunks(area)` 기반 Key를 우선 권장한다.

---

# 13. v0.2B — 거리 기반 이동

현재 Mock Server:

```text
MOVE = 항상 6000ms
```

이를 폐기한다.

---

# 14. WorldEntity에 이동속도 추가

현재 Entity Contract:

```ts
id
type
x
y
displayNameKey
markerAssetId
movement?
status?
```

v0.2에서는 다음을 추가한다.

```ts
moveSpeed?: number
```

예:

```text
Player     120
Monster     90
Transport   65
NPC         80
Party      105
```

Resource는 움직이지 않으므로 없어도 된다.

중요:

Client가 최종 이동시간을 결정하는 것이 아니다.

`moveSpeed`는:

- 화면 예상시간 표시
- UI 정보 표시

용으로 사용할 수 있지만,

**실제 arrivesAt은 Mock Server / 실제 Backend가 결정한다.**

---

# 15. 이동 거리 계산 Utility

신규 권장:

```text
src/core/world/distance.ts
```

```ts
export function worldDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
```

테스트 필수.

---

# 16. MOVE 처리 방식

사용자가 Resource Node를 클릭하고 이동 버튼 선택:

```text
MOVE
{
  entityId: "player-1",
  x: resource.x,
  y: resource.y
}
```

Mock Server:

```text
현재 실제 위치 계산
↓
목표 위치와 거리 계산
↓
Player moveSpeed 확인
↓
duration = distance / speed
↓
arrivesAt 계산
↓
MOVEMENT_STARTED
```

예:

```text
거리 = 720
속도 = 120 units/sec

이동시간 = 6초
```

10단위 거리라면 6초가 아니라 약 0.08초가 된다.

다만 UX를 위해 최소 이동시간을 설정해도 된다.

권장:

```text
minimumMovementMs = 500
```

---

# 17. 현재 위치는 interpolate 결과 사용

이미 현재 Mock Server는 MOVE 시작 전:

```ts
const from = interpolate(entity, Date.now());
```

를 사용한다.

이 방식은 유지한다.

즉 이동 중 새로운 위치 계산 시:

```text
기존 출발 위치
```

가 아니라

```text
현재 보간 위치
```

를 기준으로 한다.

---

# 18. 동시에 두 개 MOVE 금지

현재 이미:

```text
movingCommands
```

를 통해 같은 Entity 이동 중 중복 MOVE를 막는다.

유지한다.

향후에는 경로 변경 명령을 별도로 설계할 수 있지만 v0.2 범위 아님.

---

# 19. 이동 화면 표시

Resource / Monster / NPC를 선택한 Entity Panel에서:

```text
현재 거리
예상 이동시간
```

을 표시한다.

예:

```text
구리 광맥

거리
742

예상 이동시간
6.2초

[이동]
```

다국어 Key를 사용한다.

예:

```text
world.distance
world.estimatedTravelTime
world.units
```

---

# 20. 도착시간의 권위

중요:

화면에서 표시하는 이동 예상시간과 실제 도착은 분리한다.

```text
Client 예상값
≈ distance / speed

Server 실제값
= MOVEMENT_STARTED.arrivesAt
```

MOVE가 ACCEPTED되고 MOVEMENT_STARTED를 받으면
화면에서는 서버의 `arrivesAt`을 기준으로 Countdown을 표시한다.

---

# 21. Destination Marker

v0.2에서 권장:

플레이어가 이동 중이라면 목적지에 작은 Marker를 표시한다.

현재 별도 이미지가 없으므로:

- Pixi Graphics
또는
- Placeholder marker

로 구현 가능.

최종 아트는 나중에 교체한다.

---

# 22. Movement Route 표시

선택 사항이지만 권장.

플레이어 이동 중:

```text
현재 위치 ---------- 목적지
```

얇은 선을 EffectLayer에 표시한다.

지금은 직선 이동이므로 직선이면 충분하다.

향후 Road / Pathfinding 단계에서 교체 가능.

---

# 23. v0.2C — 실제 채광 루프

현재:

```text
DEMO_MINING
```

을 실제 게임 Command로 승격한다.

권장 이름:

```text
START_MINING
```

`DEMO_MINING`은 테스트 호환이 필요 없다면 제거한다.

---

# 24. Resource Entity의 Interaction 정보

Resource Node가 단순 그림이 아니라 상호작용 가능한 객체임을 표현한다.

Entity Schema에 범용 Interaction을 추가하는 방식을 권장한다.

예:

```ts
interaction: z
  .object({
    type: z.enum(['mining']),
    range: z.number().positive(),
    durationMs: z.number().int().positive(),
  })
  .optional()
```

향후:

```text
gathering
harvest
open
enter
talk
```

등으로 확장 가능.

현재 구리 광맥:

```ts
interaction: {
  type: 'mining',
  range: 90,
  durationMs: 5000,
}
```

---

# 25. Resource Node Fixture

현재:

```text
resource-1
resource-2
```

에 실제 interaction 정보를 추가한다.

예:

```ts
{
  id: 'resource-1',
  type: 'resource',
  x: 1200,
  y: 600,

  displayNameKey: 'world.copperVein',
  markerAssetId: 'framework.marker.resource',

  interaction: {
    type: 'mining',
    range: 90,
    durationMs: 5000,
  },
}
```

---

# 26. START_MINING Command

권장:

```ts
{
  commandType: 'START_MINING',
  payload: {
    nodeId: string
  }
}
```

Client는:

```text
보상 수량
성공 여부
최종 아이템
```

을 보내지 않는다.

서버가 결정한다.

---

# 27. 채광 실행 조건

Mock Server에서 반드시 검증:

1. Character가 존재하는가
2. nodeId가 존재하는가
3. Entity type이 resource인가
4. interaction.type이 mining인가
5. Player가 이동 중이 아닌가
6. 이미 채광 중이 아닌가
7. Player와 Resource 거리 <= interaction.range 인가

하나라도 실패하면 Command FAILED.

---

# 28. 이동과 채광은 동시에 불가능

현재 테스트 코드에는 이동과 채광을 동시에 허용하는 시나리오가 존재한다.

실제 게임 루프로 바꾸면서 이 규칙을 변경한다.

v0.2 기준:

```text
이동 중 → 채광 시작 불가
채광 중 → 이동 시작 불가
```

이유:

```text
이동
↓
도착
↓
행동
```

이라는 실제 게임 의미를 만들기 위해서다.

Mock Server에 Active Activity 상태를 둔다.

예:

```ts
private activeActivity = new Map<string, {
  type: 'moving' | 'mining';
  commandId: string;
}>();
```

또는 이동 상태와 채광 상태를 별도 Map으로 관리해도 된다.

---

# 29. START_MINING Event 흐름

권장 Event:

```text
MINING_STARTED
MINING_COMPLETED
```

## MINING_STARTED

예:

```ts
{
  characterId: string,
  nodeId: string,
  startedAt: string,
  completesAt: string
}
```

## MINING_COMPLETED

예:

```ts
{
  characterId: string,
  nodeId: string,
  rewards: [
    {
      itemId: 'copper',
      quantity: 3
    }
  ]
}
```

그리고 서버가 별도로:

```text
INVENTORY_UPDATED
```

를 발행한다.

Frontend는 `MINING_COMPLETED.rewards`로 결과 연출,
실제 인벤토리는 `INVENTORY_UPDATED`를 기준으로 한다.

---

# 30. 채광 UI 흐름

Resource Entity 선택 시 Entity Panel:

## 멀리 있는 경우

```text
구리 광맥

거리: 430
채광 가능 거리: 90

[광맥으로 이동]
```

채광 버튼:

```text
Disabled
```

또는 표시하지 않는다.

## 도착 후

```text
구리 광맥

거리: 12
채광 가능

[채광 시작]
```

## 채광 중

```text
채광 중...

00:04

██████████ 38%
```

## 완료

```text
채광 완료

구리 광석 +3
```

Notification 표시.

---

# 31. 기존 DemoMiningPanel 처리

현재:

```text
src/modules/demo-mining/
```

이 존재한다.

v0.2에서는 이름을 실제 구조로 변경 권장:

```text
src/modules/mining/
├ MiningModule.ts
└ MiningPanel.tsx
```

메뉴:

```text
생활
└ 채광
```

은 유지한다.

단 Mining Panel은 더 이상 아무 장소에서나 버튼 한 번으로 채광하는 화면이 아니다.

Mining Panel 역할:

- 선택한 광맥 정보
- 현재 채광 상태
- 진행시간
- 최근 결과
- 필요하면 인벤토리 구리 수량

---

# 32. EntityPanel과 MiningPanel 역할

권장:

## EntityPanel

World Map에서 객체 선택 시:

- 객체 정보
- 거리
- 상태
- 이동 버튼
- 가능한 Interaction Action

## MiningPanel

채광의 상세 상태:

- 광맥
- 진행도
- 완료 시간
- 결과

EntityPanel에서 `[채광 시작]`을 눌렀을 때 MiningPanel을 열어도 된다.

하지만 v0.2에서는 복잡성을 줄이기 위해 EntityPanel 안에서 진행도를 보여줘도 된다.

중요한 것은 도메인 로직을 Panel에 넣지 않는 것이다.

---

# 33. Player 현재 위치

Player Entity 위치는 항상 World State를 기준으로 한다.

이동 중이라면 화면상 위치는:

```ts
interpolate(player, now)
```

를 사용.

채광 거리 검증은 서버도 현재 interpolate 위치를 기준으로 계산한다.

---

# 34. 광맥 클릭 → 이동 → 채광 UX

최종 UX 예:

```text
① 구리 광맥 클릭

[구리 광맥]
거리: 480

[이동]
```

```text
② 이동 클릭

이동 중
도착까지 00:04
```

월드맵:

```text
Player ----------> Copper Vein
```

```text
③ 도착

구리 광맥
채광 가능

[채광 시작]
```

```text
④ 채광

채광 중
00:05
██████████
```

```text
⑤ 완료

구리 광석 +3

인벤토리 12 → 15
```

이 전체가 페이지 새로고침 없이 작동해야 한다.

---

# 35. 오류 Key 세분화

현재 많은 실패가:

```text
command.rejected
```

하나로 처리된다.

v0.2부터 최소한 다음 오류를 구분하는 것을 권장한다.

```text
command.busy
world.outOfBounds
mining.tooFar
mining.invalidNode
mining.alreadyActive
```

5개 언어에 모두 Key 추가.

---

# 36. 다국어 추가

5개 언어:

```text
ko
en
ja
zh-CN
vi
```

필요 Key 예:

```text
world.distance
world.travelTime
world.arrivesIn
world.moveTo
world.destination

mining.available
mining.outOfRange
mining.moveToNode
mining.start
mining.progress
mining.completed
mining.reward
mining.copperVein
```

모든 UI 문구는 Key 기반.

---

# 37. 테스트 — World Config

추가 테스트:

```text
WORLD_CONFIG bounds
Chunk count
Chunk edge
Camera clamp
MOVE contract max bounds
```

특히 WORLD 크기를 테스트에서 임의로 바꾸지는 않아도 되지만,
Chunk 계산이 하드코딩 5 / 3에 의존하지 않는지 검증한다.

---

# 38. 테스트 — 거리 기반 이동

필수:

```text
distance(0,0 → 3,4) = 5
```

MOVE:

```text
가까운 목적지
→ 짧은 이동 시간

먼 목적지
→ 긴 이동 시간
```

`MOVEMENT_STARTED.arrivesAt`이 거리와 speed 기준인지 검증.

---

# 39. 테스트 — 채광 거리 제한

필수 테스트:

```text
광맥에서 멀리 있음
→ START_MINING FAILED
```

```text
광맥 Interaction Range 안
→ START_MINING ACCEPTED
```

---

# 40. 테스트 — 이동/채광 상호 배제

필수:

```text
MOVE 실행 중
→ START_MINING FAILED
```

```text
START_MINING 실행 중
→ MOVE FAILED
```

---

# 41. 테스트 — 채광 완료

```text
START_MINING
↓
MINING_STARTED
↓
COMMAND EXECUTING
↓
INVENTORY_UPDATED
↓
MINING_COMPLETED
↓
COMMAND SUCCEEDED
```

구리 수량이 정확히 증가해야 한다.

중복 commandId 재전송 시 보상이 두 번 지급되면 안 된다.

---

# 42. 현재 테스트 수정

현재 테스트에는:

```text
allows mining and travel together
```

라는 의미의 테스트가 존재한다.

v0.2 게임 규칙과 맞지 않으므로 수정한다.

새 테스트 의미:

```text
prevents mining while traveling
and prevents travel while mining
```

---

# 43. 월드맵 최종 아트는 아직 만들지 않는다

중요.

현재 MockTerrain은 최종 지도가 아니다.

이번 v0.2에서는:

- World Coordinate
- Chunk
- Camera
- Movement
- Interaction

을 먼저 안정화한다.

아직 하지 않는다:

```text
최종 도시 배치
최종 도로망
최종 광산 위치
최종 던전 위치
최종 지역 경계
최종 Map Tile Art
```

이유:

게임 규칙이 확정되기 전에 지도를 최종 그림으로 만들면 다시 그릴 가능성이 높다.

---

# 44. 향후 실제 지도 구조

v0.2에서는 인터페이스만 고려.

향후:

```text
World
├ Region
│  ├ Chunk
│  │  ├ Terrain Tile
│  │  ├ Location
│  │  └ Entity
```

Map Renderer:

```text
Terrain Layer
Water Layer
Road Layer
Location Layer
Entity Layer
Effect Layer
Debug Layer
```

실제 아트는 Tile/Region 방식으로 교체 예정.

---

# 45. 이번 버전에서 하지 않을 것

- Pathfinding
- 실제 도로 따라가기
- 이동 장애물
- 산/강 통과 제한
- 탈것
- 적재 중량
- 날씨 이동속도
- PvP 추격
- 전투
- 몬스터 조우
- 광맥 고갈
- 도구 내구도
- 채광 숙련도
- 랜덤 채광 보상
- 실제 Simulator 연결

이들은 v0.3 이후.

---

# 46. 현재 파일별 예상 수정 목록

## 신규

```text
src/core/world/worldConfig.ts
src/core/world/distance.ts
```

선택:

```text
src/world-renderer/pixi/layers/MockTerrainLayer.ts
```

## 수정

```text
src/world-renderer/pixi/WorldScene.ts
src/world-renderer/camera/camera.ts
src/world-renderer/chunk/chunks.ts
src/world-renderer/WorldCanvas.tsx

src/core/contracts/index.ts

src/mocks/fixtures/world.ts
src/mocks/gateways/MockWorldServer.ts

src/modules/world/EntityPanel.tsx

src/modules/demo-mining/*
→ src/modules/mining/* 권장

src/modules/register.tsx

src/i18n/ko/common.json
src/i18n/en/common.json
src/i18n/ja/common.json
src/i18n/zh-CN/common.json
src/i18n/vi/common.json

src/tests/*
```

---

# 47. 권장 개발 순서

## STEP 1

World Config 중앙화.

완료 후:

```bash
npm run lint
npm test
npm run build
```

## STEP 2

Chunk / Camera / Command Bounds 하드코딩 제거.

테스트.

## STEP 3

Mock Terrain Layer 분리.

화면이 기존과 동일하게 보이는지 확인.

## STEP 4

WorldEntity moveSpeed 추가.

Mock Fixture 적용.

## STEP 5

MOVE를 거리 기반 duration으로 변경.

## STEP 6

Entity Panel에 거리 / 예상시간 표시.

## STEP 7

Resource Interaction Contract 추가.

## STEP 8

DEMO_MINING → START_MINING 전환.

## STEP 9

거리 검증 + 이동/채광 상호 배제.

## STEP 10

Mining Started / Completed Event.

## STEP 11

실제 UI:

```text
선택
→ 이동
→ 도착
→ 채광
→ 보상
```

검증.

## STEP 12

5개 언어 / 테스트 / 문서 업데이트.

---

# 48. v0.2 완료 정의

다음이 모두 되어야 완료다.

- `2400`, `1600` 월드 크기 하드코딩이 핵심 로직에서 사라짐
- Chunk 수가 World Config로 자동 계산됨
- 카메라가 World Config Bounds를 따름
- 월드 크기 변경이 한 파일에서 가능
- Player에 moveSpeed 존재
- MOVE 시간이 실제 거리에 따라 달라짐
- MOVEMENT_STARTED arrivesAt은 Server가 결정
- 월드맵 이동은 interpolate로 부드럽게 보임
- Resource Node에 Interaction Range 존재
- 멀리서 채광 불가능
- 광맥까지 이동 후 채광 가능
- 이동 중 채광 불가능
- 채광 중 이동 불가능
- 채광 완료 후 구리 광석 증가
- 이벤트 / 인벤토리 / 알림이 정상 반영
- 동일 Command 재전송 시 이중 보상 없음
- 5개 언어 깨짐 없음
- 기존 로그인/채팅/우편/공지/설정 기능 회귀 없음
- lint / test / build 모두 성공

---

# 49. 실제 플레이 검수 시나리오

## Scenario A

1. 게임 로그인
2. 월드맵 진입
3. `구리 광맥` 클릭
4. 광맥 정보 Panel 표시
5. 현재 거리 표시
6. `[광맥으로 이동]`
7. Player Marker가 이동
8. 도착시간 Countdown
9. 광맥 도착
10. `[채광 시작]`
11. 진행바 표시
12. 완료
13. `구리 광석 +3`
14. 인벤토리 수량 증가
15. 채광 완료 Notification

이 시나리오가 자연스럽게 이어져야 한다.

---

# 50. 이 버전의 의미

v0.1은:

> 게임처럼 보이는 공통 프레임워크

였다.

v0.2는:

> **월드 위에서 실제 행동 하나가 시작해서 결과까지 이어지는 최초의 게임**

이어야 한다.

이번 버전부터 Worldloom2는 단순 UI Demo가 아니라
실제 게임 플레이 시스템으로 넘어간다.
