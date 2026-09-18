# WORLDLOOM2 영지 시스템 통합 설계서 v1.0

작성일: 2026-09-18  
대상 프로젝트: `goldsky8080/worldloom2`  
현재 구현 기준: `main(메인)` / commit `f69aecc75d4c8d29478118441643286c9ffc3208`  
목적: 지금까지 확정한 `Instance Fief(인스턴스 영지)` 방향을 하나의 기준 문서로 통합한다.

---

# 1. 핵심 철학

Worldloom2의 영지는 단순한 수익 보너스가 아니다.

> **영지는 위험, 군사, 경제, 주민, 행정이 서로 연결되는 관리형 게임 콘텐츠다.**

작위를 가진 플레이어는 영지를 얻지만, 작위를 얻었다는 이유만으로 자동으로 큰 부자가 되어서는 안 된다.

좋은 운영은 적당한 이익과 안정성을 만들고, 과도한 성장 또는 관리 실패는 비용과 위험을 만든다.

일반 플레이어 역시 작위 없이 정상적인 게임을 즐길 수 있어야 한다.

---

# 2. World Map(공용 월드맵)과 Instance Fief(인스턴스 영지)

## World Map(공용 월드맵)

공용 세계에는 다음이 존재한다.

- Kingdom(왕국)
- 공용 도시와 필드
- 공용 자원
- World Dungeon(월드 던전)
- NPC / Monster(몬스터) / Player(플레이어)
- 왕국 간 관계 및 향후 전쟁

플레이어 개인 영지를 공용 Atlas(아틀라스)의 작은 소유권 폴리곤으로 수천 개 추가하지 않는다.

## Instance Fief(인스턴스 영지)

작위를 가진 플레이어가 관리하는 별도 공간이다.

영지 하나에는 기본적으로 다음 네 핵심 시설이 있다.

```text
Castle(성)
City(도시)
Manor(장원)
Fief Dungeon(영지 던전) 1개
```

Fief Dungeon은 영구 시설이며 삭제되지 않는다.

---

# 3. 네 핵심 시설의 역할

```text
Castle(성)
→ 어떻게 지킬 것인가?
→ 병력 / 모병 / 토벌 / 방어 / 부상병 관리

City(도시)
→ 얼마나 성장하고 벌 것인가?
→ 경제 / 생산 / 교역 / 세입 잠재력 / Dungeon Grade 범위

Manor(장원)
→ 어떻게 통치할 것인가?
→ 세금 / 정책 / 주민 / 행정 / 회복 지원

Fief Dungeon(영지 던전)
→ 어떤 위험과 보상이 발생하는가?
→ Aether / Dungeon Cycle / Grade / Dungeon Break
```

역할이 서로 겹치지 않게 유지한다.

---

# 4. Fief Dungeon(영지 던전)

영지마다 정확히 하나의 영구 Dungeon이 존재한다.

Dungeon 자체의 ID / 위치 / 이름은 유지된다.

변하는 것:

- Dungeon Grade(던전 등급)
- Monster 구성
- Boss
- Resource(자원)
- Cycle별 위험과 보상 성격

Grade 범위:

```text
F / E / D / C / B / A / S
```

---

# 5. City Level과 Dungeon Grade

`City Level(도시 레벨)`이 다음 Dungeon Cycle에 등장할 수 있는 Grade 범위를 결정한다.

| City Level | 허용 Dungeon Grade |
|---|---|
| L1 | F / E / D |
| L2 | D / C |
| L3 | D / C / B |
| L4 | C / B / A |
| L5 | B / A / S |

중요:

```text
City Level
→ Dungeon Grade 범위 결정

Castle Level
→ Dungeon Grade 결정에 사용하지 않음
```

City Level이 상승해도 현재 진행 중인 Dungeon Grade는 즉시 바뀌지 않는다.

```text
City Upgrade
↓
현재 Dungeon 유지
↓
다음 Dungeon Cycle
↓
새 City Level의 허용 범위 적용
```

---

# 6. Dungeon Cycle(던전 주기)

운영 설계 기준:

```text
21일
```

개발 Prototype에서는 빠른 검증을 위해 가속 시간을 사용한다.

Cycle이 바뀌어도 Dungeon 자체는 사라지지 않는다.

향후 Grade 결정은 Random(무작위), Weight(가중치), 이전 Grade, 운영 상태 등을 반영할 수 있으나 현재 운영 공식은 미확정이다.

Prototype에서는 결정론적인 Sequence(순서)를 사용해도 된다.

---

# 7. Aether(에테르)

Aether는 **Dungeon 내부 위험도**다.

```text
0 ~ 100
```

시간에 따라 증가한다.

Dungeon Raid(던전 공략) 또는 Contract(토벌 의뢰)로 낮출 수 있다.

```text
Aether 100
→ Dungeon Break(던전 폭주)
```

Aether와 Monster Saturation은 서로 다른 값이다.

---

# 8. Monster Saturation(몬스터 포화도)

기존 `Monster Pressure(몬스터 압력)` 명칭은 폐기하고 다음 용어를 사용한다.

```text
Monster Saturation(몬스터 포화도)
```

의미:

> **Dungeon 밖 영지 전역에 퍼져 있는 Monster의 밀도와 외부 위협 정도**

범위:

```text
0 ~ 100
```

Aether는 Dungeon 내부 위험이고 Monster Saturation은 영지 외부 위험이다.

---

# 9. Monster Saturation 증가

Monster Saturation은 시간이 지나면 자연스럽게 조금씩 증가한다.

Dungeon Grade가 높을수록 기본 발생 부담이 커질 수 있다.

또한:

```text
Dungeon Break
→ Monster Saturation에 1회성 대량 증가
```

가 발생한다.

Dungeon Break의 포화도 증가량은 Prototype Config(프로토타입 설정값)이며 운영 확정값이 아니다.

---

# 10. Standing Suppression Force(상시 토벌대)

영주는 Healthy Soldier(정상 병사) 중 원하는 수를 상시 토벌대로 배치한다.

```text
상시 토벌 배치 인원
→ 영주가 직접 지정
```

상시 토벌대는 반복 클릭 없이 자동으로 Monster Saturation을 억제한다.

개념:

```text
Monster Saturation 변화
=
자연 증가
- 상시 토벌 효과
+ Dungeon Break / Event 증가
```

상시 토벌 병력이 충분하면 포화도가 안정되거나 서서히 감소할 수 있다.

좋은 준비를 한 영지가 평상시에 자동으로 안정되는 것은 허용한다.

> 자동화 자체가 문제가 아니라, 준비 없이 자동으로 해결되는 구조를 피한다.

포화도가 낮을수록 실제 토벌할 Monster가 적기 때문에 토벌 효율이 낮아지는 방향을 사용하여 자연스러운 안정 구간을 만든다.

정확한 Curve(곡선)는 추후 Simulation(시뮬레이션)으로 결정한다.

---

# 11. Emergency Suppression Force(긴급 토벌대)

Dungeon Break 또는 포화도 급상승 시 영주가 직접 병력을 투입한다.

```text
영주가 투입 병력 수 지정
↓
긴급 토벌 시작
↓
짧은 시간에 Monster Saturation 크게 감소
↓
상시 토벌보다 높은 부상 / 전사 위험
```

편의 UI로 향후 25% / 50% / 75% / 최대 등의 빠른 선택을 제공할 수 있다.

토벌 중인 병사는 Castle 방어 가용 병력에서 제외한다.

---

# 12. Soldier(병사) 기본 상태

초기에는 병종을 하나만 사용한다.

Castle Level 상승에 따라 전문 병종을 해금하는 방향은 유지하되 전문 병종 자체는 후속이다.

병사 상태:

```text
Healthy(정상)
Wounded(부상)
Dead(전사)
```

## Healthy

- Castle 방어 가능
- 상시 토벌 가능
- 긴급 토벌 가능

## Wounded

- 생존 병력에는 포함
- 회복 전까지 토벌 / 방어 불가
- 일정 시간 후 자동 회복

## Dead

- 병력에서 영구 제거
- 새 Recruitment(모병) 필요

---

# 13. 병력 한도 계산

Castle 최대 병력에는 모든 **생존 병사**가 포함된다.

```text
Total Living Soldiers(총 생존 병력)
=
Healthy
+
Wounded
```

Standing Suppression / Emergency Suppression 병사는 Healthy의 일부를 임시 배치한 것이므로 중복 집계하지 않는다.

```text
Available Garrison(현재 성 방어 가용 병력)
=
Healthy
- Standing Assigned
- Emergency Assigned
```

Dead는 최대 병력 사용량에서 빠진다.

---

# 14. Recruitment(모병)

병사는 즉시 구매하지 않는다.

```text
모병 명령
↓
Recruitment Time(모병 시간)
↓
완료
↓
Healthy Soldier로 편입
```

Training Time(훈련 시간)은 별도로 두지 않는다.

초기 Prototype 원칙:

- 동시에 진행하는 Recruitment Job(모병 작업)은 1개
- 모집 인원이 많을수록 시간 증가
- Castle Level이 높을수록 최대 병력 증가
- Castle Level이 높을수록 1회 모병 최대 인원 증가
- 정확한 숫자 / 비용 / 시간은 Prototype Config

긴급 상황 직후 돈만 지불해 수백 명을 즉시 생성할 수 없게 한다.

---

# 15. Wounded Recovery(부상병 회복)

초기에는 수동 치료 시스템을 넣지 않는다.

```text
Wounded
↓
Recovery Time 경과
↓
Healthy 복귀
```

치료 아이템 / 의사 NPC / 병원 슬롯 등은 후속이다.

향후 Castle Level 또는 Infirmary(의무실)로:

- Recovery Speed(회복 속도)
- Recovery Capacity(동시 회복 능력)

를 개선할 수 있다.

---

# 16. 상시 토벌 피해

상시 토벌도 완전 무료 자동화가 아니다.

활동이 계속되면:

```text
Wounded 발생
Dead 발생
```

이 가능하다.

따라서 처음 50명을 배치했더라도 시간이 흐르며 실제 상시 토벌 인원이 줄어들 수 있다.

```text
토벌 인원 감소
↓
Suppress Effect 감소
↓
Monster Saturation 재상승 가능
```

Prototype에서는 Random(무작위)보다 Deterministic(결정론적) 누적 방식으로 구현하여 테스트 가능하게 한다.

---

# 17. Public Sentiment / Security / Prosperity

세 수치는 모두:

```text
0 ~ 100
```

이다.

## Public Sentiment(민심)

> 주민이 영주와 영지 운영을 얼마나 신뢰하고 지지하는가

연결 방향:

- Recruitment 환경
- Unrest(불만)
- 장기 Rebellion(반란) 위험
- 정책 반응

## Security(치안)

> 영지의 도로, 주민, 상인, 생산 활동이 얼마나 안전한가

연결 방향:

- 야외 활동
- 상인 이동
- 생산지 안전
- 영지 위험 Event

## Prosperity(번영도)

> 생산, 교역, 생활, 경제 활동이 얼마나 건강한가

연결 방향:

- 세입
- 생산
- Trade(교역)
- City 성장

중요:

```text
Treasury(영지 금고)
≠
Prosperity(번영도)
```

Treasury는 현재 돈이고 Prosperity는 경제의 건강도다.

---

# 18. 상태 구간

세 수치는 공통 4단계 UI를 사용한다.

```text
80 ~ 100  안정
60 ~ 79   주의
30 ~ 59   불안
0  ~ 29   위기
```

`주의`는 강한 페널티보다 경고와 징후 중심이다.

실제 의미 있는 Gameplay 페널티는 `불안`부터 커진다.

정확한 Percentage(퍼센트)는 아직 확정하지 않는다.

---

# 19. 차감 속도 차이

Monster Saturation이 높게 유지될 때:

```text
Security
→ 가장 빠르게 하락

Prosperity
→ 중간 속도로 하락

Public Sentiment
→ 가장 천천히 하락
```

짧은 사고는 주로 Security에 영향을 주고,
오랫동안 방치할수록 Prosperity와 Public Sentiment까지 무너진다.

Monster Saturation 100이 유지되면 세 상태 모두 시간에 따라 지속적으로 피해를 받는다.

한 번만 감소하고 끝나는 구조가 아니다.

---

# 20. 회복 속도와 조건

문제를 해결했다고 즉시 원상복구되지 않는다.

```text
원인 해결
↓
Stability Period(안정 기간)
↓
점진 회복
```

## Security

조건 방향:

- Monster Saturation이 안전권
- Dungeon Break / Monster Wave 없음
- Healthy 가용 병력 존재

세 수치 중 가장 빨리 회복한다.

## Prosperity

조건 방향:

- Monster Saturation 안정
- 큰 Monster 사고 없음
- Security가 안정적인 상태를 일정 기간 유지

중간 속도로 회복한다.

## Public Sentiment

조건 방향:

- Monster Saturation 안정
- Dungeon 사고 없음
- Security 안정
- Prosperity가 심각한 위기 상태가 아님
- 장기간 안정 유지

가장 늦고 느리게 회복한다.

---

# 21. Stability Period(안정 기간)

Prosperity와 Public Sentiment 회복에는 Stability Period를 사용한다.

안정 기간 누적 중 큰 사고가 다시 발생하면 Reset(초기화)될 수 있다.

```text
안정 유지
↓
회복 조건 준비
↓
Dungeon Break 발생
↓
안정 기간 Reset
```

세 상태 모두 자연 관리만으로 100까지 회복 가능하다.

다만 80 이상에서는 회복 속도를 크게 낮춰, 100이 장기간 잘 관리된 영지라는 의미를 갖게 한다.

---

# 22. 상태 간 무한 악순환 금지

다음과 같은 직접 무한 연쇄는 만들지 않는다.

```text
Security 하락
→ Prosperity 자동 하락
→ Public Sentiment 자동 하락
→ Security 추가 하락
→ 반복
```

공통 원인 또는 실제 Gameplay 시스템을 통해 간접 연결한다.

예:

```text
낮은 Security
→ 실제 상인 이동 감소
→ 실제 Trade 감소
```

같은 연결은 향후 실제 경제 시스템이 존재할 때 사용 가능하다.

---

# 23. Rebellion(반란) 방향

Public Sentiment 0~29가 되었다고 즉시 반란이 일어나지 않는다.

장기 방향:

```text
민심 위기 장기 지속
↓
Unrest 누적
↓
Rebellion Risk 증가
↓
조건 충족 시 반란
```

현재 Prototype 범위에서는 Rebellion을 구현하지 않는다.

---

# 24. Castle Level(성 레벨)

Castle은 군사 및 위험 대응력을 성장시킨다.

방향:

```text
Castle Level 상승
↓
최대 병력 증가
1회 모병 최대 인원 증가
전문 병종 단계 해금
토벌 대응 능력 확대
부상병 회복 능력 확장 가능
Castle Defense 향상
```

개념적 해금 구조:

| Level | 방향 |
|---|---|
| L1 | 기본 병사 / 모병 / 상시 토벌 / 긴급 토벌 |
| L2 | 병력 규모 증가 / 첫 전문 병종 후보 |
| L3 | 중규모 군사 / 회복 계열 확장 |
| L4 | 대규모 군사 / 고급 군사 기능 |
| L5 | 최고 군사 운용 |

정확한 병력 수와 병종은 미확정이다.

---

# 25. City Level(도시 레벨)

City는 경제와 성장, Dungeon Grade 잠재력을 키운다.

개념:

| Level | 방향 |
|---|---|
| L1 | 기본 경제 |
| L2 | Trade와 생산 확대 |
| L3 | 중형 도시 / 생산·상업 본격화 |
| L4 | 대형 도시 / 고급 경제 |
| L5 | 최고급 도시 / B~S Dungeon 범위 |

City 성장에는 더 높은 경제 잠재력과 더 높은 Dungeon 위험이 동시에 따라온다.

---

# 26. Castle / City 성장 관계

설계 후보:

```text
City Level ≤ Castle Level + 1
```

의도:

- 경제를 군사보다 한 단계 공격적으로 키우는 선택 허용
- Castle L1 / City L5 같은 극단적 위험 운영 차단

이 규칙은 아직 최종 확정하지 않는다.

**현재 Prototype에서 강제하지 않는다.**

---

# 27. Manor(장원)

Manor는 영지 행정의 중심이다.

작위 자체를 관리하는 곳이 아니다.

```text
Kingdom / Crown System
→ 작위 수여 / 박탈 / 왕국 정치

Manor
→ 해당 영주의 영지 운영
```

핵심:

- Tax Policy(세금 정책)
- Active Policy(활성 정책)
- 행정 상태 확인
- 주민 / 경제 / 치안 회복 보조

---

# 28. Tax Policy(세금 정책)

초기에는 세 단계로 한다.

```text
Low Tax(낮은 세율)
Normal Tax(보통 세율)
High Tax(높은 세율)
```

방향:

## Low

- Treasury 수입 감소
- Public Sentiment에 유리
- Prosperity에 유리

## Normal

- 표준 수입
- 중립

## High

- Treasury 수입 증가
- 장기 Public Sentiment 부담
- 장기 Prosperity 부담

세율 변경 즉시 민심 -10 같은 단순 효과는 피한다.

시간에 따른 지속 효과로 처리한다.

세율은 너무 자주 바꿀 수 없도록 최소 유지시간 또는 Cooldown(재설정 대기시간)을 둔다.

---

# 29. Manor Policy(장원 정책)

초기 정책 후보는 다음 다섯 개를 사용한다.

```text
Resident Relief(주민 지원)
→ Public Sentiment 회복 보조

Commerce Support(상업 지원)
→ Prosperity 회복 보조

Security Support(치안 지원)
→ Security 회복 보조

Recruitment Support(모병 지원)
→ Recruitment 시간 / 비용 / 규모 중 일부 보조

Reconstruction(재건 지원)
→ 큰 사고 이후 회복 보조
```

정책은:

```text
활성화
↓
지속 비용
↓
지속 보정 효과
```

다.

즉시 수치 +30 버튼이 아니다.

돈만 지불해 상태를 바로 100으로 만드는 구조는 금지한다.

---

# 30. Manor Level

Manor Level은 숫자 Buff(버프)보다 **행정 도구의 수와 종류**를 늘린다.

Prototype 기본 방향:

| Manor Level | 방향 |
|---|---|
| L1 | 세율 + 기본 정책 + Active Policy 1개 |
| L2 | 추가 기본 정책 |
| L3 | Active Policy 2개 + 중급 정책 |
| L4 | 고급 복구 / 위기 대응 |
| L5 | Active Policy 3개 + 최고 행정 기능 |

정확한 Unlock Table(해금표)은 Prototype 값이며 추후 조정 가능하다.

Manor는 직접 Gold 생산 건물로 만들지 않는다.

---

# 31. Treasury(영지 금고)

핵심:

```text
Player Wallet(개인 자산)
≠
Fief Treasury(영지 금고)
```

Treasury는 영지 운영 전용 자금이다.

초기 Prototype에서는 자유로운 개인 인출 기능을 구현하지 않는다.

---

# 32. Treasury 수입

장기적인 영지 수입원:

- Tax Revenue(세수)
- Trade Revenue(교역 수입)
- Production Revenue(생산 관련 수입)
- Dungeon Revenue(던전 일부 수입)
- Event Revenue(이벤트 수입)

초기 Prototype에서는 실제 NPC 경제가 없으므로,
Tax Revenue를 중심으로 한 단순 결정론적 수입 Simulation만 구현해도 된다.

개념:

```text
City Level
+ Prosperity
+ Tax Policy
↓
Prototype Tax Revenue
↓
Treasury
```

실제 Trade / Production은 후속 시스템에 연결한다.

---

# 33. Treasury 지출

주요 지출:

- Recruitment 비용
- Soldier Upkeep(병력 유지비)
- 시설 Upgrade 비용
- Policy 유지비
- Dungeon Contract 보상
- Emergency Response 비용
- 향후 Kingdom Tax / War Contribution

병사는 모병 비용뿐 아니라 유지비가 있어야 한다.

```text
병력 많음
→ 안전성 증가
→ Treasury 지출 증가
```

따라서 항상 최대 병력을 채우는 것이 정답이 아니게 만든다.

---

# 34. Treasury 부족

Treasury가 0이라고 즉시 Game Over가 되지는 않는다.

초기 대응:

- 새 Recruitment 제한
- 새 Policy 제한 또는 유지 어려움
- Upgrade 제한
- Dungeon Contract 등록 제한
- 경고 표시

급여 체납 / 탈영은 현재 범위 밖이다.

---

# 35. Dungeon Contract와 일반 플레이어 경제

장기적으로 영주는 일반 플레이어에게 Dungeon Contract를 등록할 수 있다.

```text
Aether 증가
↓
영주가 Contract 등록
↓
Treasury에서 Reward 지급
↓
일반 플레이어가 공략
↓
Aether 감소
```

이 구조를 통해 귀족 영지의 돈이 일반 플레이어에게 순환한다.

현재 Prototype의 가상 모험가 Party는 이 미래 구조의 Simulation이다.

---

# 36. 영지 경제 철학

```text
영지 수입
→ 세입 / 경제 / 일부 Dungeon 가치

영지 지출
→ 병력 / 정책 / 건설 / 의뢰 / 복구
```

목표:

> **영지는 돈을 찍는 시설이 아니라 경제를 운영해 잉여를 만드는 관리 콘텐츠다.**

---

# 37. World Dungeon(월드 던전) — 후속

공용 World Map에 동적으로 Spawn(생성)되고 소멸하는 Dungeon이다.

- 누구나 접근 가능
- 자원 / 공략 가능
- 소진 또는 수명 종료 후 사라짐
- 다른 장소에 재생성
- F~S 및 S 초과 Grade 가능
- S 초과는 Multi-Party Raid(다중 파티 레이드) 방향

현재 Fief Prototype 범위가 아니다.

---

# 38. Noble Council(귀족 평의회) — 장기 후반 콘텐츠

작위를 가진 활성 플레이어가 충분히 늘어날 때 Kingdom Governance(왕국 통치) 기능을 단계적으로 해금한다.

초기 왕국:

```text
귀족 수 적음
→ King(왕) 중심 의사결정
```

성숙한 왕국:

```text
작위 플레이어 증가
↓
Noble Council 해금
↓
Proposal(안건)
Voting(투표)
Petition(직언 / 청원)
```

가능한 안건:

- 다른 왕국 Invasion Proposal(침공 제안)
- Ceasefire Proposal(휴전 제안)
- Defense Mobilization(방어 동원)
- War Support(전쟁 지원)
- Kingdom Tax(왕국 세금)
- 외교 정책

초기 투표는 Advisory Vote(권고 투표) 중심으로 하고,
왕국 제도가 성장하면 일부 Binding Vote(구속력 있는 투표)를 해금할 수 있다.

높은 작위는 표를 무작정 여러 표 주기보다:

- 안건 발의권
- 긴급 회의 소집권
- 고급 외교 / 전쟁 안건 접근

등 권한 차이로 표현하는 방향을 우선한다.

이 시스템은 현재 구현하지 않는다.

---

# 39. 현재 코드 기준점

2026-09-18 현재 `main(메인)`의 기준 commit:

```text
f69aecc75d4c8d29478118441643286c9ffc3208
feat: turn fief prototype into interactive management gameplay
```

현재 이미 구현된 주요 기능:

- `/fief` 지도 중심 Gameplay UI
- 시설 클릭 Context Panel
- DEV 기본 숨김
- Aether
- 기존 Monster Pressure
- 병사 즉시 모집 Prototype
- 1회성 Patrol(순찰)
- Direct Raid
- Simulated Dungeon Contract
- Dungeon Break
- Monster Wave
- Treasury 비용
- Public Sentiment / Security / Prosperity의 1회성 Wave 피해
- 21일 설계 / 120초 개발 Dungeon Cycle
- 5개 언어
- Unit / E2E / Regression 검증

다음 구현은 이 기반을 폐기하지 않고 확장한다.

---

# 40. 다음 Prototype v0.3의 핵심 목표

다음 버전에서는 기존 `interactive management gameplay`를 다음 단계로 올린다.

```text
Monster Pressure
→ Monster Saturation으로 정식 전환

1회성 Patrol
→ Standing Suppression + Emergency Suppression으로 전환

즉시 Recruitment
→ Timed Recruitment로 전환

단일 Garrison 수치
→ Healthy / Wounded / Dead Lifecycle 추가

단발 Wave 피해
→ Saturation 장기 방치에 따른 지속 상태 악화 추가

상태 피해만 존재
→ 조건부 Recovery / Stability Period 추가

Treasury 비용만 존재
→ Prototype Tax Revenue + Soldier Upkeep 추가

Manor 단순 정보 화면
→ Tax Policy + Active Policy 행정 Gameplay 추가
```

---

# 41. Prototype v0.3에서 구현하지 않는 것

- 실제 Backend / DB / WebSocket
- Offline Progression(오프라인 진행)
- 실제 다른 플레이어 Contract 매칭
- 실제 전투 시스템
- 실제 인구 시스템
- 실제 Rebellion
- 작위 수여 / 박탈
- Noble Council
- Kingdom War
- World Dungeon Spawn
- Specialist Troop 실제 병종
- Infirmary 실제 시설
- Player Wallet로 Treasury 인출
- 완성형 Trade / Production 경제
- 운영 Balance 확정
- City ≤ Castle + 1 강제 규칙
- 실제 시설 Upgrade 비용 / 자원 시스템

---

# 42. Balance(밸런스) 원칙

현재 모든 구체 숫자는:

```text
Prototype Config
```

로 중앙 관리한다.

운영 확정값으로 취급하지 않는다.

우선:

1. 기능을 만든다.
2. 웹에서 직접 플레이한다.
3. 흐름이 재미있는지 확인한다.
4. 이후 Simulation으로 숫자를 조정한다.

---

# 43. 설계 완료 기준

Fief v0.3에서 플레이어가 다음 흐름을 자연스럽게 이해해야 한다.

```text
Dungeon 내부 Aether가 오른다.
↓
외부 Monster Saturation도 서서히 오른다.
↓
상시 토벌대를 배치한다.
↓
평상시는 자동 안정된다.
↓
병사가 부상 / 전사하면서 실제 토벌력이 약해질 수 있다.
↓
Dungeon Break가 터지면 Saturation이 크게 뛴다.
↓
긴급 토벌대를 보낸다.
↓
문제를 오래 방치하면 치안 → 번영 → 민심 순으로 망가진다.
↓
문제를 해결해도 즉시 복구되지 않는다.
↓
안정 기간을 유지하며 천천히 회복한다.
↓
장원에서 세금과 정책으로 운영 방향을 조절한다.
↓
병력 / 정책 / 의뢰 유지비 때문에 Treasury를 관리한다.
```

이 흐름이 보이면 다음 단계로 진행한다.
