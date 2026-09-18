# WORLDLOOM2 설계 체크포인트 v1.0
## 경제 · 저장 · 물류 · 영지 던전 · 컨디션 · 가문 거점
작성일: 2026-09-19

> 목적: 최근 대화에서 확정한 설계를 한 번 끊어서 기록하고, 다음 Codex 구현 범위를 안전하게 나누기 위한 체크포인트 문서.
>
> 표기 기준:
> - **확정**: 현재 구현/후속 설계의 기준
> - **프로토타입 값**: 구조는 확정, 실제 플레이 후 수치 조정 가능
> - **미정**: 방향만 있고 아직 구현하면 안 되는 부분

---

# 1. 이번 체크포인트의 권장 마무리선

이번 설계는 **Family Estate(가문 거점)의 존재와 기본 역할을 정의한 지점에서 한 번 마무리**하는 것이 좋다.

이유:
1. 경제 기준, 저장, 물류, 거래보관소, 일일 시도, 영지 던전 반복 의뢰가 하나의 연결된 시스템으로 정리되었다.
2. Family Estate는 방금 추가된 큰 시스템이라 생산량, 시설 레벨, 방문 보상, 악용 방지, 월드맵 배치 등을 더 설계해야 한다.
3. Family Estate까지 지금 구현 범위에 넣으면 기존 `/fief`, 인벤토리, 월드맵 구조와 동시에 충돌할 가능성이 크다.

따라서 다음 Codex 구현은 **이미 충분히 확정된 공통 시스템을 작은 단위로 구현**하고, Family Estate는 다음 설계 세션에서 구체화한다.

---

# 2. 경제 기준

## 2.1 Standard Income(기준 수익) — 확정

- 10분 ≈ **100 Gold**
- 1분 ≈ **10 Gold**
- 1시간 ≈ **600 Gold**

가격을 먼저 정하지 않고 “평균 플레이 시간으로 몇 분/몇 시간 가치인가?”를 먼저 본다.

## 2.2 Gem(잼) 기준 가치 — 확정 방향

- 내부 기준: **1 Gem ≈ 10원**
- **10 Gem ≈ 100원**
- 실제 스토어 패키지는 플랫폼 가격 정책에 맞춰 별도 조정

Gem은 제한적 편의성, 꾸미기, 일부 일일 PvE 추가 시도에 사용한다.
Gem ↔ Gold 직접 환전은 하지 않는 방향.

---

# 3. Item / Stack / Weight 공통 규칙

공통 ItemDefinition(아이템 정의):

```ts
ItemDefinition {
  id
  name
  category
  maxStack
  unitWeight
}
```

- `maxStack`: 한 Slot 최대 중첩 수량
- `unitWeight`: 한 개당 게임 내부 무게 단위
- 아이템 추가 시 기존 Stack부터 채우고 남으면 새 Slot 생성
- Gold는 Item이 아니라 Wallet(지갑) 잔액

---

# 4. Personal Inventory(개인 인벤토리)

- Slot 제한 O
- Weight 제한 O
- Stack 적용 O
- 무게가 커지면 이동속도 저하
- 절대 운반 상한 후보 존재
- 정확한 과적 구간/감속률은 미정

## Slot 확장 — 확정 / 프로토타입 값

| 단계 | 총 Slot | 증가 | 비용 |
|---|---:|---:|---:|
| 기본 | 20 | - | 무료 |
| Gold 1 | 23 | +3 | 300G |
| Gold 2 | 26 | +3 | 600G |
| Gold 3 | 29 | +3 | 1,200G |
| Gold 4 | 32 | +3 | 2,400G |
| Gold 5 | 35 | +3 | 4,800G |
| Gold 6 | 38 | +3 | 9,600G |
| Premium 1 | 39 | +1 | 15 Gem |
| Premium 2 | 40 | +1 | 20 Gem |
| Premium 3 | 41 | +1 | 25 Gem |
| ... | ... | +1 | 이전보다 +5 Gem |
| Premium 12 | 50 | +1 | 70 Gem |

현재 상한: **50 Slot**
38 → 50 전체 Premium 확장 총 비용: **510 Gem**.

---

# 5. Public City(공용 도시) / Fief City(영지 도시)

## Public City(공용 도시)
모든 플레이어가 이용하는 월드 공용 거점.

기본/후속 기능:
- Public City Warehouse
- Market
- Regional Transaction Depot
- Logistics
- Contract Board
- General Shop
- 후속 Crafting / Guild / Inn

## Fief City(영지 도시)
작위 보유자의 Instance Fief(인스턴스 영지) 내부 도시.

역할:
- 영지 경제 성장
- 세입
- 번영
- Dungeon Grade 잠재 범위

**Public City ≠ Fief City**

---

# 6. Public City Warehouse(공용 도시 창고)

- 도시별 독립
- 플레이어 개인 자산 보관
- Slot 제한만 적용
- Weight 제한 없음
- Stack 적용
- 해당 도시에 실제로 도착해야 입출고 가능
- 도시마다 확장 상태 독립

확장 흐름은 Personal Inventory와 동일:
- 기본 20
- Gold로 +3씩 6단계 → 38
- 이후 Premium으로 +1씩 → 최대 50

원격 입출고는 불가.
원격 조회는 후속 UX에서 결정.

---

# 7. Regional Transaction Depot(지역 거래보관소)

역할:
- Market 구매 완료 물품
- NPC Logistics 도착 물품
- 기타 시스템 배송 물품
의 임시 수령처.

규칙:
- 보관 기간 **30일**
- 미수령 시 소멸
- Slot/Weight 제한 없음
- 해당 Public City에 와야 수령 가능
- 부분 수령 가능
- 수령 전 장착/제작/시장재등록/건설사용/재운송 불가
- Batch 단위 만료일 유지
- FEFO(먼저 만료되는 것부터 수령)

알림은 별도 Notification을 만들지 않고 기존 `Mail(우편)` 프레임워크 사용:
- 도착
- 7일 전
- 3일 전
- 1일 전
- 만료/소멸

---

# 8. Market(시장) 기본 방향

- Public City별 독립 Market
- Global Market 없음
- Sell Order / Buy Order
- Order Book(호가)
- 물품/Gold Escrow
- 구매 완료 물품은 Warehouse가 아니라 **해당 도시 Regional Transaction Depot**으로 이동
- 도시간 자동 이동 없음

NPC는 시장을 대체하지 않는다.
후보:
- 일부 기본 자원 낮은 최저 매입가
- 초보용 기본 물품 판매
- Dungeon 희귀재료는 플레이어 시장 중심

Market Fee 정확한 비율은 미정.

---

# 9. Vehicle(운송 장비)

Cart / Wagon은 Inventory Item이 아니라 독립 Vehicle Asset.

예:

```ts
Vehicle {
  ownerId
  vehicleType
  capacity
  currentLocation
  cargo
  status
}
```

확정:
- 모든 운송 장비 이동속도 동일
- 차이는 적재 가능량만
- 캐릭터 Movement Speed는 운송 중 적용하지 않음
- Vehicle은 지역 귀속
- Player Inventory와 Vehicle Cargo 분리

초기 종류 후보:
- Small Cart
- Cart
- Wagon
- Large Wagon

정확한 capacity는 미정.

---

# 10. Logistics(물류/운송)

## 직접 운송
- 자기 Vehicle 사용
- 실제 이동 시간 소모
- Gold 운송 수수료 없음
- 직접 하역

## NPC Logistics
- 개인 Vehicle 불필요
- Gold 지불
- 고정 운송속도
- 목적 Public City 도착 후 Regional Transaction Depot
- 초기 100% 안전 배송
- 도적/호위/보험/손실은 후속

운송 시간:

```text
Delivery Time = Route Distance / Fixed Transport Speed
```

거리 등급(Near/Medium/Long)은 사용하지 않는다.

프로토타입 운송비:

```text
Transport Fee
= Delivery Minutes × Total Cargo Weight × 0.02G
```

- 최소 운송비: **20G**
- 최종 금액: 10G 단위 반올림
- `0.02G`는 플레이테스트 조정 상수

---

# 11. Fief Dungeon(영지 던전) 접근 방식

- Fief Dungeon은 월드맵 실제 좌표로 이동하는 콘텐츠가 아님
- 영주는 Manor(장원)의 영지관리에서 의뢰 등록
- 일반 플레이어는 **아무 Public City의 Contract Board에서 동일한 영지 던전 의뢰 목록 확인**
- 참가 클릭 후 캐릭터 선택
- 캐릭터 월드 위치는 그대로
- Dungeon Expedition(원정) Activity만 부여
- 던전 때문에 도시 간 순간이동이 발생하지 않음

원정 중 해당 캐릭터는 다른 작업에 사용할 수 없지만 플레이어는 다른 캐릭터/관리 콘텐츠를 계속 이용 가능.

---

# 12. Dungeon Grade별 공략 시간 — 확정

| Grade | 공략 시간 |
|---|---:|
| F | 15분 |
| E | 30분 |
| D | 50분 |
| C | 75분 |
| B | 110분 |
| A | 150분 |
| S | 200분 |

---

# 13. Fief Dungeon Contract(영지 던전 반복 의뢰)

## 기본 슬롯
영주는 하루 기본 **10개의 성공 슬롯** 등록.

별도 대기열 없음.

- OPEN: 즉시 참가 가능
- IN_PROGRESS: 공략 중
- COMPLETED: 성공 완료

성공:
- Slot → COMPLETED
- 그날 다시 열리지 않음

실패:
- Slot → OPEN
- 다시 다른 도전자를 받을 수 있음

플레이어의 개인 Daily Attempt는 참가 시작 시 소모.
실패해도 반환하지 않음.

## Premium Contract Slot

| 추가 슬롯 | 비용 |
|---:|---:|
| 11번째 | 10 Gem |
| 12번째 | 20 Gem |
| 13번째 | 30 Gem |
| 14번째 | 40 Gem |
| 15번째 | 50 Gem |

매일 초기화.
등록비는 추가 모집 슬롯 비용이며 미사용/실패로 인한 환불 없음 방향.

## Premium Slot 보상 제한

Slot 1~10 성공:
- Aether -1
- Player Contract Gold O
- Player Resource Share O
- Fief Resource Share O

Slot 11~15 성공:
- Aether -1
- Player Contract Gold O
- Player Resource Share O
- **Fief Resource Share X**

---

# 14. Daily Attempt System(일일 시도 횟수 시스템)

공통 방향:
- Base Attempts
- Premium Bonus Attempt
- Daily Reset

일반 Premium Bonus:
- 하루 최대 +1회
- 기본 비용 **10 Gem ≈ 100원**

Fief Dungeon:
- 기본 2회/일
- 10 Gem으로 +1
- 일반 최대 3회

World Dungeon:
- 기본 2회/일
- 10 Gem으로 +1
- 일반 최대 3회

영주 자기 영지:
- 기본 2회
- Owner Bonus +1
- Premium +1
- 최대 4회

PvP 랭크, 귀족 평의회 투표, 왕국 정치, 일반 Market 거래, 일반 이동에는 적용하지 않는 방향.

---

# 15. Fief Dungeon 성공 / 실패 / 부분 보상

초기:
- 캐릭터 1명 = Dungeon Slot 1개
- 성공 판정은 전투력/장비 등 전투 요소 중심
- Sleep/Satiety/Temperature는 성공률에 직접 반영하지 않음
- 정확한 성공률 공식은 아직 미정

Dungeon은 개념적으로 3 Boss Checkpoint를 가진다.

예: F급 15분
- 약 5분 Boss 1
- 약 10분 Boss 2
- 약 15분 Final Boss

부분 보상 방향:
- Boss 1 이후 실패 → 성공 공략 개인 보상의 약 **1/5**
- Boss 2 이후 실패 → 약 **3/5**
- Final Boss 성공 → **5/5 전체**

실패:
- Aether 감소 X
- Contract Gold X
- Fief Share X
- 도전자 개인에게 진행도 기반 부분 전리품 O

성공:
- Aether -1
- Contract Gold O
- Player Share O
- Fief Share O
- 단 Premium Slot 11~15는 Fief Share X

---

# 16. Condition System(컨디션 시스템)

대상:
- Sleep(수면도)
- Satiety(포만도)
- 추위/더위 관련 상태

이 값들은 Fief Dungeon 성공률을 직접 낮추지 않는다.

## 40% 기준
- 40~100%: 정상, 패널티 없음
- 40% 미만: 성장 효율과 Luck/희귀 보상 계열에 점진적 불이익
- 정확한 패널티 %는 미정

UI에서는 세부 내부 수치를 계속 노출하지 않고:
“컨디션 저하로 성장 효율과 행운에 불리한 영향”
정도로 상기.

## 0% — 최신 방향
Sleep 또는 Satiety 0%여도:
- 이동 가능
- 가문 복귀 가능
- 도시 시설 이용 가능
- 음식 섭취 가능
- 수면/휴식 가능

하지만 **캐릭터 성장 자체는 발생하지 않음**:
- 경험치 성장 X
- 숙련 성장 X
- 기타 성장 누적 X

**미정:** 0%에서 실제 일반 자원의 채집/생산량까지 막을지는 아직 최종 확정하지 않음.

## 회복
Family Estate:
- 음식 → Satiety 빠른 회복
- 침대 → Sleep 빠른 회복

Public City:
- 음식/식당/상점 → Gold로 포만 회복
- Inn → Gold로 수면 회복

Dungeon/파견/작업 중:
- 가문/도시에 없으면 직접 음식/침대 회복 불가
- 활동 종료 후 돌아와야 정상 회복

Rest Mode:
- 아무 활동도 하지 않음
- Sleep/Satiety가 매우 천천히 자연 회복

---

# 17. Family Estate(가문 거점) — 신규 큰 방향

> **중요: 존재와 기본 방향만 정했다. 지금 Codex 구현에 바로 넣지 않는 것을 권장.**

모든 플레이어/가문에게 월드맵상의 **고정 거점**이 존재.

- 월드맵을 돌아다니지 않음
- Home Base(홈 거점)
- 다른 유저가 클릭해 방문 가능
- Noble Fief(귀족 영지)와 별도

Family Estate:
- 모든 가문이 소유

Noble Fief:
- 작위 보유 가문만 추가 소유

후보 시설:
- Family House
- Bed / Rest
- Family Warehouse
- Farm
- Mine / Quarry
- Lumber
- 장식/전시/방문 콘텐츠

생산 방향:
- 농작물
- 일반 광물
- 일반 목재 등 기본 자원
- Estate 업그레이드/시설물 건설에 사용
- Dungeon 전용 고급 희귀자원은 생산하지 않는 방향

다른 유저 방문/도움:
- Farm/Mine 등을 클릭해 도움
- 방문 유저도 일정량 재료 획득
- Estate Owner의 창고에도 추가 보너스 재료 발생
- 주인의 기존 생산량을 빼앗지 않고 Bonus Production 생성

후속 설계 필요:
- 가문 단위 Daily Help Limit
- 시설별 일일 도움 한도
- 다중 캐릭터 중복 클릭 방지
- 생산량 밸런스
- 봇/다계정 악용 방지
- 월드맵 대규모 Estate 표시 방식
- 초기 시설 구성과 해금 순서

---

# 18. 권장 Codex 구현 분할

## v0.4A — Storage & Logistics Foundation
먼저 공통 기반을 안정화.

권장 범위:
1. ItemDefinition의 `maxStack`, `unitWeight`
2. Personal Inventory Slot + Weight 구조
3. Public City Warehouse 데이터 모델
4. Regional Transaction Depot
5. 30일 expiry + Batch + FEFO
6. 기존 Mail 시스템 도착/만료 알림
7. Vehicle Asset / Cargo Capacity 모델
8. 고정 Transport Speed
9. NPC Logistics 시간/비용 계산
10. 목적지 Transaction Depot 연결
11. 단위 테스트

주의:
- 기존 병렬 Item/Inventory/Loot 작업과 충돌 여부를 최신 `main`에서 먼저 확인
- 진행 중인 `/fief` v0.3 작업이 있다면 `src/modules/fief/**`를 동시에 수정하지 않음

## v0.4B — Fief Dungeon Contract & Expedition
v0.4A와 현재 `/fief` 작업 정리 뒤 진행.

권장 범위:
1. Daily Attempt System
2. Fief Dungeon 2회 + 10 Gem 추가 1회
3. 영주 Owner Bonus
4. 하루 Contract Slot 10개
5. Premium Slot 11~15
6. OPEN / IN_PROGRESS / COMPLETED
7. 실패 시 OPEN 복구
8. Grade별 Expedition Time
9. Character Activity State
10. Boss Checkpoint / 부분 보상 데이터 구조
11. Premium Slot Fief Share 제외
12. 결정론적 테스트

## v0.5 이후 — Family Estate
Family Estate는 다음 전용 설계가 끝난 뒤 구현.

---

# 19. 이번 시점에서 구현하면 안 되는 것

- Family Estate 전체 구현
- Estate 생산량/시설 레벨
- 방문 Help 보상 수치
- Condition 정확한 패널티 %
- 0% 상태 실제 채집 생산량 처리
- Dungeon Success 공식 최종값
- Market Fee 최종값
- NPC 기본 자원 매입가
- World Dungeon 위험/보험/호위
- Player Transport Company
- Player Gathering/Delivery Contract
- Family Estate 월드맵 대규모 표시 최적화

---

# 20. 다음 설계 세션 추천 순서

다음에는 **Family Estate(가문 거점)**만 따로 잡는다.

1. 모든 가문이 Estate를 언제/어떻게 얻는가
2. 월드맵 표시 방식
3. 최초 시설 2~4개
4. 생산 방식과 생산 주기
5. Family Warehouse
6. 다른 유저 방문
7. Help Reward / Daily Limit
8. Estate Upgrade
9. Condition 회복 연결
10. 꾸미기 / Premium Cosmetic

Family Estate 전용 설계가 끝나기 전에는 구현시키지 않는 것이 좋다.
