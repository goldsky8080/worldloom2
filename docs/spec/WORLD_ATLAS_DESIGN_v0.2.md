# WORLDLOOM2 월드 · 영지 · 가문 · 도시 · 성 · 아이템 · 아틀라스 통합 설계서 v0.2

작성일: 2026-09-17  
문서 상태: 🟨 DESIGN(설계 중)  
대상 저장소: `goldsky8080/worldloom2`  
현재 구현 기준: v0.2 — Framework(공통 프레임워크) + Movement(이동) + Mining(채광)  
문서 용도: **Codex(코덱스) 설계 기준서**

---

# 0. Codex(코덱스)에게

이 문서는 **즉시 구현을 시작하라는 실행 프롬프트가 아니다.**

이 문서를 먼저 읽고 Worldloom2의 다음 개발 방향과
월드/영지/가문/도시/성/아이템/자산 체계의 기준으로 사용한다.

별도의 `Execution Prompt(실행 프롬프트)`가 전달되기 전까지는
대규모 코드 변경을 하지 않는다.

기존 v0.2의 다음 구조를 최대한 유지한다.

```text
React
Vite
TypeScript
PixiJS

WorldEntity
GameGateway
GameRuntime
GameCache
Command / Event
Module Registry
Asset Manager
World Renderer
Chunk / AOI
Movement
Mining
```

새 설계가 기존 구조와 충돌하는 경우
임의로 구조를 뜯어고치지 말고 충돌 지점을 보고한다.

---

# 1. 이 문서의 목적

기존의:

`WORLDLOOM2_월드객체_아이템_아틀라스정책_등급_승급_강화_자산설계서_v0.1`

내용과 이후 논의한 다음 항목을 하나로 통합한다.

```text
거대한 World(세계)
Region(대지역)
Territory(영지)
Frontier(개척)
사용자 수에 따른 월드 확장

House(가문)
House Level(가문 레벨)
Prestige(명성)
Regional Influence(지역 영향력)
Nobility Title(작위)

Manor(장원)
Village(마을)
Town(소도시)
City(도시)
Castle(성)

Ownership(소유권)
Control(통치권)
Stewardship(위임 통치권)
War / Siege(전쟁 / 공성) 방향

Texture Atlas(텍스처 아틀라스)
Item Rarity(아이템 등급)
Tier / Promotion(티어 / 승급)
Enhancement(강화)
House Heraldry(가문 문장)
LOD(지도 상세도)
```

이 문서가 확정된 뒤에:

```text
샘플 Region(대지역)
실제 Atlas(아틀라스)
월드 객체 Registry(등록소)
LOD 렌더링
객체별 상호작용
```

순서로 진행한다.

---

# 2. Worldloom2의 세계관 구조 목표

Worldloom2는 단순히 캐릭터 한 명만 성장시키는 RPG(역할수행게임)가 아니다.

장기 성장 구조는 다음과 같다.

```text
Character(캐릭터)
↓
House(가문)
↓
Territory(영지)
↓
Settlement(정착지)
↓
City / Castle(도시 / 성)
↓
Region(대지역)
↓
World(세계)
```

플레이어 활동에 따라:

```text
새 지역이 열리고
영지가 개척되고
마을이 생기고
도시가 성장하고
성이 건설되고
소유 가문이 바뀌고
전쟁으로 통치자가 바뀌고
쇠퇴한 지역은 폐허가 되고
```

그 역사가 서버에 계속 남는 방향을 목표로 한다.

---

# 3. 영어 용어 표기 원칙

앞으로 문서와 UI 설계에서 영어 용어는 가능하면 한글을 함께 적는다.

예:

```text
World(세계)
Region(대지역)
Territory(영지)
House(가문)
City(도시)
Castle(성)
Manor(장원)
Texture Atlas(텍스처 아틀라스)
Enhancement(강화)
```

코드 식별자는 영어를 사용하되
기획 문서와 설명에는 한글 의미를 함께 표시한다.

---

# 4. World(세계) 크기

현재 v0.2 Mock Map(모의 지도)의 2400 x 1600은
기능 검증용이다.

최종 세계는 매우 크게 설계한다.

잠정 기준:

```text
Logical World Size(논리 월드 크기)
약 200,000 x 120,000
```

중요:

이 숫자는 아직 최종 확정이 아니다.

실제 확정 시 다음을 같이 검토해야 한다.

```text
이동 속도
Region 수
Territory 수
실제 플레이 이동 시간
Teleport/Fast Travel(빠른 이동)
월드 렌더링 비용
서버 AOI 비용
```

핵심 원칙은 숫자 자체가 아니라:

> 월드는 아주 크게 존재하지만 처음부터 전부 활성화하지 않는다.

이다.

---

# 5. 월드 계층

기본 구조:

```text
World(세계)
│
├ Region(대지역)
│  │
│  ├ Territory(영지)
│  │  │
│  │  ├ Castle(성)
│  │  ├ City(도시)
│  │  ├ Town(소도시)
│  │  ├ Village(마을)
│  │  ├ Manor(장원)
│  │  ├ Mine(광산)
│  │  ├ Forest(숲)
│  │  ├ Farm(농장)
│  │  ├ Dungeon(던전)
│  │  ├ Road(도로)
│  │  ├ Resource Node(자원 노드)
│  │  ├ Monster(몬스터)
│  │  ├ NPC(비플레이어 캐릭터)
│  │  └ Player(플레이어)
│  │
│  └ 다른 Territory(영지)
│
└ 다른 Region(대지역)
```

---

# 6. Territory(영지)의 정확한 정의

Territory(영지)는 광산처럼 하나의 작은 Object(객체)가 아니다.

영지는:

> 지도 위에 미리 정해져 있는 일정 범위의 지역 단위

다.

영지 안에는:

```text
성
도시
마을
장원
광산
숲
농장
도로
던전
자원
몬스터
NPC
```

등 여러 객체가 존재할 수 있다.

월드맵을 멀리서 볼 때는
영지를 하나의 대표 마커처럼 선택할 수 있지만,
데이터 구조상 영지는 Area(영역)다.

---

# 7. Territory(영지)는 미리 나눈다

이 부분은 현재 방향상 **확정**이다.

플레이어가 지도 아무 곳에나 깃발을 꽂아서
영지 경계를 자유롭게 만드는 방식은 사용하지 않는다.

각 Region(대지역)을 만들 때:

```text
A-01
A-02
A-03
...
A-16
```

같은 Territory Slot(영지 구역)을 미리 정한다.

단, 정사각형 Grid(격자)처럼 자르지 않는다.

자연스러운 경계:

```text
강
산맥
숲
해안
협곡
도로
지형선
```

을 이용한다.

---

# 8. Territory(영지) 크기는 서로 다를 수 있다

모든 영지가 같은 크기일 필요는 없다.

```text
Small Territory(소영지)
Medium Territory(중영지)
Large Territory(대영지)
```

로 구분할 수 있다.

## Small Territory(소영지)

```text
관리비 적음
개발 슬롯 적음
작은 가문에 적합
```

## Medium Territory(중영지)

```text
일반적인 규모
균형형
```

## Large Territory(대영지)

```text
자원 많음
개발 용량 큼
유지비 높음
방어 부담 큼
높은 작위/영향력 요구 가능
```

---

# 9. 영지별 특성

영지 가치는 크기 하나로 결정하지 않는다.

각 영지에는 다음 특성을 둘 수 있다.

```text
Agriculture(농업 적합도)
Mining(광업 잠재력)
Forestry(산림)
Water(수자원)
Trade Access(교역 접근성)
Defense(방어 지형)
Danger(위험도)
Development Capacity(개발 용량)
```

예:

```text
A-01
광업 ★★★★★
농업 ★★
교역 ★

A-02
광업 ★
농업 ★★★★★
교역 ★★★

A-03
광업 ★★
농업 ★★★
교역 ★★★★★
```

가문마다 원하는 영지가 달라지게 만든다.

---

# 10. Region(대지역)

World(세계)를 여러 Region(대지역)으로 나눈다.

Region은 다음을 가진다.

```text
지형 테마
기후
자원 구성
위험도
경제 특성
영지 슬롯
도시 후보지
성 후보지
던전
도로
강
```

초기 초안:

```text
약 60개 Region
Region당 평균 약 16개 Territory
```

이론상:

```text
약 960개의 Territory 후보
```

를 만들 수 있다.

그러나 모든 Region을 처음부터 활성화하지 않는다.

---

# 11. Region(대지역) 1개의 용량 초안

초기 밸런스 예:

```text
Territory Slot(영지 구역)     12~20
Castle Site(성 후보지)         3~4
City Site(도시 후보지)         1~2
Village Site(마을 후보지)      8~20+
Major Mine(대형 광산)          2~4
Dungeon(던전)                  여러 개
Forest / Farm / River          지형에 따라
```

핵심:

> 기존 Region 안에 성과 영지를 무한 생성하지 않는다.

공간이 부족하면 새로운 Region을 활성화한다.

---

# 12. Site(후보지) 시스템

영지 안의 주요 거점도 일부 미리 정한다.

예:

```text
Castle Site(성 후보지)
City Site(도시 후보지)
Town Site(소도시 후보지)
Village Site(마을 후보지)
Mine Site(광산 후보지)
Port Site(항구 후보지)
Dungeon Site(던전 후보지)
```

중요:

```text
후보지가 있음
≠
처음부터 건물이 있음
```

개척과 개발 과정에서 실제 객체가 생긴다.

---

# 13. 고정 요소와 동적 요소

## 고정

```text
World 기본 지형
Region 경계
Territory 경계
강
산맥
해안
주요 Site
```

## 동적

```text
소유 가문
통치 가문
장원
마을 성장
도시 성장
성 성장
시장
창고
농장
생산시설
도로 발전
자원량
몬스터 밀도
지역 상태
```

---

# 14. 개척의 의미

Frontier Development(개척)는
단순히 지도 안개를 해제하는 기능이 아니다.

권장 흐름:

```text
DORMANT(비활성 지역)
↓
Region 활성화
↓
Frontier(개척 가능 지역)
↓
Exploration(탐사)
↓
Survey(조사/측량)
↓
Outpost(전초기지)
↓
Manor(장원) 또는 초기 정착지
↓
보급 / 치안 / 유지
↓
Claim(영유권 인정)
↓
정식 Territory(가문 영지)
```

---

# 15. Region 활성화 상태

초기 상태 모델:

```text
DORMANT(비활성)
DISCOVERED(발견됨)
FRONTIER(개척 가능)
ACTIVE(활성)
MATURE(성숙)
CONTESTED(분쟁)
DECLINING(쇠퇴)
ABANDONED(황폐)
```

필요에 따라 더 줄이거나 나눌 수 있다.

---

# 16. 유저 수에 따라 월드가 활성화되는 구조

월드는 처음부터 크게 존재한다.

하지만:

```text
전체 월드 크기
≠
현재 실제 활성 구역
```

이다.

서버 초기:

```text
소수 Region만 활성
```

유저와 가문이 늘면:

```text
새 Frontier Region(개척 지역) 개방
```

한다.

---

# 17. 월드 확장 기준

단순 총 가입자 수만 사용하면 안 된다.

가입만 하고 접은 계정이 많을 수 있기 때문이다.

장기적으로 다음을 사용한다.

```text
Active House Count(활성 가문 수)
DAU(일일 활성 사용자)
CCU(동시 접속자)
Territory Occupancy(영지 점유율)
Region Density(지역 밀도)
Economy Volume(경제 규모)
Resource Competition(자원 경쟁도)
```

이 값을 합쳐:

`World Expansion Pressure(월드 확장 압력)`

개념을 둘 수 있다.

---

# 18. 새 Region(대지역) 개방 예

예:

```text
기존 Region 영지 점유율 80%
+
활성 가문 증가
+
시장/자원 경쟁 증가
↓
새 Region 개방
```

게임에서는:

```text
"북동부 개척로가 발견되었습니다."
"왕실이 서부 개척 허가를 발표했습니다."
```

같은 World Event(월드 이벤트)로 표현할 수 있다.

---

# 19. 열린 Region은 다시 닫지 않는다

유저 수가 줄어들더라도
이미 열린 Region은 삭제하지 않는다.

대신:

```text
번영
↓
침체
↓
쇠퇴
↓
빈 영지
↓
폐허
```

가 될 수 있다.

이렇게 서버 역사를 남긴다.

---

# 20. Region 성격

장기적으로:

```text
Core Region(핵심 지역)
Frontier Region(개척 지역)
Contested Region(분쟁 지역)
Wild Region(미개척 지역)
```

을 구분한다.

---

# 21. Core Safe Region(핵심 안전지역)

안전지역은 먼저 차지한 플레이어가
영구적으로 독점하지 못한다.

기본 소유:

```text
Crown(왕실)
Kingdom(왕국)
NPC Faction(NPC 세력)
```

플레이어 가문은 `Ownership(소유권)` 대신
`Stewardship(위임 통치권)`을 얻을 수 있다.

---

# 22. 안전지역의 위임 통치

예:

```text
City Owner(도시 소유자)
왕국

Governor House(운영 가문)
A 가문

Term(임기)
30일
```

운영 가문은 예를 들어:

```text
세금 일부
시장 수수료 일부
Prestige(명성)
Influence(영향력)
특수 계약
일부 개발 권한
```

을 얻을 수 있다.

임기가 끝나면:

```text
Contribution Competition(기여 경쟁)
Royal Contract(왕실 계약)
Appointment(임명)
Selection(선출)
```

등으로 운영 가문을 다시 정할 수 있다.

세부 규칙은 후속 설계.

---

# 23. Frontier Region(개척 지역)

여기서는 플레이어 가문이
실제 영지를 개척하고 소유할 수 있다.

```text
미개척 Territory
↓
탐사
↓
전초기지
↓
장원
↓
정식 영지
```

---

# 24. Contested Region(분쟁 지역)

영지/성/도시 통제권을
가문끼리 경쟁할 수 있는 지역.

향후:

```text
War Declaration(선전포고)
Preparation(준비)
Siege(공성)
Occupation(점령)
Control Transfer(통치권 이전)
```

구조를 지원한다.

---

# 25. Wild Region(미개척 지역)

아직 플레이어가 정착하지 않은 지역.

World Expansion(월드 확장)에 따라
Frontier Region으로 바뀔 수 있다.

---

# 26. 영지/성/도시의 수량 제한

이 부분은 필수다.

모든 유저가 성을 하나씩 가지면
Castle(성)의 가치가 사라진다.

따라서:

```text
Manor(장원)
Territory(영지)
Castle(성)
City(도시)
```

는 희소도를 다르게 한다.

---

# 27. 활성 가문 대비 수량 초안

잠정:

```text
Manor(장원)
활성 가문 3~5개당 약 1개

Territory(영지)
활성 가문 15~25개당 약 1개

Castle(성)
영지 4~6개당 약 1개

City(도시)
영지 8~12개당 약 1개

Capital(수도)
주요 Region당 약 1개
```

예: Active House(활성 가문) 1,000개라면:

```text
Manor 약 200~330
Territory 약 40~65
Castle 약 8~15
City 약 4~8
```

이 값들은 실제 플레이 데이터로 조정한다.

---

# 28. 모든 가문이 영지를 가져야 하는가

아니다.

중요한 원칙:

```text
Merchant House(상인 가문)
→ 영지 없이도 성장 가능

Mercenary House(용병 가문)
→ 영지 없이도 성장 가능

Transport House(운송 가문)
→ 영지 없이도 성장 가능

Noble House(영주 가문)
→ 영지/성/도시 중심 성장
```

땅이 없으면 게임을 못 하는 구조로 만들지 않는다.

---

# 29. Manor(장원)의 정확한 의미

Manor(장원)는
Village(마을)보다 작은 정착지라는 뜻이 아니다.

```text
Village(마을)
= 주민이 모여 사는 정착지

Manor(장원)
= 가문/영주가 가진 사유 거점
```

장원 예:

```text
가문 저택
농지
창고
마구간
작업장
하인/NPC
기초 방어시설
```

---

# 30. Settlement(정착지) 종류

```text
Hamlet(소규모 취락)
Village(마을)
Town(소도시)
City(도시)
Capital(수도)

Outpost(전초기지)
Port(항구)
Mining Town(광산도시)
Trade City(상업도시)
```

군사 거점:

```text
Fort(요새)
Castle(성)
Citadel(대성채)
```

---

# 31. City(도시)의 용도

City(도시)는:

> 사람과 경제의 중심

이다.

핵심 데이터:

```text
Population(인구)
Food(식량)
Jobs(일자리)
Production(생산)
Market(시장)
Storage(창고)
Security(치안)
Trade(교역)
```

도시는 단순 세금 생산 건물이 아니다.

---

# 32. 도시 성장 기준

도시가 돈만 내면 Level Up(레벨 상승)하는 구조를 피한다.

도시 발전 핵심축:

```text
Population(인구)
Economy(경제)
Infrastructure(기반시설)
Security(치안)
Supply(공급/물류)
```

이 값들이 실제로 성장해야 City Level이 오른다.

---

# 33. City Level(도시 레벨)

초기:

```text
L1 ~ L5
```

## L1

```text
기본 상점
기초 시장
기본 창고
```

## L2

```text
시장 확대
운송 거점
생산시설 증가
```

## L3

```text
전문 상점
공방
계약 증가
창고 확대
```

## L4

```text
대형 시장
고급 생산
대형 계약
지역 물류 허브
```

## L5

```text
지역 핵심 경제 허브
최상급 시장
대형 운송
고급 계약
특수 서비스
```

세부 기능은 경제 시스템 설계 때 확정한다.

---

# 34. 도시 Level에 따른 외형 변화

City Level이 오르면
단순히 같은 이미지를 크게 확대하지 않는다.

예:

```text
City L1
소형 중심 건물

City L2
주거지역 증가

City L3
시장/공방/창고 확장

City L4
대형 행정건물 + 성벽 확대

City L5
거대한 지역 중심도시
```

Base Image(본체 이미지)를 단계별로 준비한다.

---

# 35. Castle(성)의 용도

Castle(성)은:

> 군사·방어·통제의 핵심 거점

이다.

City와 역할을 구분한다.

Castle 핵심 기능:

```text
Garrison(주둔군)
Defense(방어)
Patrol(순찰)
Military Storage(군수창고)
Watch Range(감시 범위)
Regional Security(지역 치안)
Siege Resistance(공성 저항)
```

---

# 36. Castle Level(성 레벨)

초기:

```text
L1 ~ L5
```

성 성장 평가축:

```text
Fortification(요새화)
Garrison(주둔군)
Supply(군수 보급)
Barracks(병영)
Defense Facility(방어시설)
Maintenance(유지 상태)
```

---

# 37. Castle Level 혜택

## L1

```text
소형 요새
기본 주둔군
기초 경계
```

## L2

```text
석조 방어
주둔군 증가
군수 저장 증가
```

## L3

```text
성탑
순찰 범위 증가
영지 방어 강화
```

## L4

```text
대형 성채
대규모 주둔
넓은 치안 영향
```

## L5

```text
지역 핵심 방어거점
높은 공성 저항
대규모 군수/통제
```

---

# 38. Castle Level 외형

```text
castle.l1
castle.l2
castle.l3
castle.l4
castle.l5
```

별도 본체 이미지 사용.

예:

```text
L1 목책/소형 성채
L2 석조 성벽
L3 본성 + 성탑
L4 외성 + 강화 성문
L5 대성채 + 복수 성벽
```

---

# 39. 성과 도시는 별도 객체다

기본:

```text
Territory(영지)
├ Castle(성)
├ City(도시)
├ Village(마을)
└ Manor(장원)
```

성 안에 도시와 마을이 항상 들어가는 구조가 아니다.

다만 실제 지도 표현에서는:

```text
City(도시)
└ Castle(성)
```

같이 성곽도시처럼 중첩될 수 있다.

데이터 모델에서는 독립 Entity(객체)로 유지한다.

---

# 40. Settlement Level과 Promotion(승격)

다음 두 개는 다르다.

```text
Development Level(발전 레벨)
= 같은 종류 안에서의 성장

Promotion(승격)
= 정착지 종류 자체 변경
```

예:

```text
Village L5
```

가 됐다고 자동으로 Town이 되는 것이 아니다.

조건을 만족했을 때:

```text
Village
→ Town
→ City
```

승격할 수 있다.

---

# 41. 정착지 승격 조건 후보

```text
Population(인구)
Economy(경제)
Infrastructure(기반시설)
Security(치안)
Trade Volume(거래량)
Supply(공급)
House Influence(가문 영향력)
World Condition(세계 조건)
```

세부 공식은 후속 설계.

---

# 42. Settlement State(정착지 상태)

도시 상태마다 본체 이미지를 새로 만들지 않는다.

Overlay(오버레이) 사용:

```text
normal(정상)
prosperous(번영)
damaged(파손)
burning(화재)
siege(공성)
plague(역병)
abandoned(버려짐)
construction(건설 중)
```

---

# 43. Ownership(소유권)과 Control(통치권)

장기적으로:

```text
Owner(소유자)
Controller(통치자)
Operator(운영자)
```

를 분리할 수 있다.

예:

```text
왕실 소유 도시
→ A가문이 기간제 운영

A가문 영지
→ 광산은 C가문이 운영
```

Prototype(시제품)에서는 단순화 가능하지만
데이터 구조가 확장을 막으면 안 된다.

---

# 44. 영지/성/도시를 빼앗을 수 있는가

분쟁지역에서는 가능하게 한다.

하지만:

```text
클릭
→ 즉시 내 것
```

방식은 사용하지 않는다.

향후:

```text
War Declaration(선전포고)
↓
Preparation(전쟁 준비)
↓
Siege(공성)
↓
Capture(점령)
↓
Occupation(점령 유지)
↓
Control Transfer(통치권 이전)
```

방식으로 설계한다.

---

# 45. 도시 점령 시 레벨 초기화 금지

A가문이 키운 City L5를
B가문이 점령했다고 L1로 초기화하지 않는다.

기본:

```text
도시 역사/발전도
→ 유지

통치 가문
→ 변경
```

전쟁으로 일부 시설이 손상될 수는 있다.

---

# 46. 가문을 완전히 삭제하지 않는다

전쟁 패배로:

```text
영지 상실
성 상실
도시 통치권 상실
```

은 가능하다.

하지만 House(가문) 자체를 삭제하지 않는다.

패배한 가문이 재건할 수 있는 길을 남긴다.

---

# 47. 방치 영지/성

실제 소유라고 해서
아무 비용 없이 영원히 소유하게 하지 않는다.

유지 요소 후보:

```text
식량
주둔군
유지비
치안
가문 활동
시설 유지
```

장기 방치:

```text
정상
↓
관리 부족
↓
쇠퇴
↓
폐허
↓
소유권 상실 가능
```

단기 미접속으로 즉시 박탈하지 않는다.

---

# 48. House(가문)의 정의

House(가문)는 이동 객체가 아니다.

```text
Player(플레이어)
= 월드 이동 객체

House(가문)
= 정체성 / 성장 / 소유 / 정치 단위
```

월드맵에는 House 그 자체가 돌아다니는 것이 아니라:

```text
House Seat(가문 본거지)
House Crest(가문 문장)
Banner(깃발)
Territory(영지)
Castle(성)
City(도시)
```

가 표시된다.

---

# 49. Player와 Party(파티)

현재 단계에서 `Party(파티)`를 별도 월드 이동 객체로 만들지 않는다.

현재 `Main Party(메인 파티)`는:

```text
Player 내부 Character Composition(캐릭터 편성)
```

개념으로 유지한다.

여러 실제 플레이어가 같이 이동하는 기능이 생길 때
향후 별도 Party Entity(파티 객체)를 검토한다.

---

# 50. Account(계정)와 House(가문)

초기 추천:

```text
1 Account(계정)
=
1 Primary House(대표 가문)
```

향후:

```text
분가
지부
NPC 가문
```

확장 가능하게 둔다.

---

# 51. House 기본 구조

```text
Account(계정)
└ House(가문)
   ├ Character(캐릭터)
   ├ House Level(가문 레벨)
   ├ Prestige(명성)
   ├ Regional Influence(지역 영향력)
   ├ Nobility Title(작위)
   ├ Holdings(보유 자산)
   └ House Seat(가문 본거지)
```

---

# 52. House Level(가문 레벨)

가문 레벨은:

> 가문이 얼마나 성장한 조직인가

를 나타낸다.

직접적인 공격력 폭증보다는
**기능/규모/권한/슬롯 해금** 중심으로 설계한다.

초기 추천:

```text
House Level 1~20
```

---

# 53. House Level 상승 원천

한 콘텐츠만 반복해서 올리지 않는다.

후보:

```text
Combat(전투)
Mining(채광)
Trade(거래)
Transport(운송)
Contract(계약)
Settlement Contribution(도시 기여)
Territory Development(영지 개발)
Achievement(업적)
World Event(세계 이벤트)
```

---

# 54. House Level 혜택

## L1~3 — 신생 가문

```text
가문명
가문 문장
기초 창고
기초 본거지
```

## L4~6 — 정착 가문

```text
창고 확장
생산 슬롯
운송 슬롯
본거지 확장
```

## L7~10 — 유력 가문

```text
영지 보유 자격 후보
지역 계약
가문 관리 NPC
지역 영향력 시스템
```

## L11~15 — 대가문

```text
복수 거점
대형 운송
고급 계약
도시 투자
```

## L16~20 — 주요 가문

```text
대형 영지
지역 프로젝트
주요 도시 영향
대규모 경제 활동
```

세부 수치는 후속 밸런스 설계에서 확정.

---

# 55. Prestige(명성)

Prestige(명성)는
가문의 전반적인 역사와 명성을 나타낸다.

획득 예:

```text
보스 처치
대형 계약
대규모 교역
도시 발전 기여
희귀 자원 발견
세계 이벤트
역사적 사건 참여
```

---

# 56. Regional Influence(지역 영향력)

Influence(영향력)는
특정 Region에서의 실제 영향력이다.

예:

```text
북부 영향력 340
서부 영향력 55
```

따라서:

```text
세계적으로 유명하지만
북부에는 영향력이 없는 가문
```

도 가능하다.

---

# 57. Nobility Title(작위)

House Level(가문 레벨)과
Nobility Title(작위)은 다른 값이다.

```text
House Level
= 성장도

Nobility Title
= 사회적/정치적 지위와 권리
```

---

# 58. 작위 단계 초안

```text
Untitled(무작위)
Knight(기사)
Baron(남작)
Viscount(자작)
Count(백작)
Marquess(후작)
Duke(공작)
```

세계관 최종 확정 후 명칭 변경 가능.

---

# 59. 작위의 혜택 방향

작위는 단순 능력치 버프가 아니라
**할 수 있는 것과 보유 가능한 것의 권리**를 제공한다.

예:

```text
Knight(기사)
→ 장원/특정 계약

Baron(남작)
→ 소영지/소형 요새 관리 자격

Viscount(자작)
→ 복수 소영지 / Town 운영 후보

Count(백작)
→ City / Castle 통치 후보

Marquess(후작)
→ 국경 대영지 / 대형 성채

Duke(공작)
→ 복수 도시 / 대지역 영향력
```

보유 상한은 후속 설계.

---

# 60. 작위 획득 조건

가문 레벨만 올랐다고
자동으로 작위가 오르지 않는다.

조건 후보:

```text
House Level(가문 레벨)
Prestige(명성)
Regional Influence(지역 영향력)
Territory 보유
Settlement Contribution(도시 기여)
World Achievement(세계 업적)
Royal/Faction Approval(왕실/세력 승인)
```

---

# 61. House Seat(가문 본거지)

가문은 대표 거점을 가질 수 있다.

성장 예:

```text
Camp(야영지)
→ Estate(저택)
→ Manor(장원)
→ Fort(요새)
→ Large House Seat(대형 본거지)
```

정확한 단계는 후속 확정.

---

# 62. House Crest(가문 문장)

가문마다 이미지 파일을 하나씩 만들지 않는다.

`Procedural Heraldry(조합형 문장 시스템)`을 사용한다.

구성:

```text
Shield Shape(방패 모양)
Pattern(배경 문양)
Primary Color(주색)
Secondary Color(보조색)
Sigil(상징)
Banner Shape(깃발 형태)
Title Ornament(작위 장식)
```

---

# 63. House Heraldry Atlas(가문 문장 아틀라스)

예:

```text
house-shields.webp
house-patterns.webp
house-sigils.webp
house-banners.webp
house-title-ornaments.webp
```

초기 제작 초안:

```text
Shield 6종
Pattern 8종
Sigil 20종
Banner 5종
Title Ornament 6종
```

색상은 가능하면 Tint/Shader(색상 변환)로 처리한다.

---

# 64. Item(아이템) 대분류

```text
Resource(자원)
Material(재료)
Consumable(소모품)
Tool(도구)
Weapon(무기)
Armor(방어구)
Accessory(장신구)
Trade Good(교역품)
Contract/Quest(계약/퀘스트)
Special(특수)
```

---

# 65. Rarity(아이템 등급)

초기 추천 5단계:

```text
Common(일반)
Uncommon(고급)
Rare(희귀)
Epic(영웅)
Legendary(전설)
```

등급은 기본적으로
아이템 본체를 다시 그리지 않고
Frame(프레임)으로 표현한다.

---

# 66. Tier / Promotion(티어 / 승급)

초기 추천:

```text
T1 ~ T5
```

Tier가 올라가면
아이템 본체의 디자인이 달라질 수 있다.

예:

```text
Pickaxe T1 낡은 곡괭이
Pickaxe T2 철제 곡괭이
Pickaxe T3 강철 곡괭이
Pickaxe T4 룬 곡괭이
Pickaxe T5 명장 곡괭이
```

---

# 67. Enhancement(강화)

초기 추천:

```text
+0 ~ +15
```

하지만 +0~+15 이미지를 16장 따로 만들지 않는다.

시각 단계:

```text
+0       효과 없음
+1~3     약한 Glow(광채)
+4~6     중간 Glow
+7~9     강한 Glow + Rune(룬)
+10~12   강한 Aura(오라)
+13~15   최고 Aura + Particle(입자)
```

숫자는 Text Layer(텍스트 레이어)로 표시한다.

---

# 68. 아이템 시각 합성

예:

```text
Rare Iron Sword T3 +7
```

렌더링:

```text
Sword T3 Base(본체)
+
Rare Frame(희귀 프레임)
+
Enhancement Overlay(강화 효과)
+
Text "+7"
```

---

# 69. 성장축은 서로 분리한다

다음은 하나의 Level 값으로 합치지 않는다.

```text
Character Level(캐릭터 레벨)
House Level(가문 레벨)
Nobility Title(작위)
Item Tier(아이템 티어)
Item Enhancement(아이템 강화)
Item Rarity(아이템 등급)
Settlement Level(정착지 레벨)
Castle Level(성 레벨)
Building Level(건물 레벨)
Region Development(지역 발전도)
```

---

# 70. Texture Atlas(텍스처 아틀라스) 정책

작은 반복 이미지:

```text
World Marker(월드 마커)
NPC
Monster
Resource
Settlement Miniature(정착지 미니어처)
Item
Rarity Frame
Enhancement Overlay
State Overlay
House Heraldry
UI Icon
```

은 Atlas를 기본으로 한다.

---

# 71. 개별 이미지 정책

다음은 개별 파일 권장:

```text
로그인 배경
캐릭터 대형 초상화
도시 상세 화면
성 상세 화면
던전 배경
지역 대표 일러스트
이벤트 배너
스토리 컷
```

---

# 72. Atlas Source(원본) 규격

초기 권장:

```text
Small Icon(소형 아이콘)
128 x 128 Cell

Settlement / Castle(도시 / 성)
256 x 256 Cell
```

Sheet:

```text
1024 x 1024
2048 x 2048
```

필요하면 4096 x 4096까지 가능.

모든 것을 하나의 거대한 Atlas로 합치지 않는다.

---

# 73. Atlas 파일 분리

```text
public/assets/world/atlas/

world-characters.webp
world-characters.json

world-monsters.webp
world-monsters.json

world-resources.webp
world-resources.json

world-settlements.webp
world-settlements.json

world-buildings.webp
world-buildings.json

world-transport.webp
world-transport.json

world-events.webp
world-events.json
```

아이템:

```text
public/assets/items/atlas/

item-resources.webp
item-materials.webp
item-consumables.webp
item-tools.webp
item-weapons.webp
item-armors.webp
```

공통:

```text
public/assets/common/atlas/

rarity-frames.webp
enhancement-overlays.webp
status-overlays.webp

house-shields.webp
house-patterns.webp
house-sigils.webp
house-banners.webp
house-title-ornaments.webp
```

---

# 74. Frame Key(프레임 키)

코드에 Atlas 좌표를 직접 하드코딩하지 않는다.

잘못된 방식:

```ts
x: 256,
y: 512
```

권장:

```ts
frameKey: "settlement.castle.l3"
```

좌표는 JSON/Manifest가 관리한다.

---

# 75. Asset Manifest(자산 매니페스트)

예:

```ts
{
  id: "world.settlement.castle.l3",
  atlasId: "world-settlements",
  frameKey: "settlement.castle.l3",
  category: "settlement",
  recommendedDisplaySize: [96, 96]
}
```

React Component/Pixi Renderer가
실제 파일 경로를 직접 쓰지 않게 한다.

---

# 76. World Entity와 Visual 분리

예:

```text
Entity
id = monster-1004
monsterType = wolf
level = 12
position = ...

Visual
atlasId = world-monsters
frameKey = monster.wolf.base
```

동일한 늑대 수백 마리가
같은 Frame을 공유할 수 있다.

---

# 77. 1차 World Character Atlas

```text
player
merchant
guard
traveler
worker
miner
farmer
blacksmith
innkeeper
noble
caravan_master
```

---

# 78. 1차 Monster Atlas

```text
wolf
boar
bandit
goblin
orc
skeleton
bear
```

Rank 표현:

```text
Common(일반)
Elite(정예)
Boss(보스)
Event(이벤트)
```

가능하면:

```text
Base Monster
+
Elite/Boss Overlay
```

방식 사용.

---

# 79. 1차 Resource Atlas

```text
copper
iron
coal
stone
wood
herb
fish
grain
water
```

향후 자원은:

```text
Stock(잔량)
Quality(품질)
Regen(회복)
Ownership(소유)
Danger(위험도)
```

를 가질 수 있다.

---

# 80. 1차 Settlement Atlas

```text
village.l1~l5
town.l1~l5
city.l1~l5
castle.l1~l5
outpost.l1~l3
port.l1~l3
mine.l1~l3
```

도시/성은 256 x 256 원본 Cell 권장.

---

# 81. Transport(운송) Atlas

```text
cart
wagon
caravan
ship
```

실제 운송 시스템은 후속 구현.

---

# 82. Event(이벤트) Atlas

```text
contract
danger
battle
raid
construction
discovery
world_event
```

---

# 83. 1차 Item Atlas

## Resource / Material

```text
copper_ore
iron_ore
coal
stone
wood
herb
fish
grain
copper_ingot
iron_ingot
plank
cloth
leather
rope
```

## Consumable(소모품)

```text
ration
water_flask
basic_potion
bandage
```

## Tool(도구)

```text
pickaxe.t1~t3
axe.t1~t3
fishing_rod.t1~t3
hammer.t1~t3
```

## Weapon(무기)

```text
sword.t1~t3
spear.t1~t3
bow.t1~t3
dagger.t1~t3
```

## Armor(방어구)

```text
helmet.t1~t3
armor.t1~t3
gloves.t1~t3
boots.t1~t3
shield.t1~t3
```

T4/T5는 실제 콘텐츠가 필요해질 때 제작 가능.

---

# 84. 공통 Overlay(오버레이)

```text
rarity.common
rarity.uncommon
rarity.rare
rarity.epic
rarity.legendary

enhance.none
enhance.low
enhance.mid
enhance.high
enhance.great
enhance.max

state.locked
state.equipped
state.broken
state.quest
state.favorite
```

---

# 85. Settlement State Overlay

```text
settlement.normal
settlement.prosperous
settlement.damaged
settlement.burning
settlement.siege
settlement.plague
settlement.abandoned
settlement.construction
```

---

# 86. House Heraldry Atlas

초기:

```text
Shield(방패) 6종
Pattern(패턴) 8종
Sigil(상징) 20종
Banner(깃발) 5종
Title Ornament(작위 장식) 6종
```

이 조합으로 많은 가문의 문장을 생성한다.

---

# 87. World Map LOD(지도 상세도)

거대한 월드에서
모든 객체를 항상 렌더링하지 않는다.

## Far Zoom(멀리)

```text
Region
Capital(수도)
Major City(주요 도시)
Major Castle(주요 성)
Major House Seat(주요 가문 본거지)
World Event
```

## Medium Zoom(중간)

```text
Territory
Town
Village
Mine
Dungeon
Caravan
House Crest
Resource Cluster
```

## Near Zoom(가까이)

```text
Player
NPC
Monster
Individual Resource Node
Building
Detailed Territory Border
```

---

# 88. 가문 표시 LOD

## Far

```text
House Seat Icon
House Crest
```

## Medium

```text
가문명
작위
성/도시
깃발
```

## Near

```text
영지 경계
소유 시설
개발 단계
경제/방어 상태
```

---

# 89. Territory Border(영지 경계) 표현

소유권은 원본 지도 이미지에 영구 합성하지 않는다.

구조:

```text
Base Map(기본 지도)
+
Territory Border(영지 경계)
+
House Color(가문색)
+
House Crest(가문 문장)
```

Overlay/Tint 방식으로 표현한다.

---

# 90. World Art Direction(월드 아트 방향)

현재 기본 방향:

```text
Deep Green(짙은 녹색)
Dark Navy(다크 네이비)
Muted Gold(차분한 금색)
Medieval Fantasy(중세 판타지)
Premium Strategy RPG(프리미엄 전략 RPG)
Restrained Dark Fantasy(절제된 다크 판타지)
```

월드 마커는 작은 화면에서도
실루엣만으로 분류가 가능해야 한다.

---

# 91. 이미지 제작 금지 방식

다음은 피한다.

```text
모든 객체를 개별 PNG 수천 장으로 관리
등급마다 본체 다시 제작
+1~+15 강화 이미지를 모두 별도 제작
가문마다 문장 이미지 새로 제작
도시 레벨을 단순 확대만으로 표현
가문 색상을 도시/성 이미지에 영구 합성
Atlas 좌표를 코드에 하드코딩
```

---

# 92. Item Visual Model(아이템 시각 모델)

개념:

```ts
ItemVisual {
  baseVisualKey: string;
  tier: number;
  rarity: string;
  enhancementLevel: number;
  state?: string;
}
```

렌더링 순서:

```text
Base
→ Rarity Frame
→ Enhancement Overlay
→ State Overlay
→ Enhancement Number
```

---

# 93. House Data Model(가문 데이터 모델) 방향

개념 예:

```ts
House {
  id: string;
  accountId: string;
  name: string;

  level: number;
  prestige: number;
  titleRank: string;

  crest: {
    shieldKey: string;
    patternKey: string;
    sigilKey: string;
    primaryColor: string;
    secondaryColor: string;
    bannerKey: string;
    titleOrnamentKey?: string;
  };

  seatEntityId?: string;
}
```

지역 영향력:

```ts
HouseRegionalInfluence {
  houseId: string;
  regionId: string;
  influence: number;
}
```

---

# 94. Territory Data Model 방향

```ts
Territory {
  id: string;
  regionId: string;

  sizeClass: 'small' | 'medium' | 'large';

  ownerHouseId?: string;
  controllerHouseId?: string;

  state:
    | 'dormant'
    | 'frontier'
    | 'surveyed'
    | 'claimed'
    | 'developing'
    | 'established'
    | 'contested'
    | 'declining'
    | 'abandoned';

  castleSiteIds: string[];
  settlementSiteIds: string[];
  mineSiteIds: string[];

  agriculturePotential: number;
  miningPotential: number;
  forestryPotential: number;
  tradeAccess: number;
  defensePotential: number;
  danger: number;
}
```

이 구조는 개념 설계이며 실제 Contract 적용 전 재검토한다.

---

# 95. Settlement Data Model 방향

```ts
Settlement {
  id: string;
  territoryId: string;
  regionId: string;

  type:
    | 'hamlet'
    | 'village'
    | 'town'
    | 'city'
    | 'capital';

  developmentLevel: number;

  ownerHouseId?: string;
  controllerHouseId?: string;

  population: number;
  economy: number;
  infrastructure: number;
  security: number;
  supply: number;

  state: string;
}
```

---

# 96. Castle Data Model 방향

```ts
Castle {
  id: string;
  territoryId: string;

  level: number;

  ownerHouseId?: string;
  controllerHouseId?: string;

  fortification: number;
  garrisonCapacity: number;
  supplyCapacity: number;
  patrolRadius: number;
  siegeResistance: number;

  state: string;
}
```

---

# 97. World Visual Metadata(시각 메타데이터)

```ts
WorldVisual {
  atlasId: string;
  frameKey: string;

  scale: number;
  anchorX: number;
  anchorY: number;
  zIndex: number;

  lodMin?: number;
  lodMax?: number;
}
```

소유 관련:

```ts
OwnershipVisual {
  houseId?: string;
  showCrest?: boolean;
  showBanner?: boolean;
}
```

---

# 98. 기존 v0.2와 연결

현재 v0.2에는 이미 다음이 있다.

```text
WorldEntity
World Config
Chunk
AOI
Movement
Mining Interaction
Asset Manager
PixiJS Renderer
Entity Panel
Module Registry
```

새 시스템은 기존 구조 위에 확장한다.

예:

```text
WorldEntity
→ 객체 종류/메타데이터 확장

Asset Manager
→ Atlas / Manifest 지원 확장

World Renderer
→ LOD / Territory Border / Settlement Variant

Entity Panel
→ 객체별 공통 정보 + Interaction 확장
```

기존 기능을 버리고 다시 만들지 않는다.

---

# 99. 앞으로의 구현 순서

본 문서 승인 후 바로 모든 기능을 구현하지 않는다.

권장 순서:

```text
1. World Size(월드 크기) 최종 검토
2. Region/Territory 구조 확정
3. 샘플 Region 1개 상세 설계
4. Asset Atlas 목록 확정
5. 1차 Atlas 이미지 제작
6. Atlas Loader(아틀라스 로더)
7. Asset Manifest(자산 매니페스트)
8. World Object Registry(월드 객체 등록소)
9. 샘플 Region에 여러 객체 배치
10. LOD 적용
11. 선택 / 정보 패널 공통화
12. 객체별 Interaction(상호작용) 구현
```

---

# 100. 샘플 Region 상세 설계

다음 설계 문서에서는
실제 Region 1개를 만들어 본다.

추천:

```text
Territory 12~16개
Castle Site 3~4개
City Site 1~2개
Village Site 다수
Mine
Forest
Farm
Dungeon
River
Road
Monster Zone
Resource Cluster
NPC 거점
```

각 Territory마다:

```text
크기
자원 성격
위험도
개발 잠재력
성 후보지
도시 후보지
주요 자원
```

을 지정한다.

---

# 101. 아직 구현하지 않을 것

본 문서만으로 다음을 구현하지 않는다.

```text
실제 PvP(플레이어 간 전투)
실제 공성전
실제 세금
실제 도시 선거
실제 작위 승급 공식
실제 영지 유지비 공식
실제 경제 시뮬레이션
실제 60개 Region 전체 제작
실제 가문 DB
실제 강화 확률 시스템
```

이들은 후속 설계에서 구체화한다.

---

# 102. 현재 잠정값

다음 값은 아직 변경 가능하다.

```text
World Size 약 200,000 x 120,000
Region 약 60개
Region당 Territory 평균 약 16개

House Level 1~20
Nobility Title 7단계
City Level 1~5
Castle Level 1~5

Item Rarity 5단계
Item Tier T1~T5
Enhancement +0~+15
```

Codex는 이 값을 영구 하드코딩하기 전에
별도 구현 지시를 기다린다.

---

# 103. 현재까지 방향이 확정된 항목

다음은 현재 논의 기준의 핵심 합의다.

```text
1. 월드는 매우 크게 만든다.
2. 모든 Region을 처음부터 활성화하지 않는다.
3. 사용자/가문 활동 증가에 따라 새 Region이 열린다.
4. Region과 Territory는 미리 구획한다.
5. Territory는 단일 건물이 아니라 지도상의 영역이다.
6. Territory 크기는 서로 다를 수 있다.
7. Castle/City 주요 후보지는 미리 둔다.
8. 내부 시설 일부는 동적으로 성장한다.
9. Manor는 작은 마을이 아니라 가문의 사유 거점이다.
10. City는 경제/인구 중심이다.
11. Castle은 군사/방어/통제 중심이다.
12. House는 이동 객체가 아니라 장기 성장/소유 단위다.
13. Party는 현재 별도 월드 객체로 만들지 않는다.
14. House Level과 Nobility Title을 분리한다.
15. 작위는 능력치보다 권리/자격 중심이다.
16. 안전지역은 플레이어가 영구 독점하지 않는다.
17. 안전지역은 기간제 운영권을 줄 수 있다.
18. 개척/분쟁지역은 실제 가문 소유가 가능하다.
19. 영지/성/도시는 희소하고 개수 제한이 있다.
20. 기존 Region에 무한히 영지/성을 추가하지 않는다.
21. 공간 부족 시 새 Region을 개방한다.
22. 이미 열린 Region은 다시 닫지 않는다.
23. 쇠퇴/황폐/폐허가 가능하다.
24. 도시/성은 레벨에 따라 외형이 실제로 변한다.
25. 도시를 점령해도 발전도는 기본적으로 유지한다.
26. 가문이 전쟁에서 패배해도 가문 자체는 삭제하지 않는다.
27. 아이템은 Base + Tier + Rarity Frame + Enhancement Overlay 구조다.
28. 강화 단계마다 개별 이미지를 전부 만들지 않는다.
29. 작은 반복 이미지는 Texture Atlas로 묶는다.
30. 가문 문장은 조합형으로 만든다.
31. 월드맵은 LOD에 따라 표시 객체를 다르게 한다.
```

---

# 104. 다음에 확정해야 할 설계

이 문서 다음 작업은:

`WORLDLOOM2_샘플Region_영지구획_실제배치_상세설계서_v0.1`

로 한다.

그 문서에서 다음을 실제 숫자와 배치로 확정한다.

```text
Region 한 개 실제 크기
Territory 12~16개 실제 모양
Small/Medium/Large 비율
각 영지의 특성
City Site
Castle Site
Village Site
Mine Site
Dungeon
Forest
Farm
River
Road
Monster Zone
Resource Cluster
초기 활성 영지
초기 개척 영지
안전/개척/분쟁 구역
```

이 샘플 Region을 만든 뒤
실제 Atlas 이미지와 PixiJS 렌더링을 검증한다.

---

# 105. 최종 개발 철학

Worldloom2의 World(세계)는:

> 서버 시작 시 모든 콘텐츠가 고정된 완성 지도

가 아니다.

목표는:

> 거대한 세계의 틀이 먼저 존재하고,
> 사용자와 가문의 증가에 따라 지역이 활성화되며,
> 미개척지가 영지가 되고,
> 장원이 생기고,
> 마을과 도시가 성장하고,
> 성이 세워지고,
> 가문이 흥하고 망하고,
> 통치자가 바뀌며,
> 그 모든 변화가 세계의 역사로 남는 구조

다.

자산 체계 역시 동일한 철학을 따른다.

```text
Base Atlas(기본 아틀라스)
+
Level/Tier Variant(레벨/승급 변형)
+
Frame(등급 프레임)
+
Overlay(강화/상태 효과)
+
Procedural Heraldry(조합형 가문 문장)
```

을 이용해
수천 개의 개별 이미지 파일 없이도
거대한 월드를 확장할 수 있게 한다.
