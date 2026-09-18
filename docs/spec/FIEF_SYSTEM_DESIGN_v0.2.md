# WORLDLOOM2 영지 시스템 · 기능 설계서 v0.2

작성일: 2026-09-18  
문서 상태: DESIGN(설계 중)  
대상 저장소: `goldsky8080/worldloom2`  
기준 브랜치: `main(메인)`  
문서 용도: **영지 시스템 기능 기준서 / Codex(코덱스) 구현 전 검토용**  
대체 문서: `WORLDLOOM2_영지시스템_기능설계서_v0.1_2026-09-18.md`

> 이 문서는 즉시 전체 구현하라는 실행 프롬프트가 아니다.  
> 먼저 기능 방향을 확정하고, 이후 별도의 단계별 구현 프롬프트로 개발한다.  
> 현재 단계에서는 경제 수치, 세금, 유지비, 반란 확률, 작위별 정확한 영지 개수 등을 확정하지 않는다.
>
> v0.2에서는 **City Level(도시 레벨)에 따른 Fief Dungeon Grade(영지 던전 등급) 범위**,  
> **21일 Dungeon Cycle(던전 주기)**, **Castle Level(성 레벨)의 관리 능력 역할**,  
> **S급 초과 World Dungeon(월드 던전)과 Multi-Party Raid(다중 파티 레이드)** 방향을 추가했다.

---

# 1. 개발 방식

Worldloom2는 당분간 별도 Feature Branch(기능 브랜치)를 사용하지 않고 `main(메인)`에서 계속 개발한다.

기본 진행 방식:

```text
설계
↓
사용자 검토
↓
Codex(코덱스) 단계별 구현
↓
자동 테스트
↓
main(메인)에 커밋
↓
ChatGPT가 GitHub main(메인) 실제 코드 검토
↓
사용자 직접 플레이 확인
↓
수정 또는 다음 단계
```

한 번에 큰 기능을 넣지 않는다.

각 단계는 가능한 한 작은 Commit(커밋) 단위로 나눈다.

예:

```text
docs: add fief system design
feat: add fief prototype page
feat: add fief dungeon aether state
feat: add fief dungeon cycle preview
feat: add castle patrol prototype
feat: add dungeon contract prototype
```

---

# 2. 영지 시스템의 핵심 방향

Worldloom2의 Territory(영지)는 공용 월드맵에 플레이어마다 직접 배치되는 땅이 아니다.

작위를 받은 플레이어에게 왕이 하사하는 **Instance Fief(인스턴스 영지)** 로 구성한다.

```text
World Map(공용 월드맵)
│
├ Kingdom(왕국)
│   ├ King(왕)
│   ├ 공용 도시
│   ├ 공용 필드
│   ├ World Dungeon(월드 던전)
│   └ 일반 플레이어 활동
│
└ Nobility(귀족 플레이어)
    ↓
Instance Fief(인스턴스 영지)
```

영지는 작위를 가진 플레이어에게 추가로 열리는 Management Layer(경영 계층)다.

영지를 갖지 않은 일반 플레이어도 게임의 핵심 콘텐츠를 충분히 즐길 수 있어야 한다.

---

# 3. Kingdom(왕국)과 King(왕)

World(세계)에는 여러 Kingdom(왕국)이 존재할 수 있다.

각 왕국에는 원칙적으로 King(왕)이 1명 존재한다.

왕은 왕국 내의 제한된 Nobility Title(작위)를 수여하고, 작위에 따라 Instance Fief(인스턴스 영지)를 하사할 수 있다.

초기 구현에서 왕을 Player(플레이어)로 할지 NPC(비플레이어 캐릭터)로 할지는 확정하지 않는다.

---

# 4. Nobility Title(작위)

왕이 수여할 수 있는 작위의 수는 제한한다.

따라서 작위는 단순한 이름표가 아니라 플레이어들이 경쟁해서 얻는 중요한 권한이 된다.

현재 후보 작위:

```text
Knight(기사)
Baron(남작)
Viscount(자작)
Count(백작)
Marquess(후작)
Duke(공작)
```

정확한 작위별 인원 제한은 아직 확정하지 않는다.

현재 방향은 상위 작위일수록 Instance Fief(인스턴스 영지)를 약 1~3개까지 관리할 수 있도록 하는 것이다.

예시일 뿐 확정값이 아님:

```text
하위 귀족 → 영지 1개
중위 귀족 → 영지 최대 2개
상위 귀족 → 영지 최대 3개
```

작위별 정확한 영지 수는 실제 영지 기능이 동작한 뒤 결정한다.

---

# 5. Instance Fief(인스턴스 영지)

작위를 받은 플레이어에게 개인 관리용 인스턴스 영지가 활성화된다.

영지 최초 지급 시 주요 성장 시설은 Level 1(레벨 1)에서 시작한다.

현재 핵심 구성:

```text
Instance Fief(영지)
├ Castle(성) L1
├ City(도시) L1
├ Manor(장원) L1
└ Fief Dungeon(영지 던전) 1개
```

중요:

- Castle(성), City(도시), Manor(장원)는 성장 Level(레벨)을 가진다.
- Fief Dungeon(영지 던전)은 고정 성장 레벨 대신 **Grade(등급: F~S)** 개념을 사용한다.
- Dungeon Grade(던전 등급)는 영구 고정값이 아니라 **Dungeon Cycle(던전 주기)** 마다 변할 수 있다.

현재 방향에서는 **영지마다 영구 Dungeon(던전)을 정확히 1개** 둔다.

던전 개수를 랜덤 1~3개로 만들지 않는다.

이유:

- 영지 간 기본 관리 난이도 격차를 줄인다.
- 상위 작위가 영지 3개를 보유해도 관리 대상 영구 던전은 최대 3개로 예측 가능하다.
- 던전 수가 아니라 Grade(등급), Type(종류), 몬스터, 자원, Aether(에테르) 특성으로 영지 개성을 만든다.
- 영지 경영이 던전 관리만 하는 게임이 되는 것을 막는다.

향후 Event(이벤트)로 Temporary Rift(임시 균열), Temporary Sub-Dungeon(임시 하위 던전) 등이 발생할 수 있으나 기본 영구 던전은 1개다.

---

# 6. Castle(성)

Castle(성)의 핵심 역할은 경제 수익이 아니라 군사와 방어다.

주요 역할 후보:

```text
Garrison(주둔군)
Patrol(순찰)
Security(치안)
Dungeon Perimeter Control(던전 외곽 통제)
Monster Suppression(몬스터 억제)
Wave Defense(몬스터 웨이브 방어)
```

성은 처음 L1에서 시작하고 플레이어가 투자하여 성장시킨다.

중요 설계 원칙:

> **City Level(도시 레벨)은 어떤 Dungeon Grade(던전 등급)가 등장할 수 있는지를 결정하고,  
> Castle Level(성 레벨)은 그 던전을 얼마나 안정적으로 관리할 수 있는지를 결정한다.**

따라서 Castle Level(성 레벨)을 Dungeon Grade(던전 등급) 추첨 조건에 직접 사용하지 않는다.

예:

```text
City L5
→ B~S급 Dungeon 출현 가능

Castle L2
→ 강한 Dungeon이 등장했을 때
   주둔군 / 순찰 / 웨이브 방어 능력이 부족할 수 있음
```

이 구조를 통해 플레이어가 City(도시)만 일방적으로 성장시키지 않고 Castle(성)도 함께 관리하도록 유도한다.

정확한 병사 수, 유지비, 방어 수치는 아직 확정하지 않는다.

---

# 7. City(도시)

City(도시)는 영지의 주민과 경제 중심이다.

초기 역할 후보:

```text
Population(인구)
Prosperity(번영)
Public Sentiment(민심)
Production(생산)
Trade(교역)
Tax Base(세원)
```

도시는 L1에서 시작한다.

도시 레벨은 영지 경제뿐 아니라 **Fief Dungeon(영지 던전)이 가질 수 있는 Grade(등급) 범위**에도 영향을 준다.

현재 설계 기준:

| City Level(도시 레벨) | Fief Dungeon Grade(영지 던전 등급) 출현 범위 |
|---|---|
| L1 | F ~ D |
| L2 | D ~ C |
| L3 | D ~ B |
| L4 | C ~ A |
| L5 | B ~ S |

이 표는 현재 프로토타입 설계 기준이며 실제 플레이 후 밸런스 조정할 수 있다.

핵심 의도:

- 새 영주가 처음부터 S급 Dungeon(던전)을 받아 관리 불가능해지는 문제를 방지한다.
- City(도시)를 성장시킬수록 더 높은 가치와 더 높은 위험을 가진 Dungeon(던전)이 출현할 가능성이 생긴다.
- L5라고 해서 S급만 나오는 것이 아니라 B~S 범위에서 변동하도록 한다.
- 더 좋은 Dungeon(던전)은 더 큰 수익 잠재력과 더 큰 관리 부담을 동시에 가진다.

현재 단계에서는 세금 공식, 인구 증가 공식, 생산 공식, 시장 수수료, 영지 순이익은 확정하지 않는다.

---

# 8. Manor(장원)

Manor(장원)는 영주의 개인 관리 거점이다.

초기 역할 후보:

```text
영지 관리 메뉴
관리자 배치
개인 창고
영주 정책
영지 상태 확인
향후 NPC Steward(관리관) 배치
```

장원도 L1에서 시작한다.

---

# 9. Fief Dungeon(영지 던전)

영지 던전은 영지 시스템의 핵심 콘텐츠다.

핵심 원칙:

```text
영구 존재
영지 귀속
파괴 불가
완전 제거 불가
지속 관리 필요
위험과 부를 동시에 제공
영지마다 기본 1개
Grade(등급)는 F~S
```

Dungeon(던전) 자체의 장소와 정체성은 영구적으로 유지한다.

예:

```text
고대 지하궁전
```

이라는 던전이 있다면 21일이 지나도 그 던전이 없어지고 다른 위치에 새 던전이 생기는 것이 아니다.

대신 Dungeon Cycle(던전 주기)에 따라 내부 상태가 변화한다.

변화 가능 항목:

```text
Dungeon Grade(던전 등급)
Monster Composition(몬스터 구성)
Boss(보스)
Resource Table(자원 구성)
Aether Characteristic(에테르 특성)
특수 Event(이벤트)
```

예:

```text
Cycle 1
고대 지하궁전 / D급 / 고블린 중심

Cycle 2
고대 지하궁전 / B급 / 오크·트롤 중심

Cycle 3
고대 지하궁전 / A급 / 언데드 중심
```

단, 새 Cycle(주기)의 Grade(등급)는 항상 현재 City Level(도시 레벨)의 허용 범위 안에서 결정한다.

---

# 10. Dungeon Cycle(던전 주기)

Fief Dungeon(영지 던전)은 **21일(3주)** 을 기본 Cycle(주기)로 사용한다.

```text
Dungeon Cycle 시작
↓
현재 City Level 확인
↓
허용 Grade 범위 결정
↓
해당 범위 안에서 이번 Cycle Grade 결정
↓
21일 동안 운영
↓
Cycle 종료
↓
현재 City Level을 다시 확인
↓
다음 Cycle Grade 결정
```

예:

```text
City L1
→ F~D

City L3
→ D~B

City L5
→ B~S
```

현재 설계에서는 **21일마다 Grade(등급)를 다시 결정**한다.

단, 정확한 Grade 선정 방식은 아직 미확정이다.

후보:

```text
완전 Random(무작위)
가중 Random(가중 무작위)
이전 Grade 일부 반영
최근 영지 관리 성과 반영
왕국 / 월드 상태 반영
```

첫 프로토타입에서는 단순 Random(무작위) 또는 고정 시퀀스로 검증하고, 실제 운영 규칙은 이후 결정한다.

## Cycle 예고

던전 등급 변경이 갑자기 발생해서 대응 불가능한 상황이 생기지 않도록 다음 Cycle(주기)을 미리 예고하는 방향을 사용한다.

예:

```text
현재 Dungeon: A급
남은 Cycle: 3일 14시간

다음 Cycle 허용 범위: B~S
Aether Distortion(에테르 변동) 분석 중
```

Cycle 종료가 가까워지면 다음 Dungeon Grade(던전 등급)를 미리 확정해서 보여줄 수 있다.

예:

```text
다음 Dungeon: S급
출현까지: 23시간 48분
```

정확히 며칠 전에 확정 공개할지는 아직 결정하지 않는다.

---

# 11. Aether(에테르)와 Dungeon Break(던전 폭주)

던전에는 Aether(에테르) 수치가 존재한다.

에테르는 시간이 지나면 자연스럽게 상승한다.

```text
Aether
0 ------------------------------ 100
```

플레이어가 Dungeon Raid(던전 공략)를 하면 Aether(에테르)를 낮출 수 있다.

Aether(에테르)가 높아질수록 던전은 위험해진다.

프로토타입 상태 예:

```text
Stable(안정)
Unstable(불안정)
Danger(위험)
Critical(폭주 임박)
Dungeon Break(던전 폭주)
```

정확한 구간값은 테스트용 임시값으로만 사용한다.

Aether(에테르)가 최대치에 도달하면 Dungeon Break(던전 폭주)가 발생한다.

```text
Dungeon
↓
Monster Wave(몬스터 웨이브)
↓
영지 내부로 확산
↓
도시 / 농업 / 교역 / 치안 / 시설에 피해
```

초기 프로토타입에서는 실제 복잡한 파괴 시스템을 구현하지 않아도 된다.

먼저:

```text
Aether 최대
↓
Dungeon Break 상태 발생
↓
경고 표시
↓
영지 위험 상태 변경
```

까지만 확인한다.

---

# 12. Dungeon Grade(던전 등급)의 의미

Fief Dungeon(영지 던전)의 기본 Grade(등급)는 다음 범위를 사용한다.

```text
F
E
D
C
B
A
S
```

높은 Grade(등급)는 단순히 보상이 좋은 던전이라는 뜻이 아니다.

높아질수록:

```text
몬스터 강도 ↑
Boss 위험도 ↑
희귀 자원 가능성 ↑
보상 잠재력 ↑
Aether 관리 난이도 ↑
Monster Pressure ↑
Dungeon Break 위험 ↑
필요한 플레이어 협력 수준 ↑
```

이 증가하는 구조를 목표로 한다.

따라서 S급 Dungeon(던전)은 영주에게 큰 기회이면서 큰 관리 부담이 된다.

정확한 수치 차이는 기능 확인 후 시뮬레이션한다.

---

# 13. Dungeon Monster Pressure(던전 몬스터 압력)

던전 주변에는 Monster Pressure(몬스터 압력)가 존재할 수 있다.

시간이 지나면 던전 주변 몬스터가 누적된다.

핵심 구분:

```text
Castle Patrol(성 순찰)
→ 던전 주변의 외부 몬스터 억제

Dungeon Raid(던전 공략)
→ 던전 내부 Aether 감소
```

군대를 많이 보유했다고 해서 던전 공략 자체가 완전히 대체되지는 않는다.

Dungeon Grade(던전 등급)가 높을수록 외부 Monster Pressure(몬스터 압력)도 더 강해질 수 있다.

---

# 14. 영주 혼자 관리할 수 없는 구조

중요 설계 원칙:

> 영지 던전은 영주 혼자서 장기간 완벽하게 관리할 수 없게 한다.

영주는 직접 Dungeon Raid(던전 공략)에 참여할 수 있다.

하지만 계속해서 안정 상태를 유지하려면 다른 일반 플레이어의 도움이 필요하도록 만든다.

향후 Contract Board(의뢰 게시판) / Mercenary Board(용병 게시판) / Labor Market(인력시장) 계열 시스템을 사용한다.

```text
영주
↓
던전 토벌 의뢰 등록
↓
보상금 설정
↓
일반 플레이어가 수락
↓
던전 공략
↓
Aether 감소
↓
플레이어 보상 획득
```

특히 상위 Dungeon Grade(던전 등급)가 등장한 Cycle(주기)에는 영주가 더 많은 일반 플레이어를 고용하거나 협력하도록 유도한다.

정확한 보상금이나 전리품 분배 비율은 아직 결정하지 않는다.

---

# 15. 일반 플레이어와 귀족 플레이어의 관계

작위가 없는 일반 플레이어는 영지가 없어도 충분히 성장할 수 있어야 한다.

일반 플레이어 활동 예:

```text
사냥
채광
제작
교역
운송
World Dungeon(월드 던전) 탐험
Fief Dungeon(영지 던전) 토벌 의뢰
용병 활동
```

귀족 플레이어는 위 활동에 더해:

```text
영지 관리
성 관리
도시 관리
장원 관리
군대 운영
던전 관리
다른 플레이어에게 의뢰 발주
```

가 추가된다.

Nobility(귀족)는 별도의 우월 캐릭터 클래스가 아니라 추가 Management Layer(경영 계층)를 가진 플레이어다.

---

# 16. World Dungeon(월드 던전)

World Dungeon(월드 던전)은 Fief Dungeon(영지 던전)과 완전히 분리한다.

기본 특징:

```text
공용 월드맵에 생성
위치가 영구 고정되지 않음
플레이어 누구나 탐험 가능
몬스터 / 자원 / Boss(보스) 존재 가능
자원 고갈 또는 일정 수명 후 소멸
이후 다른 위치에서 새로운 던전 생성
```

흐름:

```text
Spawn(생성)
↓
발견
↓
공략 / 채집
↓
고갈 또는 시간 만료
↓
Collapse(소멸)
↓
다른 장소에 새 Dungeon 생성
```

## Fief Dungeon과 World Dungeon의 Grade 차이

Fief Dungeon(영지 던전)은 기본적으로:

```text
F ~ S
```

범위를 사용한다.

World Dungeon(월드 던전)은 S급을 초과하는 초고등급을 가질 수 있다.

초기 후보:

```text
SS
SSS
Mythic(신화급)
World Raid(월드 레이드급)
```

정확한 명칭과 단계 수는 아직 확정하지 않는다.

S급 초과 World Dungeon(월드 던전)은 한 Party(파티)만으로 공략하는 콘텐츠가 아니라 여러 Party(파티)가 협력하는 Multi-Party Raid(다중 파티 레이드)를 목표로 한다.

예:

```text
World Dungeon: SS급

Party A
+
Party B
+
Party C
+
Party D
↓
Raid Alliance(레이드 연합)
↓
공동 공략
```

정확한 참가 인원, Party 수, 보상 분배, 경쟁/협력 규칙은 후속 설계에서 결정한다.

---

# 17. 영지 경제의 현재 원칙

영지는 경제적으로 지나치게 큰 이득을 주면 안 된다.

반대로 영지를 소유한 것이 없느니 못한 수준의 손해 콘텐츠가 되어서도 안 된다.

핵심 원칙:

> 잘 관리한 영지는 적당한 추가 이득을 주는 콘텐츠로 만든다.

수입 후보:

```text
도시 세입
생산 / 교역
던전 관련 자원
특별 이벤트
```

비용 후보:

```text
성 유지비
군대 유지비
치안 / 행정비
던전 토벌 의뢰비
시설 투자비
```

높은 Dungeon Grade(던전 등급)는 높은 잠재 수익과 높은 관리 비용을 동시에 가져야 한다.

지금은 숫자를 넣지 않는다.

먼저 실제 기능을 만든 뒤 플레이 감각을 확인하고 이후 Simulation(시뮬레이션)을 실시한다.

---

# 18. Public Sentiment(민심), Rebellion(반란), 작위 박탈

장기적으로 영지에는 Public Sentiment(민심)가 존재할 수 있다.

관리 실패가 반복되면:

```text
세금 과다
Dungeon Break 반복
Monster 피해
치안 악화
경제 악화
↓
민심 하락
↓
Unrest(불만)
↓
Rebellion(반란)
```

으로 이어질 수 있다.

심각한 반란과 장기적인 관리 실패가 계속되면 King(왕)이 Title Revocation(작위 박탈), Fief Revocation(영지 회수)을 할 수 있다.

이 시스템은 초기 프로토타입 범위가 아니다.

---

# 19. 초기 Fief Prototype(영지 프로토타입) 범위

첫 웹 프로토타입에서는 **영지 1개만** 구현한다.

테스트 플레이어가 이미 작위를 가지고 있다고 가정한다.

필요한 최소 요소:

```text
Fief(영지) 1개

Castle L1
City L1
Manor L1

Fief Dungeon 1개
Dungeon Grade
Dungeon Aether
Dungeon Status
Dungeon Cycle
```

첫 프로토타입에서 실제 동작시킬 핵심은:

```text
City Level에 따른 Dungeon Grade 범위
Dungeon Cycle 변경
Aether 시간 증가
Dungeon Raid에 의한 Aether 감소
Dungeon Break 상태
```

이다.

## 개발용 가속 모드

실제 설계 주기는 21일이지만 개발 단계에서 21일을 기다릴 수 없으므로 테스트 전용으로 Cycle(주기)을 크게 단축한다.

예:

```text
Production Design(운영 설계)
→ 21일

Prototype Test Mode(프로토타입 테스트 모드)
→ 1~2분 또는 개발자가 즉시 다음 Cycle 실행
```

테스트 모드는 실제 운영 규칙과 분리한다.

## 프로토타입에서 확인할 시나리오

```text
City L1
→ F~D 범위만 등장하는가

City Level 변경
→ 다음 Cycle의 허용 Grade 범위가 바뀌는가

Cycle 종료
→ Dungeon Grade가 범위 안에서 갱신되는가

Aether 증가
→ 위험 상태가 단계적으로 바뀌는가

Dungeon Raid
→ Aether가 감소하는가

Aether 최대
→ Dungeon Break가 발생하는가
```

Dungeon Raid(던전 공략)는 초기에는 실제 전투 시스템과 연결하지 않아도 된다.

---

# 20. 첫 프로토타입에서 구현하지 않는 것

다음은 의도적으로 후속 단계로 미룬다.

```text
실제 왕 시스템
실제 작위 경쟁
작위 인원 제한
작위별 정확한 영지 수
영지 2~3개 동시 관리
실제 세금
실제 영지 경제 공식
실제 도시 인구 시뮬레이션
실제 군대 전투
실제 Monster Wave 전투
실제 도시 시설 파괴
실제 반란
실제 작위 박탈
실제 플레이어 간 토벌 의뢰
실제 서버 DB 영속화
실제 Dungeon 보상 밸런스
실제 21일 서버 스케줄러
실제 World Dungeon 생성/소멸
실제 SS 이상 Multi-Party Raid
```

---

# 21. 기존 `/atlas`와의 관계

현재 `main(메인)`에 존재하는 `/atlas`는 월드와 객체 구조를 확인하기 위한 Atlas Preview(아틀라스 미리보기)다.

새 영지 시스템은 `/atlas`를 갈아엎지 않는다.

```text
/atlas
→ 공용 월드 / 월드 설계 확인

/fief
→ 귀족 플레이어의 Instance Fief(인스턴스 영지) 관리 프로토타입

/game
→ 기존 실제 플레이 루프
```

초기 Fief Prototype(영지 프로토타입)은 기존 `/game`의 Movement(이동), Mining(채광), Command/Event(명령/이벤트), GameRuntime(게임 런타임)을 강제로 뜯어고치지 않는다.

---

# 22. 다음 구현 단계

이 문서를 사용자가 검토한 뒤 별도 Execution Prompt(실행 프롬프트)를 작성한다.

첫 구현 목표:

```text
Fief Prototype v0.1

1. /fief 경로
2. 테스트용 영지 1개
3. Castle L1 / City L1 / Manor L1
4. Fief Dungeon 1개
5. City Level별 Dungeon Grade 허용 범위
6. 개발용 가속 Dungeon Cycle
7. Dungeon Aether 시간 증가
8. 테스트용 Dungeon Raid
9. Dungeon Break 상태
10. 데스크톱 / 모바일 화면
11. 자동 테스트
12. 기존 /game /atlas 회귀 테스트
```

구현 완료 후:

```text
main 커밋
↓
ChatGPT GitHub 코드 검토
↓
사용자 직접 웹 확인
↓
기능 방향 수정
↓
다음 단계 결정
```

---

# 23. 현재 확정 / 미확정 구분

## 현재 방향상 확정

```text
여러 Kingdom(왕국)이 존재할 수 있음
왕국마다 King(왕) 1명
왕이 줄 수 있는 Nobility Title(작위) 수는 제한

작위 플레이어에게 Instance Fief(인스턴스 영지) 제공
작위가 높아질수록 최대 1~3개 영지 관리 방향

영지에는 Castle / City / Manor / Fief Dungeon이 존재
Castle / City / Manor는 최초 L1
영지당 영구 Fief Dungeon은 1개
Fief Dungeon은 제거 불가

Fief Dungeon Grade는 F~S
City Level이 Dungeon Grade 출현 범위를 결정
L1 → F~D
L2 → D~C
L3 → D~B
L4 → C~A
L5 → B~S

Fief Dungeon은 21일 Dungeon Cycle을 기본 방향으로 사용
Cycle마다 현재 City Level 범위 안에서 Grade가 변경될 수 있음
Dungeon 자체는 사라지지 않고 내부 상태/등급/몬스터/자원이 변화

Castle Level은 Dungeon Grade를 직접 결정하지 않음
Castle은 주둔군 / 순찰 / 치안 / Monster Pressure / Wave Defense를 담당

Fief Dungeon에는 Aether가 존재
Aether는 시간에 따라 상승
Dungeon Raid로 Aether 감소
Aether 최대 시 Dungeon Break 발생

영주 혼자 장기 관리하기 어렵게 설계
다른 플레이어에게 Dungeon 토벌 의뢰 가능

World Dungeon은 생성 / 소멸하는 공용 던전
World Dungeon은 S급 초과 등급을 가질 수 있음
S급 초과 World Dungeon은 Multi-Party Raid 방향

영지 경제 수치는 실제 기능 확인 후 Simulation(시뮬레이션)
```

## 아직 미확정

```text
정확한 Kingdom 수
King이 NPC인지 Player인지
작위별 정확한 정원
작위별 영지 보유 수

Castle / City / Manor 최대 레벨
각 레벨의 업그레이드 조건

21일 Cycle에서 정확히 언제 다음 Grade를 공개할지
Dungeon Grade 선정 방식
- 완전 Random
- 가중 Random
- 이전 Grade 반영
- 관리 성과 반영 등

F~S 각 Grade의 정확한 난이도 차이
Aether 상승 속도
Dungeon Raid 감소량
Dungeon Break 세부 조건
Monster Wave 규모

World Dungeon S 초과 등급의 정확한 명칭
Multi-Party Raid 최대 인원 / Party 수 / 보상 규칙

세금
군대 유지비
토벌 의뢰 보상
민심 공식
반란 공식
작위 박탈 조건
영지 경제 순이익
```

이 미확정 항목은 웹 기능을 만들고 실제 플레이를 확인하면서 단계적으로 결정한다.
