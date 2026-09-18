# Storage & Logistics Foundation v0.4A

2026-09-19 경제·물류 체크포인트의 첫 번째 구현 단위입니다. 기준 main commit은 `3fadb303645c838541a78f233db617dcc181d25a`입니다. 최신 main에 병렬 Item/Inventory/Loot 변경이나 진행 중인 같은 저장소 작업이 없는 것을 확인했습니다.

## 실제 플레이

1. `/game`에서 기존 데모 계정으로 접속합니다. 경제 → 인벤토리에 중첩별 물품, 무게, 슬롯과 확장 가격을 표시합니다.
2. 경제 → **저장·물류**를 엽니다. 새벽물결 도시 또는 항구 도시를 선택하고 **이 도시로 이동**합니다. 실제 MOVE 완료와 도시 반경 안의 정지 위치를 확인한 뒤 시설을 이용합니다.
3. **개인 도시 창고**에서 원하는 물품·수량을 보관하거나 꺼냅니다. 개인 인벤토리와 각 도시 창고의 확장 상태는 독립입니다. 이동 중에는 도시 시설을 이용할 수 없습니다.
4. **NPC 배송**에서 출발 도시 창고의 물품·수량과 목적지를 선택합니다. 서버가 비용을 한 번 차감하고 창고 물품을 배송에 예약합니다. 직접 이동하거나 개인 운송장비를 소유할 필요가 없습니다.
5. 배송 진행률과 남은 시간을 확인합니다. 도착하면 목적지 **거래보관소**에 새 Batch를 만들고 기존 **우편**에 도착 안내를 보냅니다. 목적지 창고로 자동 입고하지 않습니다.
6. 도착 우편의 **저장·물류 열기**는 해당 도시 거래보관소 탭을 엽니다. 해당 도시로 이동한 뒤 원하는 수량만 부분 수령합니다. 같은 물품은 먼저 만료되는 Batch부터 소비합니다.
7. 남은 물품은 도착 후 30일에 소멸합니다. 만료 7/3/1일 전과 소멸 시에도 기존 우편을 사용합니다. 이 우편에서 물품·Gold를 직접 지급하지 않습니다.

개인 무게/슬롯 부족과 잘못된 수량은 UI와 권위형 Mock 양쪽에서 차단합니다. 창고·거래보관소의 원격 내용 조회는 이번에 추가하지 않았으며, 해당 도시 방문 후 보여줍니다. 이미 시작한 배송의 목적지·진행 내역은 확인할 수 있습니다.

## 공통 아이템·저장

- `ItemDefinition`: id, name(기존 다국어 키), category, maxStack, unitWeight와 기존 assetId.
- `ItemStack`: 기존 id가 물품 정의 ID이며 slotId는 독립 슬롯 식별자입니다. 기존 하나짜리 stack DTO도 호환합니다.
- 새 물품은 기존 같은 물품 stack의 빈 공간부터 채운 뒤 새 slotId를 할당합니다. 모든 입력/출력 계산은 불변이며 수용 불가 시 일부 이동이나 차감을 적용하지 않습니다.
- Gold는 `inventory.gold`, Gem은 `inventory.gem` 지갑 잔액이고 ItemDefinition에 등록하지 않습니다. Gem↔Gold 환전·유료 스토어·현금 결제를 추가하지 않았습니다.
- 개인 인벤토리는 slot과 weight를 모두 적용합니다. 창고는 도시별 slot만 적용하며 weight는 제한하지 않습니다.
- 생존 영지 병력의 금고와 개인 지갑은 합치지 않습니다. `src/modules/fief/**` 생산 코드는 변경하지 않았습니다.
- 새 채광 보상도 공통 addItems 규칙을 사용합니다. 공간이 부족하면 작업을 시작할 수 없고, 예외적으로 완료 전에 용량 조건이 변경되면 MINING_CANCELLED와 FAILED로 종료해 보상·활동 잠금을 남기지 않습니다. 이동 감속률은 미정이므로 기존 이동속도 공식을 변경하지 않았습니다.

슬롯 확장은 개인 인벤토리와 **각 도시 창고 각각** 동일한 순서를 따릅니다.

| 단계         | 슬롯              | 비용                              |
| ------------ | ----------------- | --------------------------------- |
| 기본         | 20                | 무료                              |
| Gold 1~6     | 23/26/29/32/35/38 | 300/600/1,200/2,400/4,800/9,600 G |
| Premium 1~12 | 39~50             | 15~70 Gem, 단계마다 +5 Gem        |

Gold 6단계를 완료해야 Gem 확장을 시작합니다. 최대 50 slots, Gem 전체 확장 비용은 510입니다. 확장은 다음 단계만 구매하며, 잔액이 부족하면 지갑과 용량을 변경하지 않습니다. 데모 Gem 지갑은 0이며 무료 Gem 지급이나 구매 기능을 만들지 않았습니다. 단계별 Gem 가격과 전체 확장 흐름은 모델 검사로 검증합니다.

## 거래보관소·우편

Batch는 도시 ID, 물품 ID, 수량, arrivedAt, expiresAt, source(MARKET/NPC_LOGISTICS/SYSTEM), 이미 보낸 notice 단계를 가집니다. 거래보관소 자체 slot/weight 상한은 없습니다.

- FEFO: expiresAt 오름차순, 동일한 만료일은 Batch ID로 정렬합니다.
- 부분 수령은 Batch의 원래 도착일·만료일을 유지합니다. 늦은 tick에 배송을 처리해도 만료는 실제 arrivesAt+30일입니다.
- expiry 직전에는 수령할 수 있고 정확히 expiry에 도달하면 소멸합니다.
- 이미 전량 수령한 Batch는 만료 경고를 보내지 않습니다. 부분 수령한 Batch의 이후 안내는 남은 수량을 사용합니다.
- 각 Batch의 도착·D7·D3·D1·EXPIRED는 한 번만 통지합니다. 긴 시간 점프로 이미 소멸한 경우 지난 경고를 재생하지 않고 소멸 안내만 보냅니다.
- `Mail.depotNotice`를 기존 우편 DTO의 선택 필드로 추가합니다. 안내 우편은 보상 0·claimed=true이며 수령 버튼/수령 완료 보상 표시 대신 도시 보관소 바로가기를 제공합니다. 보관소 물품을 우편 claim으로 취득할 수 없습니다.
- 수령 전 물품은 인벤토리/차량/창고의 물품이 아닙니다. 재배송은 출발 창고 재고만 사용하므로 보관소 물품을 바로 재운송할 수 없습니다. 장착·제작·시장 재등록·건설은 이번 구현에 없으므로 보관소 자산을 소비하는 우회 경로도 추가하지 않았습니다.

Market 구현은 후속입니다. 구매 완료 물품은 createDepotBatch의 MARKET source로 연결할 수 있지만 매칭·주문서·Escrow·수수료를 구현하거나 확정하지 않았습니다.

## 고정 속도 NPC 배송·운송장비

```text
Delivery time = Euclidean route distance / fixed transport speed
Fee = max(20 G, nearest 10 G(delivery minutes × total cargo weight × 0.02 G))
```

이번 두 샘플 도시의 Route는 직선 거리이며 road network/pathfinding이나 거리 등급(Near/Medium/Long)은 없습니다. 배송 견적과 확정 시간은 캐릭터 Movement Speed 또는 운송장비 종류에 의존하지 않습니다. NPC 배송은 100% 안전하고 실패/보험/도적/호위가 없습니다.

Vehicle은 소유자, vehicleType, capacity, currentLocation, regionId, cargo, status를 가진 독립 asset입니다. 인벤토리 아이템이 아니며 cargo를 개인 items에 중복 보유하지 않습니다. 적재/하역은 소유자·지역·현재 도시·IDLE 상태와 받는 쪽 용량을 검증합니다. 차량 종류별 정식 capacity는 미정이므로 생성 함수에 호출자가 capacity를 전달하며 종류별 값을 확정하지 않았습니다. 초기 데모 차량은 비어 있습니다. 구매·직접 운송 Activity·차량 월드 마커는 후속이고 NPC 배송은 차량이 없어도 동작합니다.

## 계약·시간·구조

- `src/core/storage/{config,schema,items,model}.ts`: DOM 없이 공통 규칙·계산·순수 상태 전이.
- `STORAGE_ACTION`: EXPAND / TRANSFER / COLLECT / SHIP / VEHICLE_CARGO. payload는 strict schema이며 client fee, duration, arrival, capacity 덮어쓰기를 받지 않습니다.
- `STORAGE_UPDATED`: 독립 cache.storage 갱신. snapshot에 warehouses/depot/shipments/vehicles를 포함하며 이전 snapshot에 storage가 없으면 빈 저장 상태로 파싱합니다.
- 기존 계약 버전 2.0의 additive extension입니다. 이전 inventory의 선택 필드는 없으면 기본 20 slots/0 Gem/기본 weightLimit으로 해석합니다. 외부 백엔드는 이 추가 이벤트·명령을 구현한 뒤 활성화해야 합니다.
- MockWorldServer가 방문·보유량·용량·금고·도착/만료를 검증하고 변경합니다. UI가 cache 자산을 직접 증가시키지 않습니다.
- 기존 commandId 중복 처리와 실제 실행 시 재검증을 사용합니다. 동시에 검증된 배송 두 건이라도 첫 실행 후 재고가 모자라면 다음 건은 FAILED이며 추가 차감이 없습니다.
- 기존 Mock ticker에서 배송·알림을 정산하고 snapshot/새 command에서도 현재 시각까지 정산합니다. 새 React interval을 추가하지 않습니다.
- 기존 reconnect/replay/snapshot recovery에서 inventory/storage/mail을 함께 복구합니다.
- UI는 기존 Game Shell/Panel Manager/TimeService/Asset 시스템과 5개 언어를 사용합니다. 별도 로그인 없는 저장 시뮬레이터나 가짜 도시 순간이동을 만들지 않았습니다.

## 확정값·시연값·후속

체크포인트의 확정/프로토타입 값: 기준 수익 10 G/분은 가격 비교 기준만 기록합니다. 자동 수입 버튼/급여를 만들지 않았습니다. Gem 내부 참고 가치 1 Gem≈10원, 10 Gem≈100원은 설계 방향으로 보존하며 실제 스토어 패키지·결제 가격은 플랫폼 정책에 따라 후속으로 정합니다. 슬롯 단계·비용·상한, 30일 보관, 7/3/1일 안내, 최소 운송비 20 G·10 G 반올림·계수 0.02를 반영합니다.

**새 시연값**: 구리 maxStack 100·weight 2, 식량 20·0.5, 곡괭이 1·8, 개인 운반 한도 120, 고정 운송속도 60 월드 단위/초, 도시 반경 30. 정확한 운영 무게·속도·상한이 확정된 것으로 해석하지 않습니다. 실제 경로망·과적 구간/감속·Premium 결제·영구 저장은 후속입니다.

새벽물결 도시의 창고 구리 80개와 기존 인벤토리 구리 12/식량 8/곡괭이 1은 메모리 데모 fixture입니다. 창고를 반복 진입해도 다시 채우지 않습니다. 실제 서버 DB·멀티 유저 자산 보안·지속 저장은 없습니다. 새로고침 시 데모를 초기화합니다.

문서의 **v0.4B 영지 던전 원정/일일 시도/반복 의뢰**는 다음 독립 구현 단위입니다. Family Estate(v0.5), 조건 패널티 %, 0% 채집 생산량, 던전 성공률 공식, 시장 수수료, NPC 매입가, 위험·보험·호위·운송업체·방문 보상은 이번에 구현/확정하지 않습니다.

첨부 원본은 [ECONOMY_LOGISTICS_FIEF_FAMILY_CHECKPOINT_v1.0.md](spec/ECONOMY_LOGISTICS_FIEF_FAMILY_CHECKPOINT_v1.0.md)에 변경 없이 보존했습니다. SHA-256: `D7C6F777595BCFDAB014505729D83FBD82BBE0FAB58F1EA9B5D11103F7C25493`.
