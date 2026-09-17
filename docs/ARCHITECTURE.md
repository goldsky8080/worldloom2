# 아키텍처

## 계층과 책임

React는 화면 셸·HUD·메뉴·패널·소셜 UI를 담당하고 PixiJS는 지도·월드 객체·이동 보간을 담당합니다. Simulator 내부 클래스는 어디에서도 참조하지 않습니다.

```text
입력 → createCommand → GameRuntime.send → GameGateway
                                      ↓
                              MockWorldServer / Future FastAPI
                                      ↓
                              Event / Snapshot (Zod 검증)
                                      ↓
                       GameRuntime → 분리된 GameCache → 구독 UI

Camera / PanelManager / ChatUi / SelectedEntity → UI 전용 Atom
```

## 상태 분리

GameCache의 각 자원은 별도 Atom입니다. 월드 이벤트는 world만, 아이템 이벤트는 inventory만, 소셜 이벤트는 해당 자원만 갱신합니다. 이 Query Cache는 프레임워크 v0.1을 위한 작은 구독형 구현이며 TanStack Query로 교체할 수 있습니다. 단일 거대 Global Store에 서버 상태를 몰아넣지 않습니다.

캐릭터 풀은 가변 길이이며 activeRoster 최대 5명, mainParty 최대 3명입니다. 계약 검증으로 중복 ID·풀 밖 캐릭터·로스터 밖 파티를 거부합니다. Account Session은 Character 모델과 분리됩니다.

## 시작과 종료

상위 라우트는 /login, /signup, /game입니다. 설정·자산 Manifest·코어 Placeholder·세션을 읽은 후 인증 UI 또는 게임으로 진입합니다. 게임 진입 시 Snapshot을 받으며 Realtime 구독과 Replay를 연결합니다. 객체 아트는 현재 화면에서 필요한 자산만 Lazy Load합니다. Pixi 모듈은 게임 진입 시 동적으로 로딩됩니다.

종료 시 구독·공용 시간 Tick·복구 타이머·패널을 정리합니다. Async 작업은 epoch를 확인해 로그아웃 이후 늦게 도착한 Snapshot이 새 화면을 갱신하지 않게 합니다. 브라우저 안의 Mock 월드 서버는 탭의 지속형 세계를 흉내 내며, HMR 종료 시 정리됩니다.

## 연결 복구

1. Snapshot.sequence=N으로 초기화.
2. N+1 이벤트만 적용. N 이하 중복은 무시.
3. Gap 또는 잘못된 계약을 받으면 캐시를 무효화하고 Snapshot 요청.
4. 연결 복구 시 마지막 Sequence 이후 이벤트를 Replay.
5. 보관 이력 밖이면 Snapshot으로 대체.
6. Snapshot 수신 중 Live 이벤트는 버퍼링하고 스냅샷 이후 순서대로 반영.
7. Snapshot에는 CommandStatus도 포함해 끊긴 동안 완료된 명령이 영원히 실행 중으로 남지 않게 함.
8. 끊김은 백오프 재시도. 세션 만료는 자동 재접속 대신 재로그인.

## 렌더러

CameraState는 월드 중심과 Zoom입니다. 서버가 보내는 출발/도착 좌표·시각을 보간합니다. 중간 위치 계산은 표시 전용이며 게임 결과를 만들지 않습니다. Renderer는 ID별 Sprite를 재사용하고 관심 영역 밖 객체를 숨깁니다. Chunk는 400 단위입니다. subscribeArea 계약을 통해 실제 서버의 공간 구독을 연결할 수 있습니다. Mock은 지역 구독 계약과 렌더링 Culling을 검증하며 실제 서버의 공간 인덱스를 대신하지 않습니다.

기본 LOD는 가까이서 이미지·이름, 중간에서 아이콘, 멀리서 점입니다. 대량 객체의 실제 군집화는 향후 확장 대상입니다.

## 확장 경계

core/contracts는 React/Pixi/DOM을 import하지 않습니다. API Contract·Asset ID·Localization Key·Settings·Character는 향후 모바일 클라이언트와 공유 가능합니다. Window 드래그와 브라우저 오디오·저장소는 Web 구현입니다.

## v0.2 월드 행동

core/world에는 중앙 World Config, 거리, 이동 시간·Interaction 표시 Preview, DOM 없는 보간 함수가 있습니다. 기존 renderer/movement 경로는 공유 보간 함수를 다시 export합니다.

WorldRoot 레이어 순서는 MockTerrain → Entity Container → EffectLayer → DebugLayer입니다. 화면 AOI Outline은 Stage Debug Overlay입니다. Terrain/Effect/Debug 구현은 독립 파일이므로 Map Tile 도입 시 Terrain만 교체할 수 있습니다. Entity Sprite 재사용 로직은 WorldScene의 Entity 책임으로 유지했습니다.

플레이어는 자동 순찰하지 않습니다. Mock 서버는 ACCEPTED 시 플레이어별 Active Activity를 예약해 실행 지연 중에도 중복 이동·채광을 거부합니다. MINING_STARTED와 COMPLETED는 별도 Mining Query Cache를 갱신하고, Snapshot도 동일 상태를 포함합니다. 패널을 닫아도 도메인 활동은 취소되지 않습니다.

interactionPreview와 useWorldAction은 입력 가능 여부·거리·예상시간 표시를 제공하며 판정 권위는 서버에 있습니다. 모든 실제 인벤토리 갱신은 INVENTORY_UPDATED에 한정됩니다.
