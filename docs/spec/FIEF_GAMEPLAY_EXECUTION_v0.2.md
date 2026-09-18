# WORLDLOOM2 Fief Gameplay Prototype(영지 플레이 프로토타입) v0.2
## Codex(코덱스) 실행 프롬프트

작성일: 2026-09-18  
대상 저장소: `goldsky8080/worldloom2`  
작업 브랜치: `main(메인)`  
현재 기준 구현: `/fief` v0.1 프로토타입  
현재 기준 최근 구현 커밋: `f17534a` (`feat: add instance fief dungeon management prototype`)

---

# 0. Codex(코덱스)에게

이번 작업은 새로운 대형 시스템을 만드는 작업이 아니다.

현재 `/fief`에 구현된 영지 프로토타입을 기반으로:

> **수치를 조작하는 설계 검증 화면을  
> 지도에서 문제가 발생하고 영주가 시설을 이용해 대응하는 게임 화면으로 변경한다.**

반드시 현재 저장소의 실제 코드를 먼저 읽고 작업한다.

먼저 확인:

```text
docs/spec/FIEF_SYSTEM_DESIGN_v0.2.md
docs/FIEF_PROTOTYPE.md
docs/FIEF_VALIDATION.md

src/modules/fief/model.ts
src/modules/fief/FiefPage.tsx
src/modules/fief/FiefMap.tsx
src/modules/fief/FiefModule.tsx
src/modules/fief/copy.ts
src/modules/fief/fief.css

src/tests/fief.test.ts
e2e/fief.spec.ts

src/modules/atlas/
src/services/assets/
```

기존 구현을 버리고 새로 만들지 말고 현재 구조를 확장한다.

---

# 1. Git(깃) 작업 방식

이번 프로젝트는 별도 Feature Branch(기능 브랜치)를 사용하지 않는다.

```text
main(메인) 작업
→ 테스트
→ 문서
→ 커밋
```

새 브랜치를 만들지 않는다.

작업 시작 전:

```bash
git status
git branch --show-current
git pull origin main
```

미커밋 변경은 임의로 삭제하거나 덮어쓰지 않는다.

---

# 2. 이번 v0.2 구현 범위

구현:

```text
Aether(에테르)
Monster Pressure(몬스터 압력)

Castle Patrol(성 순찰)
Dungeon Raid(던전 직접 공략)
Dungeon Contract(던전 토벌 의뢰)

Dungeon Break(던전 폭주)
Monster Wave(몬스터 웨이브)

Treasury(영지 금고)

Public Sentiment(민심)
Security(치안)
Prosperity(번영도)

게임형 Fief UI/UX(영지 UI/UX)
Developer Panel(개발자 패널)
```

구현하지 말 것:

```text
실제 King(왕) 시스템
실제 작위 경쟁
작위 인원 제한
다중 영지 관리

실제 서버 DB / 영속화 / 21일 서버 Scheduler(스케줄러)

실제 경제 Simulation(시뮬레이션)
세금 공식
시장 경제
NPC 인구 경제

실제 전투 시스템
실제 PvP / 공성전
실제 다른 사용자 매칭

World Dungeon(월드 던전) 생성/소멸
SS 이상 Multi-Party Raid(다중 파티 레이드)
```

범위 밖 기능을 미리 준비한다는 이유로 과도한 추상화도 만들지 않는다.

---

# 3. 현재 문제

현재 `/fief`는 기능 검증에는 성공했다.

이미 다음이 동작한다.

```text
City Level(도시 레벨)별 Dungeon Grade(던전 등급)

L1 → F~D
L2 → D~C
L3 → D~B
L4 → C~A
L5 → B~S

21일 Dungeon Cycle(던전 주기)
개발용 120초 Cycle

Aether(에테르)
Dungeon Raid 테스트 버튼
Dungeon Break(던전 폭주)

Castle Level(성 레벨)과 Dungeon Grade 분리
영구 Dungeon ID 유지
Cycle별 몬스터 / 보스 / 자원 변경
```

하지만 현재는 테스트 조작과 설명이 전면에 보여 게임보다 관리자 화면처럼 느껴진다.

이번 작업에서 이를 바꾼다.

---

# 4. UX(사용자 경험) 목표

플레이어가 `/fief`에 들어왔을 때:

> 내 영지에 무슨 일이 벌어지고 있고  
> 내가 성·도시·던전을 이용해서 대응해야 한다.

라고 느껴야 한다.

기본 화면은 **Fief Map(영지 지도)** 중심이어야 한다.

정상 플레이 화면에서 개발자 테스트 기능은 숨긴다.

---

# 5. 권장 화면 구조

Desktop(데스크톱):

```text
┌─────────────────────────────────────────────────────────────┐
│ 새벽물결 영지                         Gold 10,000            │
│ 민심 72     치안 68     번영 61       Cycle D-4             │
├───────────────────────────────────────┬─────────────────────┤
│                                       │                     │
│              Fief Map                 │ Context Panel       │
│                                       │                     │
│        [Castle]                       │ 선택한 시설 정보     │
│            │                          │                     │
│    [Manor]──[City]                    │ 행동 버튼            │
│                  \                    │                     │
│                   [Dungeon ⚠]         │                     │
│                                       │                     │
└───────────────────────────────────────┴─────────────────────┘
```

Mobile(모바일):

```text
상단 영지 HUD
→ 영지 지도
→ 선택 시설 Bottom Sheet(하단 패널)
```

412px 폭에서 가로 스크롤이 없어야 한다.

---

# 6. 기본 HUD(상단 상태)

정상 플레이 화면 상단에는 핵심 상태만 표시한다.

```text
Fief Name(영지명)
Treasury(영지 금고)
Public Sentiment(민심)
Security(치안)
Prosperity(번영도)
현재 Dungeon Grade(던전 등급)
현재 위험 경고
```

초기값은 한 곳의 `PROTOTYPE_CONFIG`로 관리한다.

예시:

```text
Treasury          10,000
Public Sentiment      70
Security              70
Prosperity            60
```

모두 밸런스 확정값이 아니다.

---

# 7. 시설 클릭

지도에 기존:

```text
Castle(성)
City(도시)
Manor(장원)
Dungeon(던전)
```

을 유지한다.

시설을 클릭하면 해당 `Context Panel(상황 패널)`을 연다.

모든 정보를 한 화면에 펼치지 않는다.

---

# 8. Castle(성)

Castle(성)의 역할:

```text
Garrison(주둔군)
Patrol(순찰)
Security(치안)
Dungeon 외곽 Monster Pressure 억제
Monster Wave 방어
```

패널:

```text
현재 병력 / 최대 병력
현재 순찰 상태

[병사 모집]
[던전 주변 순찰]
```

## 병사 모집

실제 병사 생산 시스템은 만들지 않는다.

Prototype 규칙:

```text
Treasury 감소
Garrison 증가
```

예시 임시값:

```text
비용 500 Gold
병사 +20
```

Config 상수로 분리한다.

## Castle Patrol(성 순찰)

```text
Treasury 감소
→ Patrol 상태
→ 지도에서 Castle → Dungeon 순찰 연출
→ Monster Pressure 감소
```

중요:

> Castle Patrol은 Aether를 감소시키면 안 된다.

---

# 9. Monster Pressure(몬스터 압력)

새 상태값:

```text
Monster Pressure
0 ~ 100
```

의미:

```text
Aether
→ Dungeon 내부 위험

Monster Pressure
→ Dungeon 밖 영지에 누적되는 몬스터 활동
```

시간에 따라 증가한다.

Dungeon Grade가 높을수록 더 빠르게 증가할 수 있다.

복잡한 밸런스 공식은 만들지 말고 Config 값으로 둔다.

UI 단계 예:

```text
0~34    안정
35~64   증가
65~84   위험
85~100  매우 위험
```

Aether와 시각적으로 구분한다.

---

# 10. Dungeon(던전) 패널

정상 플레이 정보:

```text
고대 지하궁전
Grade A

Aether             82 / 100
Monster Pressure   67 / 100
다음 Cycle         4일 13시간

몬스터
언데드

Boss
리치

주요 자원
에테르 원석

[직접 공략]
[토벌 의뢰 등록]
```

현재 테스트용 `에테르 -35` 같은 표현은 정상 UI에서 제거한다.

---

# 11. Dungeon Raid(던전 직접 공략)

실제 Combat(전투)는 연결하지 않는다.

하지만 즉시 감소 버튼 대신 게임 흐름을 만든다.

```text
[직접 공략]
→ Raid Preparation(공략 준비)
→ 짧은 Progress(진행)
→ 공략 완료
→ Aether 감소
→ 관리 기록 생성
```

예: 5초 진행.

Prototype에서는 성공 고정 가능.

필수:

```text
공략 중 중복 실행 금지
완료 후 Aether 감소
감소량 Config 분리
```

기존 즉시 테스트 감소는 DEV 패널로 이동 가능.

---

# 12. Dungeon Contract(던전 토벌 의뢰)

실제 다른 Player(플레이어)는 아직 연결하지 않는다.

**Simulated Adventurer Party(가상 모험가 파티)** 로 흐름을 검증한다.

```text
토벌 의뢰
보상금 1000 Gold
목표: Dungeon Aether 안정화

[의뢰 등록]
```

상태:

```text
NONE
→ POSTED(등록됨)
→ ACCEPTED(수락됨)
→ IN_PROGRESS(공략 중)
→ SUCCEEDED(성공)
```

Deterministic(결정론적)하게 처리한다.

예:

```text
등록
→ 3초 후 가상 파티 수락
→ 5초 후 공략 완료
→ Aether 감소
```

Random(무작위) 성공/실패는 넣지 않는다.

의뢰 등록 시 Treasury에서 보상금을 차감한다.

잔액 부족 시 등록 불가.

---

# 13. Treasury(영지 금고)

완전한 경제 시스템은 만들지 않는다.

이번에는 행동 비용만 검증한다.

사용처:

```text
병사 모집
Castle Patrol
Dungeon Contract
```

정상 플레이 UI에는 돈 생성 버튼을 두지 않는다.

DEV 패널에는 테스트용:

```text
Treasury +5000
```

가능.

---

# 14. Dungeon Break(던전 폭주)

기존 규칙 유지:

```text
Aether = 100
→ Dungeon Break
```

중요:

> Monster Pressure 100을 Dungeon Break Trigger(발동 조건)로 바꾸지 않는다.

---

# 15. Monster Wave(몬스터 웨이브)

Dungeon Break 발생 시 단순 Alert(경고)만 띄우지 않는다.

지도에서 실제 Wave 연출:

```text
Dungeon 위치
→ Monster Icon 3~5개
→ Dungeon → City 경로 이동
→ City 도착
→ 영지 상태 피해
```

현재 SVG/CSS/React 구조를 우선 활용한다.

새 애니메이션 라이브러리는 추가하지 않는다.

Prototype 피해 예:

```text
Public Sentiment -5
Security         -8
Prosperity       -3
```

Config로 분리한다.

한 Break에서 Wave Damage가 중복 적용되지 않게 한다.

Aether를 100 미만으로 내린 뒤 다시 100에 도달하면 새로운 Break/Wave 가능.

---

# 16. Monster Pressure와 Wave

Monster Pressure는 Break 발동 조건이 아니다.

첫 Prototype에서는 Wave의 시각적 강도에만 일부 반영한다.

예:

```text
Pressure 낮음 → Monster Icon 적음
Pressure 높음 → Monster Icon 많음
```

복잡한 피해 공식은 만들지 않는다.

---

# 17. City(도시) 패널

표시:

```text
City Level
Public Sentiment
Security
Prosperity
현재 상태
```

정상 플레이 화면에서 City Level Dropdown(드롭다운)을 제거한다.

City Level 테스트는 DEV 패널로 이동한다.

실제 City Upgrade(도시 업그레이드)는 이번 범위가 아니다.

---

# 18. Manor(장원) 패널

Manor(장원)는 영지 보고/행정 중심으로 사용한다.

표시:

```text
Treasury
현재 경고 수
최근 영지 사건
Dungeon 상태 요약
Castle 상태 요약
City 상태 요약
```

실제 정책, 관리자 NPC, 창고 기능은 만들지 않는다.

---

# 19. 지도 시각 상태

기존 `FiefMap.tsx`를 최대한 재사용한다.

Aether 높음:

```text
Dungeon 주변 위험 Ring(링)
Fog/Haze(안개)
Pulse(맥동)
```

중 하나 이상.

Monster Pressure 높음:

```text
Dungeon 주변 Monster Marker 증가
```

Patrol:

```text
Castle → Dungeon
Patrol Marker 이동
```

Dungeon Break:

```text
강한 위험 효과
Monster Wave
City Warning
```

을 지도에서 바로 보이게 한다.

---

# 20. 정상 플레이 UI에서 숨길 것

현재의:

```text
City Level Test
Castle Level Test
가속 테스트 주기
설계 시간 비교
시간 +30초
다음 주기 실행
영지 초기화
긴 테스트 규칙 설명
```

을 정상 화면에서 제거한다.

삭제가 아니라 Developer Panel(개발자 패널)로 이동한다.

---

# 21. Developer Panel(개발자 패널)

작은 `DEV` 버튼.

기본 닫힘.

필요 컨트롤:

```text
City Level L1~L5
Castle Level L1~L5

Pause / Resume
+30 sec
Next Cycle

Aether +20
Monster Pressure +20

Treasury +5000

Trigger Dungeon Break
Reset Fief
```

stable `data-testid`를 사용한다.

---

# 22. 기존 Dungeon Cycle 규칙 보존

반드시 유지:

```text
City L1 → F/E/D
City L2 → D/C
City L3 → D/C/B
City L4 → C/B/A
City L5 → B/A/S
```

21일 설계값 유지.

개발용 120초 Cycle 유지.

Castle Level은 Dungeon Grade 선정에 관여하지 않는다.

Forecast(예고) 기능도 깨뜨리지 않는다.

---

# 23. State Model(상태 모델)

이번 범위 상태를 명시적으로 추가한다.

예:

```text
treasury
publicSentiment
security
prosperity

garrison
monsterPressure

patrolState
raidState
contractState
waveState
```

필요하면 작은 Sub-state(하위 상태) 타입으로 분리한다.

미래 전체 게임을 예상한 과도한 ECS(엔티티 컴포넌트 시스템)는 만들지 않는다.

---

# 24. 순수 로직과 UI 분리

상태 전이는 현재처럼 `model.ts` 또는 fief 내부 순수 로직 파일에 둔다.

React 컴포넌트 안에 규칙을 몰아넣지 않는다.

테스트 가능한 함수 예:

```text
increaseMonsterPressure
startPatrol
completePatrol

startDirectRaid
completeDirectRaid

postDungeonContract
acceptDungeonContract
completeDungeonContract

triggerDungeonBreak
advanceMonsterWave
applyWaveDamage
```

실제 함수명은 코드 흐름에 맞게 정리 가능.

---

# 25. Timer(타이머)

이번에도 서버 Scheduler / 오프라인 진행 / DB 저장은 만들지 않는다.

가능하면:

```text
advanceFief(state, seconds)
```

계열에서:

```text
Cycle
Aether
Monster Pressure
Patrol
Raid
Contract
Wave
```

를 함께 진행한다.

여러 `setInterval`을 각각 만들지 않는다.

---

# 26. 다국어

기존 5개 언어 유지:

```text
ko
en
ja
zh-CN
vi
```

새 문구 모두 다국어 처리.

---

# 27. Asset(자산)

현재 Atlas(아틀라스) 재사용.

사용 가능한 Frame Key(프레임 키)를 먼저 확인한다.

새 외부 이미지/애니메이션 라이브러리 추가 금지.

이번 목표는 Final Art(최종 아트)가 아니라 Gameplay UX(플레이 경험)다.

---

# 28. 시각 디자인

현재 Deep Green(짙은 녹색) + Muted Gold(차분한 금색)을 유지한다.

하지만 관리자 Dashboard(대시보드)보다:

> **중세 판타지 영지 관리 게임**

느낌이 강해야 한다.

피할 것:

```text
긴 설명 문단
모든 값 동시 노출
개발 버튼 전면 노출
큰 설정 패널 여러 개
```

선호:

```text
지도 중심
시설 클릭
Context Panel
시각적 위험 신호
짧은 행동 버튼
지도 상태 변화
```

---

# 29. Desktop / Mobile

Desktop:

```text
Map 약 65~75%
Context Panel 약 25~35%
```

Mobile:

```text
HUD
Map
Context Bottom Sheet
```

필수:

```text
412px 가로 overflow 없음
시설 터치 가능
행동 버튼 터치 가능
DEV 기본 닫힘
```

---

# 30. 접근성

기존 기준 유지.

```text
button 실제 button
progressbar aria
status / alert 적절히 사용
keyboard focus
aria-label
```

애니메이션만으로 상태 전달하지 않는다.

---

# 31. Unit Test(단위 테스트)

기존 테스트 전부 유지.

추가 최소 테스트:

```text
Monster Pressure 시간 증가

Castle Patrol
→ Treasury 감소
→ Pressure 감소
→ Aether 변화 없음

병사 모집
→ Treasury 감소
→ Garrison 증가

Direct Raid
→ 진행 완료 후 Aether 감소

Dungeon Contract
→ Treasury 부족 시 등록 불가
→ 등록
→ 수락
→ 진행
→ 완료
→ Aether 감소

Dungeon Break
→ Aether 100에서 한 번 발생
→ Wave 생성
→ City 도착 시 피해 한 번 적용
→ 같은 Break 중복 피해 없음

Aether 낮춘 뒤 재상승
→ 새 Break/Wave 가능

City Level → 기존 Grade 규칙 유지
Castle Level → Grade 선정 독립
Cycle 변경 → Dungeon ID 유지
```

---

# 32. E2E Test(브라우저 테스트)

Desktop + Mobile.

필수:

```text
1. /fief 진입
   - 지도 중심
   - DEV 기본 숨김

2. Dungeon 선택
   - Aether / Pressure / Grade
   - Raid / Contract

3. Castle 선택
   - Garrison / Patrol / 병사 모집

4. DEV로 Pressure 상승
   - 지도 Monster Marker 증가

5. Patrol
   - Treasury 감소
   - Pressure 감소
   - Aether 유지

6. Direct Raid
   - Progress
   - 완료
   - Aether 감소

7. Contract
   - 등록
   - 가상 Party 수락
   - 완료
   - Aether 감소

8. Dungeon Break
   - 지도 위험 효과
   - Monster Wave
   - City 피해
   - 민심/치안/번영 변화

9. 기존 City Level → Dungeon Grade Cycle 회귀

10. /fief → /atlas → /game 이동 오류 없음
```

기존 `/game`, `/atlas` E2E도 통과.

---

# 33. 안정성

반드시 확인:

```text
Timer cleanup
Unmount cleanup
중복 interval 방지
중복 wave damage 방지
중복 contract completion 방지
```

React warning, pageerror, unhandled promise rejection 없어야 한다.

---

# 34. 문서 업데이트

구현 후:

```text
docs/FIEF_PROTOTYPE.md
docs/FIEF_VALIDATION.md
```

업데이트.

`FIEF_PROTOTYPE.md`:

```text
Monster Pressure
Castle Patrol
Direct Raid
Simulated Contract
Monster Wave
Treasury
HUD
DEV Panel
```

설명.

`FIEF_VALIDATION.md`:

```text
Unit
Lint
Format
Build
E2E
Desktop/Mobile
Regression
발견/수정 문제
```

기록.

`docs/spec/FIEF_SYSTEM_DESIGN_v0.2.md`는 임의로 전체 재작성하지 않는다.

---

# 35. Screenshot(스크린샷)

최소:

```text
docs/screenshots/fief-gameplay-overview-desktop.png
docs/screenshots/fief-gameplay-overview-mobile.png

docs/screenshots/fief-patrol-desktop.png
docs/screenshots/fief-patrol-mobile.png

docs/screenshots/fief-contract-desktop.png
docs/screenshots/fief-contract-mobile.png

docs/screenshots/fief-wave-desktop.png
docs/screenshots/fief-wave-mobile.png
```

기존 스크린샷을 불필요하게 다시 저장해 대량 binary diff를 만들지 않는다.

---

# 36. 완료 조건

```text
[ ] /fief가 관리자 화면보다 게임 화면처럼 보임
[ ] 지도 중심
[ ] 시설 클릭 → Context Panel
[ ] DEV 기본 숨김

[ ] Aether
[ ] Monster Pressure
[ ] Castle Patrol
[ ] Garrison Prototype
[ ] Direct Raid
[ ] Simulated Dungeon Contract
[ ] Dungeon Break
[ ] Monster Wave
[ ] City 상태 피해
[ ] Treasury 비용 흐름

[ ] 기존 Dungeon Cycle 유지
[ ] City Level Grade 범위 유지
[ ] Castle Level은 Grade 결정에 미사용

[ ] Desktop
[ ] Mobile
[ ] 5개 언어

[ ] Unit Test
[ ] ESLint
[ ] Format
[ ] Build
[ ] E2E
[ ] /game /atlas Regression

[ ] FIEF_PROTOTYPE.md
[ ] FIEF_VALIDATION.md
```

---

# 37. 구현 판단 원칙

질문 1:

> 영주가 영지 문제를 보고 대응한다는 경험에 직접 필요한가?

아니면 제외한다.

질문 2:

> 실제 운영 Balance(밸런스) 값인가?

그렇다면 확정하지 말고 Prototype Config로 둔다.

질문 3:

> 향후 서버로 옮기기 쉬운가?

상태 전이를 UI와 분리하되 과도한 미래 추상화는 하지 않는다.

---

# 38. 완료 후 Codex 보고 형식

```text
1. 구현 요약

2. 주요 변경 파일

3. Fief Gameplay Loop
   - Aether
   - Monster Pressure
   - Patrol
   - Raid
   - Contract
   - Wave

4. UI/UX 변경
   - Desktop
   - Mobile
   - DEV Panel

5. Prototype Config
   - 사용한 임시 수치
   - 확정값이 아님을 명시

6. 테스트 결과
   - Unit
   - Lint
   - Format
   - Build
   - E2E
   - Regression

7. 후속 범위

8. Commit SHA
```

---

# 39. Commit(커밋)

모든 검증 통과 후 `main(메인)`에 커밋.

권장 메시지:

```text
feat: turn fief prototype into interactive management gameplay
```

가능하면:

```bash
git push origin main
```

Push 권한이 없으면 커밋까지만 하고 보고한다.

---

# 최종 핵심

이번 성공 기준은 기능 개수가 아니다.

플레이어가 `/fief`를 열었을 때:

```text
"내 영지에 던전 문제가 생기고 있네."

"성에서 순찰을 보내야겠다."

"에테르가 높으니 직접 공략할까?"

"다른 모험가에게 토벌 의뢰를 맡길까?"

"관리 실패하면 도시가 공격당하는구나."
```

라고 자연스럽게 느껴야 한다.

**이론 화면을 더 정교하게 만드는 것이 아니라 실제 영주 플레이처럼 느껴지는 작은 게임 루프를 완성하라.**
