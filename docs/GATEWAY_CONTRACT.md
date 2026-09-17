# Gateway / Command / Event 계약

## 실제 연결 위치

src/app/bootstrap/services.ts가 Gateway 주입 지점입니다. v0.2는 MockAuthGateway, MockGameGateway, MockRealtimeGateway, MockSocialGateway만 사용합니다. core/gateway/interfaces.ts의 동일 Interface를 구현한 서버 어댑터로 교체하세요.

HttpGameGateway(baseUrl)는 GET /game/snapshot, POST /game/commands를 호출하고 결과를 Zod로 검증합니다. cookie 기반 credentials:include를 사용합니다. RealAuthGateway·RealSocialGateway·WebSocketRealtimeGateway는 미구현 오류를 반환하는 명시적 Skeleton이며 실제 백엔드가 준비되기 전에 실서비스 모드로 선택할 수 없습니다.

FastAPI·PostgreSQL·Redis·Simulator는 이번 프로젝트에 구현하지 않았습니다. Simulator와의 변환은 서버 Application Facade가 책임지고, 클라이언트는 DTO만 알아야 합니다.

## Envelope

```json
{
  "contractVersion": "2.0",
  "commandId": "UUID",
  "commandType": "START_MINING",
  "characterId": "character-1",
  "requestedAt": "UTC ISO datetime",
  "payload": { "nodeId": "resource-1" }
}
```

```json
{
  "contractVersion": "2.0",
  "eventId": "UUID",
  "eventType": "INVENTORY_UPDATED",
  "sequence": 12,
  "occurredAt": "UTC ISO datetime",
  "payload": { "gold": 1250, "items": [] }
}
```

계약의 단일 기준은 src/core/contracts/index.ts입니다. TypeScript 타입은 Zod에서 유도하며 React·Pixi·DOM 전용 타입을 섞지 않습니다. 버전·UUID·Sequence·시각·이벤트별 Payload·좌표 범위·캐릭터 회원 관계를 검증합니다.

## 명령과 권위

현재 명령은 START_MINING, MOVE, MAIL_CLAIM, MAIL_CLAIM_ALL입니다. createCommand는 매 새 요청에 UUID를 부여합니다. 네트워크 재시도는 같은 명령 객체와 ID를 재사용합니다. 서버는 같은 ID의 동시 요청·재전송을 한 번만 실행하고 같은 ID의 다른 Payload는 거부합니다. 서로 다른 ID로 같은 우편을 요청해도 claimed 상태를 서버가 확인하므로 보상은 한 번만 지급합니다.

ACCEPTED는 완료가 아닙니다. UI는 REQUESTED → ACCEPTED → EXECUTING → SUCCEEDED/FAILED를 구독하고 보상은 INVENTORY_UPDATED 이후만 표시합니다. 구매·전투 공식 등 최종 콘텐츠를 Mock 규칙으로 고정하지 않습니다.

실서버는 인증 계정과 characterId의 소유권 검사, 트랜잭션, 영속 Idempotency 저장소, Rate Limit 등을 구현해야 합니다. Mock은 구조 시험용으로 탭 메모리에서 상태를 유지합니다.

## Snapshot과 Replay

Snapshot은 contractVersion, sequence, serverTime, commandStatuses, mining.active, mining.recentResults와 월드·캐릭터·아이템·소셜 초기 데이터를 제공합니다. 실서버에서는 각각 별도 Endpoint/Query로 분리할 수 있습니다.

Realtime.connect(lastSequence, onEvent, onState)는 Replay와 replayAvailable을 반환합니다. 구독을 먼저 잡고 스냅샷/Replay 진행 중 이벤트는 버퍼링해야 합니다. Replay가 없으면 새 Snapshot으로 복구합니다. 마지막 Sequence를 넘지 않은 이벤트는 재적용하지 않습니다.

Mock은 최근 이벤트 120개를 보관합니다. subscribeArea는 월드 중심·Chunk Set 전체를 덮는 범위·Zoom 정보를 받습니다. Chunk Set이 같으면 미세한 카메라 이동으로 재구독하지 않습니다. 실서버는 이에 맞는 공간 구독/Chunk 전송을 구현할 수 있습니다.

소셜 쓰기 readMail/deleteMail/sendChat도 Gateway가 담당하며 결과 이벤트를 통해 캐시에 반영합니다. 사용자 메시지는 React의 텍스트 렌더링으로 처리해 HTML을 실행하지 않습니다.

## v0.2 계약 변경

Contract Version은 **2.0**입니다. `DEMO_MINING` 제거와 필수 Snapshot mining 필드가 이전 서버와 호환되지 않으므로 구버전 DTO를 허용하지 않습니다. 상세 기준은 core/contracts/index.ts입니다.

- WorldEntity: `moveSpeed?: positive number`, `interaction?: {type:'mining',range:positive number,durationMs:positive integer}`.
- START_MINING: `{nodeId}`만 전송합니다. 추가 보상 필드는 계약에서 거부합니다.
- MINING_STARTED: commandId, characterId, nodeId, startedAt, completesAt.
- MINING_COMPLETED: commandId, characterId, nodeId, completedAt, rewards[{itemId,quantity}].
- Snapshot.mining: active와 recentResults. 연결 복구에서도 진행·결과를 복원합니다.

이동 공식: `max(500, ceil(distance / speed × 1000)) ms`. 현재 보간 위치와 서버 Entity 속도를 사용해 arrivesAt을 결정합니다. UI의 예상시간은 참고값이고 실제 Countdown은 서버 시각을 사용합니다.

채광은 유효한 메인 캐릭터·플레이어·채광 Resource, 정지 상태, 기존 채광 없음, 거리 ≤ range를 모두 검사합니다. ACCEPTED 시 활동을 예약하고 EXECUTING 직전에 재검사합니다. 동일 플레이어의 이동과 채광은 상호 배타적입니다.

이벤트: MINING_STARTED → COMMAND_STATUS(EXECUTING) → INVENTORY_UPDATED → MINING_COMPLETED → NOTIFICATION_CREATED → COMMAND_STATUS(SUCCEEDED). rewards는 연출용이고 실제 인벤토리는 INVENTORY_UPDATED로만 바꿉니다. Countdown이 0이 되어도 클라이언트에서 결과를 만들지 않습니다.

네트워크 재시도는 같은 ID를 사용합니다. 거리·busy 등의 도메인 거절은 상태를 해결한 뒤 **새 ID의 새 명령**을 보냅니다. 거절된 ID도 Idempotency 캐시에 남습니다.
