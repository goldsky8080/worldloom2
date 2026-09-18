# WORLDLOOM2 Fief Management v0.3 · Codex 실행 프롬프트

## 0. 작업 대상

Repository:

```text
https://github.com/goldsky8080/worldloom2.git
```

현재 기준 branch:

```text
main
```

이 프롬프트 작성 시 확인된 기준 commit:

```text
f69aecc75d4c8d29478118441643286c9ffc3208
feat: turn fief prototype into interactive management gameplay
```

**반드시 작업 시작 시 실제 `main`을 다시 확인하고 최신 코드가 더 앞서 있으면 최신 `main`을 기준으로 작업한다.**

이번 작업은 새 프로젝트를 만드는 작업이 아니다.

현재 `/fief` v0.2의 지도 중심 Gameplay를 유지하면서
`Fief Management v0.3`로 확장한다.

---

# 1. 작업 시작 전

반드시 먼저 실행:

```bash
git status
git branch --show-current
git pull origin main
```

조건:

- 사용자가 만든 미커밋 작업을 덮어쓰지 말 것.
- 현재 작업 branch는 `main`을 사용한다.
- 충돌 또는 미커밋 변경이 있으면 임의로 삭제하지 말고 상태를 보고할 것.
- 기존 `/game`, `/atlas`, AssetManager, AtlasSprite, localization, test architecture를 먼저 읽을 것.

우선 확인할 파일:

```text
src/modules/fief/model.ts
src/modules/fief/config.ts
src/modules/fief/FiefPage.tsx
src/modules/fief/FiefMap.tsx
src/modules/fief/ContextPanel.tsx
src/modules/fief/DeveloperPanel.tsx
src/modules/fief/copy.ts
src/modules/fief/fief.css
src/tests/fief.test.ts
e2e/fief.spec.ts
docs/FIEF_PROTOTYPE.md
docs/FIEF_VALIDATION.md
docs/spec/FIEF_SYSTEM_DESIGN_v0.2.md
```

---

# 2. 절대 유지해야 할 기존 계약

기존 기능을 망가뜨리지 않는다.

```text
/game
→ 기존 이동 / 채광 / Command/Event 흐름 유지

/atlas
→ 기존 World Atlas 유지

/fief
→ Instance Fief 관리 Gameplay
```

유지:

- React + Vite + TypeScript + PixiJS
- 기존 AssetManager / AtlasSprite
- 기존 5개 언어
  - ko
  - en
  - ja
  - zh-CN
  - vi
- Dungeon Grade:
  - F / E / D / C / B / A / S
- City Level별 Dungeon Grade 범위:
  - L1 → F/E/D
  - L2 → D/C
  - L3 → D/C/B
  - L4 → C/B/A
  - L5 → B/A/S
- Dungeon Cycle:
  - Design 21일
  - Test 120초
- City Level 변경은 **다음 Cycle부터** Dungeon Grade 범위에 반영
- Castle Level은 Dungeon Grade 선정에 사용하지 않음
- Dungeon ID / 위치 / 이름은 영구 유지
- DEV 패널 기본 닫힘
- Desktop / Mobile 접근성
- 실제 운영 수치처럼 보이는 확정 Balance 금지

---

# 3. 이번 v0.3의 핵심

현재 v0.2의 주요 문제는 다음이다.

```text
Monster Pressure가 설계의 Monster Saturation과 다름
Patrol이 1회성 버튼
Recruitment가 즉시 완료
Garrison이 단일 숫자
부상 / 전사 / 회복 없음
Monster 상태 피해가 주로 Wave 1회성
민심 / 치안 / 번영 회복 없음
Manor 행정 Gameplay 없음
Treasury는 지출 위주이고 정기 경제 Loop가 부족
```

이번 버전에서 이 부분을 연결한다.

---

# 4. Monster Pressure → Monster Saturation 전환

사용자에게 보이는 명칭과 Domain 명칭을:

```text
Monster Saturation(몬스터 포화도)
```

로 변경한다.

가능하면 코드도 일관되게 Migration한다.

예:

```text
monsterPressure
→ monsterSaturation

pressureStatus
→ saturationStatus

pressureRate
→ saturationRate

CONFIG.pressure
→ CONFIG.saturation
```

기존 테스트가 참조하는 이름도 업데이트한다.

외부 호환성이 필요한 곳에만 최소 alias를 허용한다.

---

# 5. Aether와 Monster Saturation 분리

명확히 유지:

```text
Aether
→ Dungeon 내부 위험

Monster Saturation
→ 영지 외부 Monster 밀도
```

Aether 100만 Dungeon Break를 일으킨다.

Monster Saturation 100 자체가 Dungeon Break를 발생시키면 안 된다.

---

# 6. Monster Saturation 자연 증가

시간에 따라 자연 증가한다.

Dungeon Grade가 높을수록 증가 부담이 커질 수 있다.

현재 v0.2의 Grade 기반 자연 증가 구조를 재사용 / 정리하되
상수는 모두 `config.ts`에 둔다.

Design 21일 / Test 120초 Scale 규칙을 유지한다.

---

# 7. Dungeon Break 시 Saturation Spike

현재 Dungeon Break는 Wave를 생성한다.

v0.3에서는 추가로:

```text
Dungeon Break 발생
→ Monster Saturation 1회성 대량 증가
```

를 구현한다.

동일 Break ID에 같은 Spike를 중복 적용하면 안 된다.

수치는 Prototype Config다.

이미 출발한 Wave는 기존처럼 유지한다.

---

# 8. Standing Suppression Force(상시 토벌대)

기존 1회성 Patrol을 정상 Gameplay에서 교체한다.

영주는 Castle Panel에서:

```text
Standing Suppression Assigned Soldiers
```

수를 지정할 수 있어야 한다.

요구사항:

- Healthy Soldier만 배치 가능
- 배치 수는 영주가 변경 가능
- 상시 토벌 중 병사는 Castle Defense 가용 병력에서 제외
- 자동으로 Monster Saturation 자연 증가를 상쇄
- 충분하면 net Saturation이 감소 가능
- Saturation이 낮아질수록 실제 토벌 효율이 낮아지는 Diminishing Effect(효율 감소) 적용
- exact formula는 Prototype Config 또는 순수 함수로 중앙화
- 반복 클릭 없이 지속 동작

정상 화면에서 기존 `순찰 시작 → 6초 → -40`이 핵심 Gameplay로 남아 있으면 안 된다.

필요하면 기존 Patrol 함수는 Regression / DEV 용으로 제거 또는 Migration한다.

---

# 9. Standing Suppression Casualty(상시 토벌 피해)

상시 토벌은 무료 자동 기능이 아니다.

시간이 지나면 다음이 발생할 수 있다.

```text
Wounded
Dead
```

중요:

- Random Math.random() 기반 구현 금지
- Unit Test가 항상 같은 결과를 내도록 Deterministic(결정론적) 방식 사용
- 예: suppression exposure accumulator / fixed threshold / event boundary
- 모든 수치는 config.ts
- Casualty 발생 시 실제 Standing Assigned 숫자도 감소 가능
- Wounded는 회복 전 사용 불가
- Dead는 영구 감소

---

# 10. Soldier Model(병사 모델)

기존:

```text
garrison: number
```

중심 모델을 다음 Lifecycle로 확장한다.

필수 개념:

```text
healthy
wounded
deadTotal
standingAssigned
emergencyAssigned
```

중복 집계에 주의한다.

정의:

```text
Total Living
= healthy + wounded

Available Garrison
= healthy
- standingAssigned
- emergencyAssigned
```

Standing / Emergency 병사는 Healthy의 subset이다.

따라서 total living에 다시 더하지 않는다.

Dead는 누적 통계이며 living capacity에 포함하지 않는다.

---

# 11. Castle Capacity(성 병력 한도)

현재 Castle Level 기반 Capacity 구조를 유지 / 확장한다.

```text
Total Living <= Castle Capacity
```

Healthy + Wounded가 Capacity를 사용한다.

Standing / Emergency 배치는 추가 Capacity를 쓰지 않는다.

Castle Level 상승 시 Capacity 증가.

정확한 수치는 Prototype Config.

---

# 12. Timed Recruitment(시간제 모병)

현재 즉시 `+20` 모집 방식을 정상 Gameplay에서 교체한다.

Flow:

```text
영주가 모집 인원 지정
↓
비용 확인
↓
Recruitment Job 시작
↓
Recruitment Time 경과
↓
Healthy 병사 편입
```

요구사항:

- 동시에 Active Recruitment Job은 1개
- 모집 인원에 따라 시간 증가
- Castle Capacity 초과 금지
- 시작 시 비용 차감
- 중복 완료 / 중복 비용 차감 금지
- 완료 전 병력 증가 금지
- Training Time 별도 없음
- DEV에서 시간 진행으로 테스트 가능
- Castle Level에 따라 1회 최대 모집 인원 증가 가능
- exact formula는 config.ts

UI:

- 모집 인원 입력 또는 Stepper
- 예상 비용
- 예상 완료 시간
- 현재 진행 상태 / Progress
- 완료 후 Healthy 증가

---

# 13. Wounded Recovery(부상병 자동 회복)

초기에는 별도 치료 아이템 / 의무실 UI를 구현하지 않는다.

Flow:

```text
Wounded
↓
Recovery Time
↓
Healthy
```

요구사항:

- 자동 회복
- deterministic
- pause / +30초 / 큰 time jump에서도 정확히 처리
- 중복 회복 금지
- exact rate / interval은 config.ts
- Infirmary는 구현하지 않음

가능하면 기존 `advanceFief`의 event-boundary 구조 안에서 처리한다.

---

# 14. Emergency Suppression Force(긴급 토벌대)

Castle Panel에 별도 행동으로 구현한다.

Flow:

```text
영주가 투입 Healthy 병력 수 지정
↓
Emergency Suppression 시작
↓
일정 시간 동안 Castle 방어 가용 병력에서 제외
↓
완료
↓
Monster Saturation 크게 감소
↓
Wounded / Dead 적용
↓
생존자는 다시 가용 병력
```

요구사항:

- Active Emergency Suppression 1개
- 투입 인원 지정
- Standing Assigned와 겹치는 병력 사용 금지
- Available Garrison 범위 내에서만 시작
- 상시 토벌보다 더 빠른 Saturation 감소
- 상시 토벌보다 더 높은 casualty burden
- Random 금지
- 비용이 있다면 config.ts
- 중복 시작 / 중복 완료 금지
- progress 표시

빠른 선택 UI는 선택사항:

```text
25%
50%
75%
MAX
```

---

# 15. Fief State(영지 상태) 지속 피해

현재 Wave 도착 시 1회:

```text
Public Sentiment
Security
Prosperity
```

피해가 존재한다.

이 기능은 유지하되,
v0.3에서는 Monster Saturation 장기 방치에 따른 **지속 피해**도 추가한다.

반응 속도:

```text
Security
→ 가장 빠르게 감소

Prosperity
→ 중간

Public Sentiment
→ 가장 느리게 감소
```

특히 Saturation 100 유지 시 Tick마다 지속적으로 손상되어야 한다.

정확한 rate는 config.ts.

---

# 16. 상태 구간

공통:

```text
80~100 안정
60~79  주의
30~59  불안
0~29   위기
```

UI에서 색 / Label / 설명을 제공한다.

주의 단계는 경고 중심이다.

Percentage penalty는 운영 확정하지 않는다.

---

# 17. Recovery(회복) 시스템

문제 해결 즉시 상태가 원복되면 안 된다.

## Security

회복 조건 방향:

```text
Saturation 안전
+ Active Break 없음
+ Approaching Wave 없음
+ Available Garrison > 0
```

짧은 Recovery Delay 후 가장 빨리 회복.

## Prosperity

```text
Saturation 안정
+ Security가 안정 상태로 일정 시간 유지
```

Stability Period 후 중간 속도로 회복.

## Public Sentiment

```text
Saturation 안정
+ Security 안정
+ Prosperity 위기 아님
+ 장기간 안정
```

가장 늦게 회복.

공통:

- 큰 사고가 재발하면 Stability Timer 초기화 가능
- 100까지 자연 회복 가능
- 80 이상에서는 회복 rate 감소
- 직접 무한 cascade 금지
- 모든 threshold / rate / delay는 config.ts

---

# 18. Manor(장원) Gameplay

현재 Manor가 정보 요약 위주라면
다음 두 기능을 추가한다.

```text
Tax Policy
Active Policy
```

Manor는 작위 수여 / 박탈 시스템이 아니다.

---

# 19. Tax Policy(세금 정책)

세 단계:

```text
LOW
NORMAL
HIGH
```

효과 방향:

```text
LOW
→ Tax Revenue 낮음
→ Sentiment / Prosperity 회복에 유리

NORMAL
→ 표준

HIGH
→ Tax Revenue 높음
→ 장기 Sentiment / Prosperity 부담
```

요구사항:

- 즉시 Sentiment ±10 같은 버튼 효과 금지
- 시간에 따른 지속 효과
- Tax Change Cooldown 또는 Minimum Duration 구현
- 수치는 config.ts
- Tax Policy 변경 상태 / 남은 Cooldown UI 표시

---

# 20. Active Policy(활성 정책)

초기 Policy:

```text
RESIDENT_RELIEF
COMMERCE_SUPPORT
SECURITY_SUPPORT
RECRUITMENT_SUPPORT
RECONSTRUCTION
```

방향:

```text
Resident Relief
→ Sentiment recovery 지원

Commerce Support
→ Prosperity recovery 지원

Security Support
→ Security recovery 지원

Recruitment Support
→ Recruitment time / cost / max count 중 한 가지 또는 작은 조합 보조

Reconstruction
→ 큰 사고 후 recovery 지원
```

원칙:

- 즉시 +30 금지
- 활성 중 지속 Treasury Cost
- Active Policy Slot 제한
- Manor Level에 따라 slot:
  - Prototype 기본 방향 1 / 1 / 2 / 2 / 3
- 모든 Policy를 동시에 켤 수 없게 함
- Policy change cooldown / minimum duration
- 정확한 효과는 config.ts
- 금고 부족 시 새 Policy 활성화 금지
- 유지비 부족 처리 방식은 단순 경고 + 자동 비활성 또는 효과 정지 중 하나를 선택하고 문서화
- random 금지

Manor Level은 현재 Player-facing Upgrade를 만들지 않아도 된다.
DEV에서 L1~L5 변경 가능하게 하여 slot/unlock 검증 가능.

---

# 21. Treasury(영지 금고) v0.3

Player Wallet과 분리된 영지 운영 자금으로 유지한다.

이번 Prototype에서 실제 Player Wallet은 구현하지 않는다.

추가할 것:

## Prototype Tax Revenue

실제 NPC 경제가 없으므로 단순 결정론적 세입을 추가한다.

개념:

```text
base revenue
× City Level factor
× Prosperity factor
× Tax Policy factor
```

정확한 공식은 config.ts.

일정 Revenue Tick으로 Treasury 증가.

## Soldier Upkeep

생존 병력 또는 Healthy + Wounded 기준으로 주기적 유지비를 적용한다.

```text
병력이 많을수록
→ Upkeep 증가
```

정확한 단위 / tick은 config.ts.

금고 부족 시:

- Game Over 금지
- Soldier 즉시 삭제 금지
- 경고
- 새 Recruitment / 새 유료 Policy / Contract 등 일부 행동 차단
- 탈영은 구현하지 않음

기존 Dungeon Contract 비용은 유지한다.

정상 Gameplay 화면에는 Free Gold 버튼을 추가하지 않는다.
DEV Funding만 허용한다.

---

# 22. Building Level(시설 레벨) 처리

이번 v0.3에서는 Player-facing 실제 Upgrade Economy를 만들지 않는다.

이유:

- 건설 Resource System이 아직 확정되지 않음
- Gold-only Upgrade로 설계를 왜곡하지 않기 위함

따라서:

- City / Castle 기존 DEV Level control 유지
- Manor도 DEV에서 L1~L5 조작 가능하도록 확장 가능
- Level에 따른 Capacity / Policy Slot / Dungeon Range 등이 정상 반영되는지만 검증
- 실제 Upgrade 버튼 / 비용 / Construction Job은 후속

또한:

```text
City Level <= Castle Level + 1
```

규칙은 아직 후보이므로 이번 버전에서 강제하지 않는다.

---

# 23. Map / UI 요구

현재 v0.2의 지도 중심 화면을 유지한다.

다시 이론 문서형 Dashboard로 되돌리지 않는다.

## HUD

최소 다음 상태를 빠르게 볼 수 있어야 한다.

```text
Treasury
Public Sentiment
Security
Prosperity
Dungeon Grade
Aether
Monster Saturation
```

병력 요약도 공간이 허용되면:

```text
Healthy / Wounded / Available
```

표시.

## Castle Context Panel

- Capacity
- Healthy
- Wounded
- Dead total
- Available Garrison
- Standing Assigned
- Standing assignment control
- Recruitment Job
- Emergency Suppression
- Recovery summary

## City Context Panel

- City Level
- Dungeon Grade range
- Prosperity
- Security 관련 경제 상태 설명
- 실제 Upgrade는 DEV only

## Manor Context Panel

- Manor Level
- Tax Policy
- Tax cooldown
- Active Policies / slots
- Treasury revenue/upkeep summary
- 상태 단계 요약

## Dungeon Context Panel

기존:

- Aether
- Grade / Cycle
- Direct Raid
- Contract

유지.

---

# 24. Map Visual(지도 시각화)

기존 Map / Sprite 자산 재사용.

Monster Saturation에 따라 야외 Monster marker 수를 표시한다.

기존 pressure marker logic을 saturation으로 Migration한다.

추가 가능:

- Standing Suppression active → patrol / suppression marker
- Emergency Suppression active → 더 큰 troop marker / route
- Dungeon Break → 기존 Wave 이동 유지

새 외부 animation library를 추가하지 않는다.

가능하면 모델 시간 기반 위치 계산을 유지한다.

---

# 25. Determinism(결정론)과 시간 모델

매우 중요.

현재 model.ts의 순수 상태 전이 구조와 `advanceFief` 철학을 유지한다.

요구사항:

- 작은 Tick 여러 번과 큰 Time Jump의 결과가 같아야 함
- Event boundary 정확히 처리
- 비용 중복 차감 금지
- 완료 중복 처리 금지
- Break Spike 중복 금지
- Casualty 중복 금지
- Recovery 중복 금지
- Recruitment 중복 완료 금지
- Policy upkeep / tax revenue tick 누락 또는 중복 금지

`Math.random()` 사용 금지.

---

# 26. Pause / Visibility / Lifecycle

기존 React lifecycle 안전성을 유지한다.

- pause 시 simulation time 정지
- DEV +30초는 전체 model time을 진행
- hidden tab offline accumulation 없음
- 화면 이탈 시 listener / interval cleanup
- StrictMode에서 중복 interval 금지

이번 버전에서도 Browser persistence / DB는 추가하지 않는다.

---

# 27. Config(설정) 원칙

모든 임시 Balance 값은:

```text
src/modules/fief/config.ts
```

또는 동등한 단일 config module에 둔다.

예:

```text
saturation natural growth
break saturation spike
standing suppression effect
low saturation efficiency curve
standing casualty thresholds
emergency duration / reduction / casualty
recruit cost / count limits / time
recovery time
state damage rates
recovery delays
stability periods
tax revenue
tax multipliers
soldier upkeep
policy costs
policy effects
policy cooldown
```

운영 Balance로 확정했다는 문구 금지.

---

# 28. 반드시 구현하지 말 것

이번 범위 밖:

```text
Backend
DB
WebSocket
Offline progression
Population system
Real rebellion
Title grant/revoke
King / Noble Council voting
Kingdom war
World Dungeon spawning
SS / SSS raids
Specialist troop combat
Infirmary facility
Player Wallet withdrawal
Actual NPC trade economy
Actual production economy
Actual PvP / siege
Actual multi-player dungeon matching
City <= Castle + 1 enforcement
Player-facing building upgrade economy
```

---

# 29. Localization(다국어)

새 UI 문구도 기존 5개 언어 convention에 맞춘다.

```text
ko
en
ja
zh-CN
vi
```

한국어 UI에서 주요 용어는 다음을 사용한다.

```text
Monster Saturation → 몬스터 포화도
Standing Suppression Force → 상시 토벌대
Emergency Suppression Force → 긴급 토벌대
Healthy → 정상
Wounded → 부상
Dead → 전사
Recruitment → 모병
Recovery → 회복
Public Sentiment → 민심
Security → 치안
Prosperity → 번영도
Tax Policy → 세금 정책
```

---

# 30. Unit Test(단위 테스트)

기존 테스트 유지 + 최소 다음 케이스 추가.

## Saturation

- 자연 증가
- Dungeon Grade 영향
- Break 1회 Spike
- 동일 Break 중복 Spike 금지
- Saturation 100이 Dungeon Break를 직접 만들지 않음

## Standing Suppression

- 충분한 병력으로 net increase 감소
- 충분하면 실제 Saturation 감소
- 낮은 Saturation에서 suppression efficiency 감소
- Healthy보다 많이 배치 불가
- Standing Assigned가 Available Garrison에서 제외
- deterministic casualty
- casualty 후 assigned 감소

## Recruitment

- 시작 비용 1회 차감
- 완료 전 병력 증가 없음
- 완료 후 Healthy 증가
- 1개 Job 제한
- Capacity 검사
- 큰 time jump에서도 정확히 한 번 완료

## Recovery

- Wounded → Healthy
- Dead 회복 금지
- 큰 jump / pause correctness

## Emergency

- Available Garrison 범위 검사
- 진행 중 중복 시작 금지
- 완료 시 Saturation 감소
- casualties 적용
- 완료 중복 금지

## Fief Status

- high Saturation 지속 시 Security > Prosperity > Sentiment 순의 빠르기
- 100 지속 시 지속 피해
- 안정 조건 후 Security recovery
- Prosperity stability delay
- Sentiment longer stability delay
- 큰 사고 시 stability reset
- 80 이상 recovery slower

## Treasury / Manor

- Tax revenue tick
- LOW/NORMAL/HIGH 차이
- upkeep 차감
- insufficient funds 행동 차단
- Policy slot 검사
- policy upkeep
- policy cooldown
- 정책이 즉시 상태 +30 하지 않음

---

# 31. E2E Test(브라우저 테스트)

Desktop + Mobile에서 확인.

최소 Scenario:

### Scenario A — 평상시 자동 관리

```text
/fief 진입
→ Standing Suppression 병력 배치
→ 시간이 흐름
→ Saturation 증가가 억제되거나 감소
→ Castle panel에서 Available 감소 확인
```

### Scenario B — 병력 소모

```text
상시 토벌 장기 진행
→ Wounded / Dead 발생
→ Standing Assigned 감소 가능
→ Wounded 자동 회복
```

### Scenario C — 모병

```text
모병 시작
→ Progress 표시
→ 완료 전 병력 변화 없음
→ 완료 후 Healthy 증가
```

### Scenario D — Dungeon Break

```text
Aether 100
→ Break
→ Saturation Spike
→ Wave 출발
→ Emergency Suppression 시작
→ Saturation 감소
→ 병사 피해
```

### Scenario E — 장기 방치

```text
Saturation 높게 유지
→ Security 먼저 감소
→ Prosperity 감소
→ Sentiment 더 느리게 감소
```

### Scenario F — 회복

```text
Saturation 안정
→ Security 먼저 회복
→ Stability Period 후 Prosperity
→ 더 긴 기간 후 Sentiment
```

### Scenario G — Manor

```text
Tax Policy 변경
→ cooldown 확인
→ 시간 경과 후 Tax Revenue 차이 확인

Policy 활성
→ Treasury 지속 비용
→ Recovery support 확인
→ Slot 초과 금지
```

### Scenario H — Regression

```text
/fief → /atlas → /fief
/fief → /game
기존 atlas
기존 mining loop
5 languages
```

---

# 32. 품질 검증

프로젝트 기존 script를 확인한 뒤 실제 가능한 명령을 사용한다.

최소:

```text
Unit Test
ESLint
Prettier / Format check
TypeScript / Build
Playwright E2E
기존 /game /atlas Regression
```

새 dependency는 정말 필요하지 않으면 추가하지 않는다.

---

# 33. 문서 갱신

작업 완료 후:

```text
docs/FIEF_PROTOTYPE.md
docs/FIEF_VALIDATION.md
```

을 v0.3 기준으로 갱신한다.

새 설계 문서가 필요하면:

```text
docs/spec/FIEF_MANAGEMENT_v0.3.md
```

에 이번 구현 범위와 임시 config 값을 정리한다.

문서에는 반드시:

```text
Prototype values
운영 확정값 아님
```

을 명시한다.

---

# 34. UX 성공 기준

이번 작업의 성공 기준은 버튼 개수가 아니다.

플레이어가 `/fief`에서 다음을 이해할 수 있어야 한다.

```text
"밖에 몬스터가 늘고 있네."

"평상시는 상시 토벌대로 관리하자."

"병사가 부상해서 토벌력이 떨어지고 있네."

"모병은 시간이 필요하니까 미리 준비해야겠네."

"폭주가 터져 포화도가 확 올랐다."

"긴급 토벌대를 얼마나 보낼지 결정해야겠다."

"오래 방치해서 치안과 경제가 망가졌다."

"잡았다고 바로 복구되는 건 아니구나."

"장원에서 세금과 정책을 조절해서 회복을 도울 수 있네."

"병력과 정책 유지비 때문에 금고도 신경 써야겠네."
```

이 경험이 자연스럽게 연결되어야 한다.

---

# 35. 구현 완료 Checklist

```text
[ ] latest main 기준 확인
[ ] 사용자 미커밋 작업 보존

[ ] Monster Pressure → Monster Saturation migration
[ ] Aether와 Saturation 의미 분리 유지
[ ] 자연 Saturation 증가
[ ] Dungeon Break 1회 Saturation spike

[ ] Healthy / Wounded / Dead
[ ] Castle living capacity
[ ] Available Garrison 계산
[ ] Timed Recruitment 1 job
[ ] Wounded auto recovery

[ ] Standing Suppression
[ ] Diminishing efficiency at low saturation
[ ] deterministic standing casualty

[ ] Emergency Suppression
[ ] assigned troops unavailable during action
[ ] deterministic emergency casualty

[ ] sustained Security / Prosperity / Sentiment damage
[ ] 4 state bands
[ ] Security recovery
[ ] Prosperity Stability Period
[ ] Sentiment longer Stability Period
[ ] accident resets stability
[ ] 100 natural recovery possible
[ ] 80+ slower recovery

[ ] Tax Policy LOW/NORMAL/HIGH
[ ] tax cooldown
[ ] prototype tax revenue

[ ] Active Manor Policies
[ ] policy slots by Manor Level
[ ] policy upkeep
[ ] policy cooldown

[ ] Soldier Upkeep
[ ] insufficient Treasury handling
[ ] no free normal gold button

[ ] existing Dungeon Cycle preserved
[ ] City Grade ranges preserved
[ ] Castle not used for Grade selection

[ ] Desktop
[ ] Mobile
[ ] 5 languages
[ ] accessibility

[ ] Unit Test
[ ] Lint
[ ] Format
[ ] Build
[ ] E2E
[ ] /game regression
[ ] /atlas regression

[ ] docs updated
```

---

# 36. Commit / Push

모든 검증이 통과한 뒤 `main`에 작은 checkpoint commit을 만든다.

권장 commit message:

```text
feat: deepen fief management simulation
```

그 다음 가능하면:

```bash
git push origin main
```

Push 권한이 없으면 commit까지만 하고 명확히 보고한다.

사용자의 기존 commit을 rewrite / force push 하지 않는다.

---

# 37. 완료 후 보고 형식

Codex는 마지막에 다음 형식으로 보고한다.

```text
1. 기준 commit / 최종 commit

2. 구현 요약

3. 주요 변경 파일

4. Fief Simulation
   - Saturation
   - Soldiers
   - Recruitment
   - Recovery
   - Standing Suppression
   - Emergency Suppression

5. Territory State
   - Sentiment
   - Security
   - Prosperity
   - Damage / Recovery

6. Manor / Treasury
   - Tax
   - Policies
   - Revenue
   - Upkeep

7. Prototype Config
   - 사용한 임시 수치
   - 운영 확정값이 아님

8. 테스트 결과
   - Unit
   - Lint
   - Format
   - Build
   - E2E
   - Regression

9. 남겨둔 후속 범위

10. Commit SHA
11. Push 결과
```

---

# 최종 지시

이번 작업은 v0.2를 다시 만드는 작업이 아니다.

현재 `f69aecc`의 지도 중심 Gameplay와 기존 기능을 기반으로,
**"영주가 병력과 행정을 배치하고, 평상시는 자동 관리되지만 손실과 사고 때문에 다시 개입해야 하는 영지 운영 게임"**으로 한 단계 확장한다.

과도한 미래 추상화보다 현재 Prototype에서 직접 플레이 가능한 Loop를 완성하라.
