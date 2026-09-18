# Storage & Logistics v0.4A 검증 · 2026-09-19

기준 main: `3fadb303645c838541a78f233db617dcc181d25a`. Windows / Node 22.9.0 / 기존 React·Vite·TypeScript·Pixi / Chromium 환경입니다. 최신 main과 같은 저장소에서 진행 중인 작업이 없는 것을 확인한 뒤 시작했습니다. 새 패키지는 추가하지 않았습니다.

## 전체 검사

- 단위 **220개 / 14개 파일 통과**: 기존 167개 + 저장 모델 40개 + 권위형 Mock·runtime 통합 13개.
- ESLint, Prettier, TypeScript·운영 빌드 통과.
- 브라우저 **76개 고유 시나리오 통과**: 새 저장·물류 8개 + 기존 게임·아틀라스·영지 68개. 데스크톱 1440×900과 Pixel 7 412×839를 포함합니다.
- 기존 Pixi 청크의 500 kB 경고는 유지되며 빌드는 성공합니다.

## 모델·권위 경계

공통 stack의 기존 빈 공간 우선 채우기·장비 단위 slot·정확한 slot/weight 경계·수량 오류·빈 slot 정리·허용 수량·unknown/prototype ID 거절·실패 원자성을 확인했습니다.

개인과 도시별 창고의 Gold 6단계 20→38, Gem 12단계 38→50, 총 Gem 510, Gold 선행 조건·잔액 부족·최대 단계와 도시별 독립성을 확인했습니다. 창고에는 무게 상한을 적용하지 않으며 개인 수령에는 slot/weight를 적용합니다.

거래보관소는 도착 전/만료 후 수령 불가, FEFO·부분 수령·원래 expiry 유지·독립 Batch·수용 무제한·개인 수령 용량·전량 수령 후 알림 제거를 검사했습니다. ARRIVED/D7/D3/D1/EXPIRED 각각 한 번, 정확한 30일 소멸·긴 시간 점프의 지난 경고 생략도 검증했습니다.

배송은 거리/고정 속도, 분×무게×0.02·최소 20G·10G 반올림, 무게와 무관한 시간, 차량 없이 배송, 시작 시 한 번 차감·출발 창고에서 제거·도착 전 미지급·목적 창고 대신 Depot 도착·늦게 정산해도 실제 도착일+30일을 확인했습니다. Vehicle asset은 인벤토리와 별도이며 소유자·지역·위치·IDLE·cargo capacity·하역 수령 용량을 검사했습니다.

실제 Mock 명령에서 도시 방문과 MOVE 완료, 활동 중 도시 시설 차단, 적용 전 지연, commandId 중복 처리·변경 payload 거절, 동시 accepted 배송의 실행 시 재검증, snapshot 복구·분리 cache 갱신을 확인했습니다. client fee/시간/capacity 덮어쓰기는 strict payload schema로 거절합니다.

기존 우편으로 실제 안내를 발송하고 해당 Mail claim으로 배송 물품을 얻을 수 없는 것을 검증했습니다. 원래 우편 Gold 보상은 그대로입니다. 채광 공간 부족은 시작 전에 거절하고 완료 전 예외적인 용량 변경은 MINING_CANCELLED/FAILED로 안전 종료하여 보상과 활동 잠금을 남기지 않습니다.

## 새 실제 브라우저 시나리오

4개 시나리오 × 데스크톱/모바일:

1. 초기 인벤토리 3/20·무게 36/120 → 300G 확장 3/23·금고 950 → 600G 확장 3/26·금고 350 → 잔액 부족과 Gem 선행 조건 차단.
2. 도시 방문 전 조회·입출고 차단 → 실제 MOVE → 구리 10개 보관/꺼내기와 수량 보존 → 무게 초과·소수 수량 차단 → 도시 창고 23 slots 확장 → 다른 도시의 창고는 독립 20 slots.
3. 창고 구리 20개 NPC 배송·20G 한 번 차감·배송 진행률 → 목적 도시 Depot 도착 → 기존 도착 우편 확인 → 바로가기의 도시/Depot 탭 선택 → 방문 전 수령 차단 → MOVE 후 7개 부분 수령·13개 보관 유지·목적 도시 창고는 비어 있음.
4. 한국어·영어·일본어·중국어 간체·베트남어의 새 저장 UI와 가로 넘침 없음.

초기 다국어 검사에서는 한국어 dialog 이름을 고정한 selector가 영어 전환 후 대기하여 시간 초과가 났습니다. 언어와 무관한 storage-panel selector로 보정한 뒤 전체 검사에서 통과했습니다. 해당 실패 때문에 생산용 다국어 코드를 수정하지 않았습니다.

## 회귀·이전 결과 보존

기존 68개는 게임 로그인·가입·우편·채팅·다국어·거리 이동·채광·보상·연결 gap/replay·세션 만료·창 복구, 아틀라스 LOD·장면·소유/통치·아이템·오류 복구, 영지 주기·등급·폭주·공략·의뢰·웨이브·병력·상시/비상 토벌·피해/회복·장원 세율/정책/유지비·시간 수명·라우트 왕복을 포함합니다.

`src/modules/fief/**` 생산 코드는 수정하지 않았습니다. 기존 Fief UI 테스트 두 곳의 Testing Library getByRole에 지원되지 않는 exact 옵션을 제거하여 타입 검사를 보정했고 검사 의도는 유지했습니다. 기존 영지·아틀라스·게임 참고 이미지는 원본 그대로 유지합니다. v0.3 영지 캡처도 기존 referenceScreenshot 헬퍼를 사용하도록 보강해 명시적으로 갱신할 때만 체크인 이미지를 덮어씁니다.

새 출력은 Vite watch 제외 경로인 test-results/regression-v04a를 사용하며 이전 검사에서 발생했던 .cache trace 삭제 감시 충돌을 피합니다. 전용 5187 서버는 검사 종료 후 자동 정리하고 기존 5190 개발 서버는 유지합니다.

## 실제 5190·화면

현재 5190 서버에서 추가 모바일 검수: 개인 slots 3/23·무게 36/120, 실제 도시 도착 후 창고 1/23, 두 확장 비용 차감 후 Gold 650, 문서/뷰포트 412px, pageerror 없음. HTTP도 정상 응답합니다.

새 캡처 8개를 저장했습니다. 모바일 창고와 데스크톱 거래보관소 화면의 글자·버튼·부분 수령·창 스크롤·지도 배치를 시각 검수했습니다.

| 화면           | 데스크톱                                                   | 모바일                                                    |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| 개인 용량 확장 | [인벤토리](screenshots/storage-v04a-inventory-desktop.png) | [인벤토리](screenshots/storage-v04a-inventory-mobile.png) |
| 도시 창고      | [창고](screenshots/storage-v04a-warehouse-desktop.png)     | [창고](screenshots/storage-v04a-warehouse-mobile.png)     |
| NPC 배송       | [배송](screenshots/storage-v04a-shipment-desktop.png)      | [배송](screenshots/storage-v04a-shipment-mobile.png)      |
| 부분 수령      | [거래보관소](screenshots/storage-v04a-depot-desktop.png)   | [거래보관소](screenshots/storage-v04a-depot-mobile.png)   |

## 원본·재현·범위

첨부 체크포인트 원본과 docs/spec 보존본 SHA-256 일치:
`D7C6F777595BCFDAB014505729D83FBD82BBE0FAB58F1EA9B5D11103F7C25493`.

```powershell
npm test
npm run lint
npm run format:check
npm run build
npx playwright test --output test-results/regression-v04a
```

별도 Chromium은 PLAYWRIGHT_CHROMIUM_EXECUTABLE로 지정합니다. 현재 구현은 기존 브라우저 메모리의 권위형 Mock이며 실제 backend/DB/영구 저장·계정 자산 보안 검증은 아닙니다.

무게·개인 상한·고정 속도·도시 반경·샘플 재고는 시연값입니다. Vehicle 종류별 실제 capacity는 호출자 입력으로 두고 확정하지 않았습니다. 과적 감속·Premium 결제·시장 주문/수수료·직접 차량 운송·경로망은 후속입니다. v0.4B 원정/일일 시도/반복 의뢰와 v0.5 Family Estate는 다음 독립 구현 범위로 남깁니다. Condition 패널티 %, 0% 자원 생산량, Dungeon 성공 공식, 방문 보상·악용 방지 등 미정 규칙은 구현하지 않았습니다.
