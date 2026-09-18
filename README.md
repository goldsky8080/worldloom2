# Living World · Game Client Framework v0.2

React + Vite + TypeScript + PixiJS로 구현한 생활·경제·전투형 온라인 게임의 공통 클라이언트 기반입니다. 전체 화면 월드, HUD, 아이콘 메뉴, 부유 창, 하단 채팅으로 구성됩니다. 최종 아트는 포함하지 않으며, v0.2에서 거리 기반 이동과 광맥 채광의 첫 플레이 루프를 제공합니다.

## 인스턴스 영지 프로토타입

**http://127.0.0.1:5190/fief**에서 영주가 되어 성·도시·장원·영구 던전이 있는 영지 1개를 관리합니다. v0.3는 지도 중심 HUD와 시설별 행동으로, 상시·긴급 토벌·시간제 모병·부상/전사/회복·직접 공략·가상 의뢰·몬스터 웨이브·지속 피해와 안정 후 회복·장원의 세금/정책·정기 세입/유지비를 연결합니다. 개발 조작은 기본 닫힌 DEV 패널에 있습니다. 21일 설계/120초 테스트 주기와 도시 레벨별 등급 범위는 유지하며, 비용·피해 등 모든 수치는 임시 프로토타입 값입니다. 실제 경제·전투·서버 영속화는 후속입니다.

[프로토타입 규칙·조작·구조](docs/FIEF_PROTOTYPE.md) · [검증 기록](docs/FIEF_VALIDATION.md)

## 월드 아틀라스 미리보기

**http://127.0.0.1:5190/atlas**에서 로그인 없이 샘플 대지역을 봅니다. 로그인·게임 화면의 **월드 아틀라스** 버튼으로도 열 수 있습니다.

16개 영지, 6개 가문, 도시·성·장원·자원·후보지를 배치했습니다. 소유권/통치권 지도 색상, 3단계 LOD, 개척→번영→분쟁→쇠퇴 장면, 도시·성 외형 레벨, 아이템 티어·등급·강화 합성을 비교할 수 있습니다. 기존 이동·채광 플레이는 /game에 있습니다.

[샘플 배치·구조·아틀라스·후속 범위](docs/ATLAS_PREVIEW.md) · [검증 기록](docs/ATLAS_VALIDATION.md)

## v0.2 첫 플레이

월드맵에서 **구리 광맥** 클릭 → 현재 거리·예상시간 확인 → **광맥으로 이동** → 서버 도착 Countdown → **채광 시작** → 5초 진행 → **구리 광석 +3** → 인벤토리 12→15.

먼 곳에서는 채광할 수 없으며 이동과 채광은 동시에 할 수 없습니다. 플레이어는 명령으로만 이동합니다. 생활 → 채광은 선택한 광맥·진행·최근 결과를 공유하는 패널이며 장소 제한 없는 데모 버튼이 아닙니다.

월드 크기·Chunk·카메라·기본 속도·상호작용 기본값은 `src/core/world/worldConfig.ts`에서 관리합니다. 실제 도착시각·채광 완료·인벤토리 갱신은 Mock 서버가 결정합니다.

[수정·신규 파일, 계약, 공식, 규칙, 수동 검수, v0.3 범위](docs/V0_2_IMPLEMENTATION.md) · [v0.2 검증](docs/VALIDATION_v0.2.md)

## 빠른 실행

Node.js 22 이상과 npm을 사용합니다. 현재 작업 환경의 Node 22.9에서도 검증했습니다.

```powershell
cd D:\Worldloom2
npm install
npm run dev
```

기본 주소: http://127.0.0.1:5190  
데모 로그인: **demo@living.world / demo1234**

회원가입, 비밀번호 재설정, 이메일 인증은 브라우저 안에서만 동작하는 Mock입니다. 실제 비밀번호를 입력하지 마세요. 가입한 Mock 계정의 비밀번호는 메모리에만 유지되므로 새로고침 후에는 기존 가입 정보로 재로그인할 수 없습니다. Mock 세션은 sessionStorage로 탭 안에서 유지됩니다. 모든 데모 계정은 같은 샘플 캐릭터 풀을 사용합니다.

## 구현 기능

- 게임형 Login / Signup / Reset / 약관 / 인증 상태 / 만료 세션
- Game Shell, HUD, Theme Token, 중앙 화면 레이어, 공통 UI 28종
- Main/Sub Menu Registry, 정적 Module Registry, 기능 플래그 및 잠금 규칙
- Panel Manager: 중복 방지, 포커스, 드래그, 닫기, 최소화·복원, Dock, Fullscreen, Escape 뒤로가기
- 한국어 / 영어 / 일본어 / 중국어 간체 / 베트남어 즉시 전환
- 로컬 설정: 일반·음량·그래픽·인터페이스·알림, 저장소 인터페이스 및 검증
- AudioManager, 공용 서버 시간·Countdown, Toast·알림함·Critical Alert
- 전체·지역·길드·시스템 채팅, 읽지 않음·최소화·크기 조절·메시지 장식
- 받은 우편, 읽음, 상세, 만료일, 보상·전체 수령, 삭제; 공지 목록·카테고리·상세·팝업·긴급 배너 구조
- Auth / Game / Realtime / Social Gateway, Zod 계약 검증, 명령 ID 중복 처리
- REQUESTED → ACCEPTED → EXECUTING → SUCCEEDED / FAILED
- 이벤트 순서 추적, 중복 무시, 누락 감지, Replay·Snapshot 복구, 재연결·백오프
- 분리된 월드·캐릭터·인벤토리·우편·공지·채팅 Query Cache와 UI Store
- PixiJS 월드: Pan / Zoom, 움직이는 Player·Monster·Transport, 객체 선택·상세·이동 명령
- 중앙 World Config, 거리·속도 기반 이동, 목적지·경로 표시, Chunk Set 기준 AOI 구독·Culling, Chunk Debug, 이동 보간, 기본 LOD
- 보유 캐릭터 7명 / 활성 로스터 5명 / 메인 파티 3명 샘플
- Asset Registry / Manifest / Fallback / Lazy Load / Preload / Theme·SpriteSheet·9-Slice 확장 계약
- 광맥 범위·활동 상호 배제·시작/완료 이벤트·Snapshot 상태를 갖는 MiningModule 및 개발용 지연·끊김·이벤트 누락·세션 만료 시험
- 데스크톱·태블릿·모바일 웹 대응, 키보드·포커스·터치 처리

## 폴더 구조

```text
src/
  app/                  상위 라우터와 Gateway 주입
  shell/                HUD, 메뉴, 패널 관리자, 채팅, 알림 레이어
  ui/                   공통 컴포넌트, 기능 SVG, Theme/CSS
  assets/manifest/      공통 자산 정의
  services/             다국어, 설정, 사운드, 시간, 자산, 알림, 플래그
  core/                 DOM과 분리된 계약, Gateway, 명령·이벤트·복구·캐시
  modules/              각 기능 패널, Registry, MiningModule
  world-renderer/       PixiJS, Camera, Entity LOD, Movement, AOI, Chunk, Debug
  mocks/                권위형 Mock 서버, Gateway, Fixture
  i18n/{ko,en,ja,zh-CN,vi}/
  tests/                단위·컴포넌트·통합 테스트
e2e/                    실제 브라우저 테스트
public/assets/          Manifest, 아트 삽입 위치, 설명형 SVG Placeholder
docs/                   아키텍처·확장 안내·검수 화면
```

## 검증

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

브라우저 검증은 전용 포트 **5187**을 사용합니다. 기본 개발 서버와 별도입니다. Chromium이 이미 설치되어 있다면 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 환경변수로 실행 파일을 지정할 수 있습니다. `docs/screenshots/`에 데스크톱·모바일 검수 화면을 생성합니다.

`npm run preview`로 정적 빌드를 확인할 수 있습니다.

## Mock Mode / Debug

기본 Gateway는 모두 Mock입니다. 게임 결과는 `MockWorldServer`에서 계산하고 클라이언트는 이벤트 또는 스냅샷으로만 반영합니다. 실제 프론트엔드 코드가 골드·아이템을 직접 보정하지 않습니다. Mock 서버는 브라우저 메모리에 있고 새로고침하면 월드 데이터가 초기화됩니다. 서버가 없는 데모에서의 권위형 경계를 보여주며, 보안 경계는 아닙니다.

개발 서버에서 **F2** 또는 HUD의 F2 버튼으로 Debug를 켭니다. 지연 0/200/800/2000ms, 3초 연결 끊김, 순서 누락, 세션 만료, Chunk·AOI를 시험할 수 있습니다. 운영 빌드에서는 개발 도구가 노출되지 않습니다.

## 확장 안내

- [아키텍처](docs/ARCHITECTURE.md)
- [공통 UI 규칙](docs/GAME_UI_RULES.md)
- [자산 교체·권장 크기](docs/ASSET_GUIDE.md): 기본 Manifest 경로에 실제 파일 배치 또는 public/assets/manifest.json으로 경로·테마 변경. 컴포넌트 코드 수정 불필요.
- [Module / Menu / Panel 등록](docs/MODULE_GUIDE.md): 정의를 작성하고 registerModules에 등록. MainMenu를 변경하지 않습니다.
- [Localization 추가](docs/LOCALIZATION_GUIDE.md): 5개 사전의 같은 키에 번역을 추가하고 t(key)로 사용.
- [Gateway / FastAPI 연결](docs/GATEWAY_CONTRACT.md): app/bootstrap/services.ts의 주입 지점에서 Mock 교체.
- [Debug / 검수](docs/DEBUG_GUIDE.md)
- [설계 문서 검토 및 구현 범위](docs/IMPLEMENTATION_REVIEW.md)
- [검증 결과·화면·한계](docs/VALIDATION.md)

Theme 변경: `src/ui/theme/tokens.ts`를 변경하면 applyTheme이 CSS Variable로 반영합니다. CSS의 초기 토큰은 로딩 전 Fallback입니다. 월드 색상도 동일한 theme.map에서 가져옵니다.

## Skeleton 및 다음 단계

FastAPI·실제 인증/DB·WebSocket·Simulator·길드·친구·관리자·전투·거래·채광의 고갈/숙련도/도구/랜덤 보상은 구현하지 않았습니다. HTTP Game Gateway는 DTO를 검증하는 연결 어댑터를 제공하며, RealAuth·RealSocial·WebSocket Gateway는 명시적으로 미구현 오류를 반환하는 Skeleton입니다. SpriteSheet, 군집 LOD, 9-Slice 전용 아트는 확장 메타데이터와 연결점을 제공합니다.

다음 단계는 별도 백엔드의 계약 구현과 **몬스터 조우 → 전투 → 보상** 및 이동·채광 확장 규칙입니다. 현재 **월드 이동 → 채광 → 보상**은 Mock 모드에서 플레이할 수 있습니다. 프레임워크의 Mock 규칙을 최종 게임 공식으로 사용하지 않습니다.

설계 원문 사본: [최종 구현 설계서](docs/spec/DESIGN_v1.0.md), [시작 프롬프트](docs/spec/START_PROMPT_v1.0.md).

v0.2 설계 원문: [상세설계서](docs/spec/V0_2_DESIGN.md), [실행프롬프트](docs/spec/V0_2_EXECUTION_PROMPT.md).
