# Living World 온라인 웹게임 공통 프레임워크 — Codex 최종 구현 설계서

- **문서 버전:** v1.0
- **기준일:** 2026-09-17
- **대상:** Codex 및 실제 구현 개발자
- **목적:** 앞으로 Living World의 모든 게임 콘텐츠가 들어갈 **공통 게임 클라이언트 프레임워크**를 실제 코드로 구현하기 위한 최종 기준 문서

---

# 1. 가장 중요한 목표

이번에 만드는 것은 일반적인 웹사이트가 아니다.

사용자가 실행했을 때:

> “웹페이지를 열었다”가 아니라  
> **“온라인 게임에 접속했다”**고 느껴야 한다.

따라서 기능만 동작하면 완료가 아니다.  
최종 아트가 아직 Placeholder(임시 이미지) 상태여도 전체 화면이 **게임 클라이언트처럼 보여야 한다.**

특히 다음 형태는 피한다.

- 관리자 페이지
- SaaS 대시보드
- Bootstrap 예제 같은 화면
- 흰색 카드가 반복되는 일반 웹앱
- 상단 네비게이션 + 본문 문서형 페이지
- 텍스트 링크 중심 메뉴
- 화면마다 다른 디자인

대신 다음 구조를 사용한다.

- 전체 화면 Game Shell(게임 셸)
- HUD(게임 화면 정보 표시)
- 아이콘 중심 Main Menu(대메뉴)
- 대메뉴 선택 시 펼쳐지는 Sub Menu(소메뉴)
- Panel / Window(게임 패널 / 게임 창)
- PixiJS 기반 World Map(월드맵)
- Chat Dock(채팅 영역)
- Notification(알림)
- 이미지 / 아이콘 / 프레임 / 배경을 쉽게 교체할 수 있는 Asset System(자산 시스템)

---

# 2. 프로젝트의 전체 방향

Living World는 Persistent Online World(지속형 온라인 세계)를 기반으로 하는 생활·경제·전투형 웹게임이다.

향후 플레이어가 할 수 있는 콘텐츠 예:

- World Movement(월드 이동)
- Dungeon(던전)
- Monster Hunting(몬스터 사냥)
- Gathering(채집)
- Mining(채광)
- Transport(운송)
- Contract / Request(의뢰)
- Market Trading(시장 거래)
- Crafting(제작)
- PvP(플레이어 간 전투)
- Guild(길드)
- Chat(채팅)
- Mail(우편)
- Economic Activity(경제 활동)

하지만 **이번 Framework v0.1에서는 위 콘텐츠를 전부 구현하지 않는다.**

이번 단계의 목적은:

> 나중에 위 콘텐츠를 하나씩 모듈처럼 꽂아도  
> UI, 메뉴, 테마, 통신, 다국어, 설정, 이미지 관리가 흔들리지 않는 기반을 만드는 것.

---

# 3. 기술 스택 — 최종 고정

실제 Game Client(게임 클라이언트):

```text
React
+ Vite
+ TypeScript
+ PixiJS
```

향후 Backend(백엔드):

```text
Python
+ FastAPI
+ PostgreSQL
+ Redis (선택)
+ Living World Simulator
```

전체 구조:

```text
[ React + Vite Game Client ]
             │
             │ REST / WebSocket
             ▼
[ FastAPI Application / Gateway ]
             │
             ▼
[ Living World Game Core ]
             │
             ▼
[ Living World Simulator ]
             │
             ▼
[ PostgreSQL / Redis ]
```

Next.js는 실제 게임 클라이언트에 사용하지 않는다.

향후 공식 홈페이지가 필요하면 별도 프로젝트로 사용 가능:

```text
www.example.com  → Next.js → 소개 / 뉴스 / 패치노트
game.example.com → React + Vite → 실제 게임
```

---

# 4. Server Authoritative(서버 권위형) 절대 원칙

Frontend(프론트엔드)는 게임 결과를 결정하지 않는다.

잘못된 예:

```text
구매 버튼 클릭
↓
Frontend가 Gold -100
↓
Frontend가 아이템 +10
↓
서버에 결과 저장
```

금지.

정상 구조:

```text
Player Input(사용자 입력)
↓
Command(명령)
↓
GameGateway
↓
FastAPI / Backend
↓
Game Core / Simulator
↓
World State 변경
↓
Event / Snapshot
↓
Frontend UI Update
```

Frontend는 **사용자가 무엇을 하려고 하는지**만 서버에 전달한다.

실제 결과는 서버가 결정한다.

---

# 5. Simulator Isolation(시뮬레이터 격리)

Frontend는 Python Simulator 내부 클래스를 직접 알면 안 된다.

금지:

```text
Frontend
→ WorldState
→ LivingAgent
→ BusinessEntity
```

권장:

```text
Living World Simulator
        ↓
Application / World Service Facade
        ↓
API DTO / Transport Contract
        ↓
GameGateway
        ↓
Frontend Model
```

Simulator 내부 구조가 바뀌어도 Frontend 영향이 최소화되어야 한다.

---

# 6. 전체 프레임워크 계층

```text
① Presentation(표현 계층)
   Game Shell
   HUD
   Main Menu / Sub Menu
   Panel / Window
   Theme
   Common UI
   World Map

② Common Services(공통 서비스)
   Localization
   Settings
   Audio
   Time
   Asset Manager
   Notification
   Feature Flags

③ Account / Social Shell(계정 / 소셜 골격)
   Login
   Signup
   Chat
   Mail
   Notice

④ Client Core(클라이언트 핵심)
   Gateway
   Command
   Event
   Runtime Validation
   Query / Cache
   Realtime
   Reconnect / Recovery
   UiEventBus

⑤ Module System(모듈 시스템)
   World
   Character
   Inventory
   Market
   이후 게임 콘텐츠

⑥ World Renderer(월드 렌더러)
   PixiJS
   Camera
   AOI
   Chunk
   Entity
   Movement Interpolation
```

---

# 7. Game Shell(게임 셸)

공통 게임 화면의 기본 외곽 구조다.

```text
┌──────────────────────────────────────────────────────────┐
│                  Top HUD(상단 HUD)                       │
├──────────┬─────────────────────────────────┬─────────────┤
│          │                                 │             │
│ Main     │                                 │ Context     │
│ Menu     │       Main Game Area            │ Panel       │
│ 대메뉴    │       월드맵 / 콘텐츠 영역       │ 상세 패널     │
│          │                                 │             │
├──────────┴─────────────────────────────────┴─────────────┤
│ Chat / Event / Notification Dock(하단 공통 영역)         │
└──────────────────────────────────────────────────────────┘
```

하지만 업무용 3열 레이아웃처럼 고정하지 않는다.

상황에 따라:

- Context Panel 숨김
- 중앙 전체 화면
- Chat 최소화
- Floating Window(부유 창)
- Fullscreen Panel
- Drawer(서랍형 패널)

등을 지원할 수 있어야 한다.

---

# 8. “진짜 게임처럼 보이게” 만드는 시각 규칙

## 8.1 Layer(화면 계층)

```text
Layer 0  Background / World
Layer 1  World Map / Scene
Layer 2  Permanent HUD
Layer 3  Main Menu / Sub Menu
Layer 4  Panels / Windows
Layer 5  Modal
Layer 6  Tooltip
Layer 7  Notification / Toast
Layer 8  Critical Overlay
```

z-index는 중앙 상수로 관리한다.

각 모듈에서 임의 숫자를 사용하지 않는다.

## 8.2 게임 느낌을 만드는 요소

- 대메뉴는 아이콘 중심
- 패널에는 이미지/초상화/아이콘 자리가 존재
- 상태는 숫자 텍스트만 아니라 Bar / Badge / Icon 사용
- Panel Open / Close Animation
- Menu Expand Animation
- Button Press Feedback
- Notification Pop
- Entity Select Ring
- Loading Animation
- UI Sound 연결점

## 8.3 금지 디자인

- 흰 배경 중심
- 모든 것을 Card로 감싸기
- 일반 웹 Form 느낌
- 텍스트가 화면 대부분을 차지
- 메뉴를 단순 `<a>` 텍스트 링크로 구성
- 기본 HTML 버튼을 최종 UI로 노출

---

# 9. Theme System(테마 시스템)

모든 화면은 같은 Theme Token(테마 토큰)을 사용한다.

예:

```ts
theme.colors.background
theme.colors.surface
theme.colors.surfaceElevated
theme.colors.border
theme.colors.borderStrong
theme.colors.text
theme.colors.textMuted
theme.colors.primary
theme.colors.success
theme.colors.warning
theme.colors.danger
theme.colors.info
```

간격:

```ts
theme.spacing.xs
theme.spacing.sm
theme.spacing.md
theme.spacing.lg
theme.spacing.xl
```

모서리:

```ts
theme.radius.sm
theme.radius.md
theme.radius.panel
```

Motion:

```ts
theme.motion.fast
theme.motion.normal
theme.motion.slow
```

CSS Variable도 제공:

```css
--game-bg
--game-panel
--game-border
--game-text
--game-muted
--game-primary
--game-danger
```

게임 콘텐츠에서 임의 색상값을 반복해서 직접 쓰지 않는다.

---

# 10. Framework Asset System(공통 이미지 / 자산 시스템)

이 항목은 매우 중요하다.

Codex는 최종 게임 아트를 임의로 만들어 프로젝트에 확정하지 않는다.

## 10.1 Codex가 구현해야 하는 것

- Asset Manager
- Asset Registry
- Asset Manifest
- Placeholder
- Fallback
- Lazy Loading
- Preload Group
- 이미지 비율 규칙
- 이미지 권장 크기
- Theme별 자산 교체
- Sprite Sheet 확장 구조
- 이미지 로딩 오류 처리

## 10.2 Codex가 하지 말아야 하는 것

- 인터넷에서 임의 이미지를 다운로드
- 출처 불명 게임 이미지 사용
- 임의 AI 이미지를 최종 아트로 확정
- 서로 다른 스타일 무료 아이콘 혼합
- 최종 UI 프레임 디자인을 임의 확정

## 10.3 Placeholder 정책

이미지가 없다고 빈칸으로 두지 않는다.

예:

```text
[ LOGIN BACKGROUND ]
1920 x 1080
16:9

[ MAIN MENU ICON : BATTLE ]
256 x 256
1:1

[ PLAYER MARKER ]
64 x 64

[ PANEL FRAME ]
9-SLICE READY
```

Placeholder만 봐도 나중에 어떤 아트를 만들어야 하는지 알아야 한다.

## 10.4 Asset Manifest 예

```ts
export const frameworkAssets = {
  loginBackground: {
    id: "framework.background.login",
    path: "/assets/framework/backgrounds/login.webp",
    fallback: "/assets/placeholders/background-16x9.svg",
    aspectRatio: "16/9"
  },
  battleMenuIcon: {
    id: "framework.menu.battle",
    path: "/assets/framework/menu-icons/battle.webp",
    fallback: "/assets/placeholders/icon-square.svg",
    aspectRatio: "1/1"
  }
}
```

## 10.5 추천 자산 디렉터리

```text
public/assets/
├ framework/
│  ├ backgrounds/
│  ├ frames/
│  ├ menu-icons/
│  ├ system-icons/
│  ├ map-markers/
│  ├ empty-states/
│  └ effects/
├ content/
│  ├ monsters/
│  ├ items/
│  ├ locations/
│  ├ characters/
│  └ events/
└ placeholders/
```

## 10.6 기능 아이콘과 게임 아트 구분

SVG 사용 가능:

- 닫기
- 검색
- 체크
- 화살표
- 뒤로가기
- 음량
- 잠금
- 새로고침

향후 전용 게임 아트로 교체할 것:

- Battle(전투)
- Life(생활)
- Economy(경제)
- World(월드)
- Social(사회)
- Guild(길드)
- Dungeon(던전)

## 10.7 9-Slice(나인 슬라이스)

Panel / Modal / Button 프레임은 향후 9-Slice 이미지로 교체 가능하도록 컴포넌트 구조를 만든다.

초기에는 CSS로 구현해도 되지만 이미지 프레임을 받을 수 있어야 한다.

---

# 11. Common Game UI Components(공통 게임 UI)

최소 구현 대상:

```text
GamePanel
GameWindow
GameButton
IconButton
GameModal
GameDrawer
GameTabs
GameTooltip
GamePopover
GameCard
ItemSlot
ItemCard
CharacterPortrait
StatBar
ProgressBar
ResourceBadge
CurrencyDisplay
StatusBadge
Countdown
EmptyState
LoadingState
ErrorState
NotificationToast
UnreadBadge
GameHeader
GameDivider
```

각 컴포넌트는:

- Theme 사용
- Hover
- Active
- Disabled
- Loading
- Focus
- Mobile Touch
- Keyboard
- UI Sound Hook

을 고려한다.

---

# 12. Panel / Window Manager(패널 / 게임 창 관리자)

게임 내부는 Route 이동보다 Panel / Window 중심으로 작동한다.

관리 대상:

- 열린 패널
- 단일 인스턴스 여부
- 중복 열기
- 닫기
- 최소화
- Focus
- Dock
- Fullscreen
- Mobile Sheet
- 뒤로가기

예:

```ts
interface OpenPanel {
  id: string;
  moduleId: string;
  panelType: string;
  instanceKey?: string;
  mode: "floating" | "docked" | "fullscreen";
  payload?: unknown;
}
```

---

# 13. Main Menu / Sub Menu(대메뉴 / 소메뉴)

지금 모든 메뉴를 확정하지 않는다.

메뉴를 **등록하는 시스템**을 만든다.

동작:

```text
대메뉴 아이콘 클릭
↓
대메뉴 선택 상태
↓
소메뉴 아이콘 등장
↓
소메뉴 클릭
↓
해당 Panel / Window 열림
```

Menu Model:

```ts
interface GameMenuItem {
  id: string;
  categoryId: string;
  titleKey: string;
  iconAssetId: string;
  order: number;
  target: {
    type: "panel" | "route" | "modal";
    id: string;
  };
  badgeSource?: string;
  featureFlag?: string;
  unlockRule?: string;
  visible?: boolean;
  enabled?: boolean;
  platforms?: Array<"web" | "mobile">;
}
```

콘텐츠가 자기 메뉴를 Registry에 등록한다.

`MainMenu.tsx` 안에 모든 게임 메뉴를 영구 하드코딩하지 않는다.

---

# 14. Module Registry(모듈 등록 시스템)

향후 콘텐츠는 Module 형태로 추가한다.

```ts
interface GameModuleDefinition {
  id: string;
  version: string;
  routes?: RouteDefinition[];
  panels?: PanelDefinition[];
  menuItems?: GameMenuItem[];
  eventHandlers?: EventSubscription[];
  assets?: AssetDefinition[];
  localizationNamespaces?: string[];
  featureFlag?: string;
}
```

초기에는 복잡한 Plugin Runtime이 필요 없다.

정적 Registry 방식으로 충분하다.

---

# 15. Router의 역할

Router는:

- `/login`
- `/signup`
- `/game`

같은 상위 진입 경로에 사용한다.

게임 내부의 Inventory / Market / Mail 등을 전부 페이지 이동으로 만들지 않는다.

게임 안에서는 Panel Manager 중심으로 연다.

---

# 16. 회원가입 / 로그인 공통 프레임워크

공통에 포함한다.

v0.1에서는 실제 인증 서버가 없어도 MockAuthGateway로 전체 흐름을 구현한다.

화면:

- Login(로그인)
- Signup(회원가입)
- Password Reset(비밀번호 재설정)
- Email Verification State(이메일 인증 상태)
- Terms Agreement(약관 동의)
- Session Expired(세션 만료)

회원가입 Mock 필드:

- 이메일
- 비밀번호
- 비밀번호 확인
- 닉네임
- 언어
- 필수 약관

구조:

```text
Auth UI
↓
AuthGateway
↓
MockAuthGateway
   또는
Future RealAuthGateway
```

---

# 17. Account / Character 분리

```text
Account
└ Character Pool
  ├ Character A
  ├ Character B
  └ Character C
```

현재 모델 기준:

```text
Character Pool
= 계정이 보유한 전체 캐릭터

Active Roster
= 적극 운용 캐릭터
= 최대 5명

Main Party
= 직접 함께 운용
= 최대 3명
```

구조:

```ts
characterPool: Character[]
activeRoster: CharacterId[]
mainParty: CharacterId[]
```

고정 5개 배열 금지.

---

# 18. Localization(다국어)

초기 언어:

```text
ko     한국어
en     영어
ja     일본어
zh-CN  중국어 간체
vi     베트남어
```

절대 규칙:

```tsx
<button>공격</button>
```

같이 문자열 직접 작성 금지.

대신:

```tsx
<GameButton>{t("combat.attack")}</GameButton>
```

Namespace:

```text
common.*
menu.*
auth.*
settings.*
chat.*
mail.*
notice.*
world.*
character.*
inventory.*
```

언어 변경 시 즉시 UI 갱신.

영어/베트남어처럼 문자열이 길어져도 UI가 깨지지 않게 한다.

---

# 19. Settings(시스템 설정)

공통 설정 화면:

## General(일반)
- 언어
- 시간 표시
- 숫자 표시
- UI 크기

## Sound(사운드)
- 전체 음량
- BGM
- 효과음
- UI 효과음
- 알림음

## Graphics(그래픽)
- 월드 객체 표시량
- 애니메이션 품질
- 효과 수준
- FPS 제한
- 배터리 절약

## Interface(인터페이스)
- 채팅 글자 크기
- 이름 표시
- HP 표시
- 툴팁 상세도

## Notification(알림)
- 채광 완료
- 운송 완료
- 공격 받음
- 의뢰 완료
- 시장 체결
- 길드
- 우편

v0.1은 Local 또는 추상 SettingsRepository로 구현하되 서버 동기화 가능 구조.

---

# 20. Audio Service(사운드 서비스)

공통 AudioManager를 만든다.

예:

```ts
audioService.playUi("button.click")
audioService.playSfx("notification.mail")
audioService.setBgm("world.default")
audioService.setMasterVolume(0.8)
```

컴포넌트마다 직접 Audio 객체를 만들지 않는다.

Browser Autoplay 제한도 고려한다.

---

# 21. Time Service(시간 서비스)

게임에는 시간 기반 행동이 많으므로 공통 서비스가 필요하다.

예:

```text
채광 완료까지 03:21
운송 완료까지 18:42
PvP 조우까지 01:17
```

지원:

- 서버 시간 차이
- Countdown
- 완료 시각
- 포맷
- 탭 비활성 후 복귀 보정
- 재동기화

각 화면에서 setInterval을 따로 남발하지 않는다.

---

# 22. Notification System(알림)

3단계:

```text
Toast
Notification Center
Critical Alert
```

예:

- 우편 도착
- 이동 완료
- 거래 완료
- 공격 받음
- 연결 끊김

Menu Badge와 연결 가능.

---

# 23. Chat Shell(채팅 골격)

초기 채널:

- Global(전체)
- Region(지역)
- Guild(길드)
- System(시스템)

향후 Whisper / Party 확장.

UI:

- 채널 탭
- 메시지 목록
- 입력창
- 읽지 않은 메시지
- 최소화
- 크기 조절

특정 사용자 글씨체, 칭호, 효과 등을 나중에 붙일 수 있게 Message Decoration 구조를 둔다.

---

# 24. Mail Shell(우편 골격)

UI 구현 + Mock Backend.

기능:

- 받은 우편함
- 읽음/안읽음
- 상세
- 첨부 보상
- 보상 수령
- 전체 수령 골격
- 삭제
- 만료일

보상 수령은 향후 commandId 기반 중복 방지 대상.

---

# 25. Notice Shell(공지사항 골격)

기능:

- 목록
- 카테고리
- 중요 공지
- 상단 고정
- 상세
- 게시 시작/종료 시간
- 팝업 공지 구조
- 긴급 상단 배너 구조

Mock Fixture로 동작.

---

# 26. Feature Flag(기능 플래그)

예:

```text
MINING_ENABLED
PVP_ENABLED
GUILD_ENABLED
MAIL_ENABLED
```

Menu와 Module이 FeatureFlagService를 통해 노출 여부를 결정한다.

---

# 27. Gateway 구조

UI가 Backend와 직접 통신하지 않는다.

```text
AuthGateway
GameGateway
RealtimeGateway
SocialGateway
```

Mock과 실제 Gateway는 동일 Interface 사용.

예:

```ts
interface GameGateway {
  getSnapshot(): Promise<GameSnapshot>;
  sendCommand(command: GameCommand): Promise<CommandReceipt>;
}
```

구현:

```text
MockGameGateway
Future HttpGameGateway
```

Realtime:

```text
MockRealtimeGateway
Future WebSocketRealtimeGateway
```

---

# 28. Command Contract(명령 계약)

```ts
interface GameCommand<TPayload> {
  contractVersion: string;
  commandId: string;
  commandType: string;
  characterId: string;
  requestedAt: string;
  payload: TPayload;
}
```

Lifecycle:

```text
REQUESTED
↓
ACCEPTED
↓
EXECUTING
↓
SUCCEEDED / FAILED
```

ACCEPTED는 완료가 아니다.

---

# 29. Event Contract(이벤트 계약)

```ts
interface GameEvent<TPayload> {
  contractVersion: string;
  eventId: string;
  eventType: string;
  sequence: number;
  occurredAt: string;
  payload: TPayload;
}
```

공통 이벤트 예:

```text
SESSION_UPDATED
CHARACTER_UPDATED
INVENTORY_UPDATED
WORLD_ENTITY_UPDATED
MOVEMENT_STARTED
MOVEMENT_COMPLETED
NOTIFICATION_CREATED
MAIL_RECEIVED
NOTICE_PUBLISHED
```

---

# 30. Runtime Validation(런타임 검증)

TypeScript 타입만 믿지 않는다.

Gateway 진입점에서 Zod 같은 도구로 검증.

검증:

- contractVersion
- commandId
- eventId
- sequence
- eventType
- required field
- payload

실패 시:

- 개발 로그
- 안전한 사용자 오류
- 필요 시 Snapshot 재요청

---

# 31. Command Idempotency(명령 중복 방지)

모든 중요한 Command는 commandId 사용.

특히:

- 구매/판매
- 아이템 이동
- 보상 수령
- 우편 보상
- 제작
- 운송
- 화폐 변경

UI에서 버튼 연타 방지와 별개로 서버 중복 실행 방지가 필요하다.

---

# 32. Realtime Synchronization(실시간 동기화)

Persistent World이므로 단순 재연결만으로 부족하다.

```text
Snapshot(sequence=N)
↓
Event N+1
Event N+2
Event N+3
↓
Live Stream
```

클라이언트는 마지막 sequence를 기억.

재연결:

```text
Disconnect
↓
Reconnect
↓
Replay Missing Events
```

Replay 불가:

```text
Sequence Gap
↓
Cache Invalidation
↓
Fresh Snapshot
```

---

# 33. State Management(상태 관리)

Server State와 UI State 분리.

Server State 예:

- Character
- Inventory
- World Snapshot
- Market
- Events
- Mail
- Notice

TanStack Query 같은 Query/Cache 계층 고려.

Client UI State:

- 열린 Panel
- 현재 Menu
- Camera
- 선택 Entity
- Chat 상태
- UI Preference

Zustand 가능.

모든 서버 상태를 하나의 거대 Global Store에 넣지 않는다.

---

# 34. UiEventBus

Frontend 내부 이벤트:

```text
panel.open
panel.close
entity.selected
settings.changed
notification.open
mail.received
```

Backend Game Event와 UI Event를 섞지 않는다.

---

# 35. World Renderer(월드 렌더러)

React가 수백~수천 World Entity를 DOM으로 렌더링하지 않는다.

PixiJS 담당:

```text
World Map
Player
NPC
Monster
Transport
Caravan
Resource Node
Movement Animation
Map Effect
```

React 담당:

```text
HUD
Menu
Panel
Character UI
Inventory
Market
Chat
Notification
Settings
```

---

# 36. Mock World Map

v0.1에서 실제 월드 지도 완성은 필요 없다.

하지만 빈 div는 금지.

PixiJS Mock World를 만든다.

지원:

- Pan
- Zoom
- Camera State
- Entity Render
- Entity Select
- Placeholder Marker
- Chunk Debug
- AOI Debug

개발 모드에서 Grid/AOI 표시 On/Off 가능.

---

# 37. AOI(관심 영역) / Chunk(구역)

전체 월드 객체를 항상 다루지 않는다.

```text
World
└ Region
  └ Chunk
    └ Entity
```

현재 화면/관심 영역에 필요한 객체만 관리 가능한 구조.

Mock API:

```ts
subscribeArea({
  centerX,
  centerY,
  width,
  height,
  zoom
})
```

---

# 38. World Entity View Model

```ts
interface WorldEntityView {
  id: string;
  type: "player" | "npc" | "monster" | "transport" | "resource" | "party";
  x: number;
  y: number;
  displayNameKey?: string;
  markerAssetId: string;
  movement?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startedAt: string;
    arrivesAt: string;
  };
  status?: string;
}
```

이것은 Frontend View Model이다.

Simulator 내부 Entity Class와 동일시하지 않는다.

---

# 39. Movement Interpolation(이동 보간)

서버가 매 프레임 좌표를 보내는 방식이 아니다.

서버 데이터:

```text
출발 좌표
도착 좌표
출발 시간
도착 시간
```

클라이언트가 현재 시간 기준 중간 위치 계산.

Utility/Service로 분리하고 테스트.

---

# 40. LOD / Cluster 확장

향후:

```text
가까움 → 이미지 + 이름 + 상태
중간 → 작은 아이콘
멀리 → 점
대량 → 군집 숫자
```

초기 구현은 단순해도 Interface는 준비.

---

# 41. Responsive(반응형)

Desktop:

- 넓은 월드맵
- 다중 패널 가능
- Chat Dock

Tablet:

- 우측 패널 Drawer 가능
- 메뉴 축소

Mobile Web:

- 하단 주요 메뉴 또는 축약 메뉴
- 전체 메뉴 버튼
- Panel은 전체화면 Sheet
- 최소 44px 터치 영역
- 16px 미만 입력 폰트 주의

---

# 42. Error / Reconnect UX

일반 브라우저 오류 화면처럼 보이지 않게 한다.

게임 Overlay:

```text
연결 복구 중...
서버와 다시 연결하고 있습니다.

[재시도]
```

상태:

- Connecting
- Connected
- Reconnecting
- Offline
- Session Expired
- Fatal Error

---

# 43. Loading UX

지원:

- 게임 초기 로딩
- Asset Loading
- World Loading
- Module Loading
- Panel Partial Loading

최종 이미지가 없으면 Placeholder Background 사용.

---

# 44. Empty State

“데이터가 없습니다.” 한 줄로 끝내지 않는다.

구성:

- 아이콘/Placeholder
- 제목
- 짧은 설명
- 필요 시 행동 버튼

예:

```text
우편함이 비어 있습니다.
새 우편이 도착하면 이곳에 표시됩니다.
```

---

# 45. Performance(성능) 원칙

- World Entity를 대량 React DOM으로 렌더링 금지
- PixiJS 사용
- Asset Preload Group 분리
- 큰 이미지 Lazy Load
- Panel 불필요 재렌더 최소화
- WebSocket Event마다 전체 App 재렌더 금지
- Entity Sprite 재사용 고려
- 화면 밖 객체 렌더 최소화

---

# 46. Debug Mode(디버그 모드)

개발 모드에서 표시 가능:

```text
Connection Status
Last Event Sequence
Open Panels
Current Menu
Current Language
World Entity Count
Camera Position
AOI
Feature Flags
Mock Latency
```

운영 빌드에서는 숨긴다.

---

# 47. Mock Architecture

실제 서버 없이 Framework 전체 실행 가능해야 한다.

필수 Mock:

```text
MockAuthGateway
MockGameGateway
MockRealtimeGateway
MockSocialGateway
MockSettingsRepository
Mock Assets
Mock World Entities
Mock Characters
Mock Inventory
Mock Chat
Mock Mail
Mock Notice
```

Mock Network Latency:

```text
0ms
200ms
800ms
2000ms
```

선택 가능하게 해도 좋다.

---

# 48. Framework Demo가 보여줘야 하는 것

1. 게임 분위기의 Login
2. Mock 로그인
3. Loading
4. Game Shell
5. HUD
6. 대메뉴
7. 대메뉴 클릭 → 소메뉴
8. PixiJS World Map
9. Player / Monster / Transport Placeholder 이동
10. Entity 선택
11. 상세 Panel
12. Chat Dock
13. Notification
14. Mail
15. Notice
16. Settings
17. 언어 변경
18. Audio Slider
19. 연결 끊김 Simulation
20. Reconnect / Recovery

이 데모만 봐도 일반 웹이 아니라 게임 프레임워크라는 느낌이 나야 한다.

---

# 49. Demo용 임시 메뉴

확정 메뉴가 아니다.

```text
World(월드)
Life(생활)
Battle(전투)
Economy(경제)
Social(사회)
System(시스템)
```

예시 소메뉴:

Social:

```text
Chat
Mail
Notice
Guild(비활성 Placeholder)
```

System:

```text
Settings
Account
```

Life / Battle / Economy는 Placeholder Module 사용 가능.

---

# 50. 로그인 → 게임 진입 흐름

```text
App Start
↓
Session Check
↓
Login / Signup
↓
Mock Authentication
↓
Language / Settings Load
↓
Core Asset Load
↓
Mock Snapshot Load
↓
Realtime Connect
↓
Game Shell
```

---

# 51. Asset Loading Flow

```text
Core Assets
↓
Login Assets
↓
Game Shell Assets
↓
Current Module Assets
↓
Optional Assets
```

앱 시작 시 모든 콘텐츠 자산을 한 번에 로딩하지 않는다.

---

# 52. 추천 프로젝트 구조

```text
src/
├ app/
│  ├ router/
│  ├ providers/
│  └ bootstrap/
├ shell/
│  ├ GameShell/
│  ├ HUD/
│  ├ MainMenu/
│  ├ SubMenu/
│  ├ ChatDock/
│  └ layers/
├ ui/
│  ├ components/
│  ├ theme/
│  ├ icons/
│  └ layout/
├ assets/
│  ├ manifest/
│  ├ registry/
│  └ placeholders/
├ services/
│  ├ localization/
│  ├ settings/
│  ├ audio/
│  ├ time/
│  ├ notification/
│  ├ featureFlags/
│  └ assets/
├ core/
│  ├ gateway/
│  ├ contracts/
│  ├ command/
│  ├ event/
│  ├ realtime/
│  ├ validation/
│  ├ recovery/
│  ├ query/
│  └ ui-events/
├ modules/
│  ├ auth/
│  ├ world/
│  ├ character/
│  ├ inventory/
│  ├ market/
│  ├ chat/
│  ├ mail/
│  ├ notice/
│  └ settings/
├ world-renderer/
│  ├ pixi/
│  ├ camera/
│  ├ entity/
│  ├ movement/
│  ├ aoi/
│  ├ chunk/
│  └ debug/
├ mocks/
│  ├ gateways/
│  ├ fixtures/
│  ├ realtime/
│  └ scenarios/
├ i18n/
│  ├ ko/
│  ├ en/
│  ├ ja/
│  ├ zh-CN/
│  └ vi/
└ tests/
```

---

# 53. 추천 라이브러리

핵심:

```text
React
Vite
TypeScript
PixiJS
React Router
Zod
```

후보:

```text
Zustand
TanStack Query
i18next
react-i18next
Vitest
React Testing Library
```

Material UI 같은 일반 업무용 UI 라이브러리를 프로젝트의 시각 기반으로 사용하지 않는다.

---

# 54. 외부 UI 라이브러리 정책

기능을 위해 외부 라이브러리를 사용할 수 있지만,
그 외관을 그대로 Living World의 최종 UI로 노출하지 않는다.

가능하면 공통 Game UI Wrapper로 감싼다.

---

# 55. Animation(애니메이션)

공통 Motion:

- Panel Open
- Panel Close
- Menu Expand
- Sub Menu Appear
- Button Press
- Notification Enter/Exit
- Badge Pop
- Loading Pulse
- Entity Select Ring

Duration은 Theme Token 사용.

---

# 56. Entity 선택 UX

```text
월드 객체 클릭
↓
선택 Highlight
↓
Context Panel Open
↓
기본 정보
↓
가능 행동 버튼
```

v0.1 행동은 Mock Command로 충분.

---

# 57. 실제 이미지 제작 Workflow

초기부터 수백 장 만들지 않는다.

권장:

```text
Framework Placeholder 완성
↓
실제 실행 화면 캡처
↓
필요 이미지 목록 확정
↓
공통 Framework Asset Pack 제작
↓
Asset ID / Path에 실제 이미지 배치
↓
코드 수정 없이 교체
```

---

# 58. v0.1 반드시 구현

- React + Vite + TypeScript
- Router
- Login / Signup Mock
- Game Shell
- HUD
- Theme
- Common UI
- Asset Manager
- Placeholder
- Main Menu / Sub Menu
- Module Registry
- Panel / Window Manager
- Localization 5개 언어
- Settings
- Audio Service
- Time Service
- Feature Flags
- Notification
- Chat Shell
- Mail Shell
- Notice Shell
- Gateway Interface
- Command / Event Contract
- Runtime Validation
- Query / Cache
- Realtime / Recovery Mock
- UiEventBus
- PixiJS World Renderer
- Camera
- AOI / Chunk Mock
- World Entity Mock
- Movement Interpolation
- Character Pool / Active Roster / Main Party
- Debug Overlay
- Mock Fixtures
- Tests
- Documentation

---

# 59. Skeleton만 구현

- Real FastAPI
- Real Auth Server
- Real Account DB
- Real Character DB
- Real Guild Backend
- Real Friend Backend
- Real Mail Backend
- Real Notice Backend
- Admin Backend
- Real Simulator WebSocket
- Final World Coordinator
- Final Combat
- Final Mining
- Final Market

---

# 60. 지금 구현하지 말아야 할 것

- 모든 게임 콘텐츠
- 최종 전투 공식
- 최종 PvP 공식
- 복잡한 NPC AI
- 최종 월드조율자
- 최종 과금
- Microservice 분리
- 복잡한 Dynamic Plugin Runtime
- Simulator 내부 구조 재작성
- 최종 게임 아트 대량 제작

---

# 61. README 필수 내용

- 프로젝트 목적
- 기술 스택
- 실행 방법
- 폴더 구조
- Mock Mode
- Asset 교체 방법
- Localization 추가 방법
- Module 추가 방법
- Menu 등록 방법
- Panel 등록 방법
- Theme 수정 방법
- Backend 연결 지점
- Debug Mode

---

# 62. 프로젝트 내부 문서

Codex는 다음 문서를 생성한다.

```text
/docs/ARCHITECTURE.md
/docs/GAME_UI_RULES.md
/docs/ASSET_GUIDE.md
/docs/MODULE_GUIDE.md
/docs/GATEWAY_CONTRACT.md
/docs/LOCALIZATION_GUIDE.md
/docs/DEBUG_GUIDE.md
```

---

# 63. GAME_UI_RULES.md 필수 규칙

```text
1. 일반 웹 대시보드 스타일 금지
2. 모든 콘텐츠는 공통 Theme 사용
3. 임의 색상 사용 최소화
4. 모든 주요 패널은 공통 GamePanel/GameWindow 사용
5. 문자열 하드코딩 금지
6. 이미지 Asset Manager 경유
7. 콘텐츠 메뉴 Registry 등록
8. World Entity 대량 DOM 렌더 금지
9. Server Authoritative 준수
10. Simulator 직접 결합 금지
```

---

# 64. Demo Module 하나 제공

예: `DemoMiningModule`

실제 채광 로직이 아니라 다음 패턴을 보여주는 샘플:

```text
Module 등록
↓
Menu 등록
↓
Panel 등록
↓
Localization 등록
↓
Asset 등록
↓
Mock Command
↓
Mock Event
↓
Notification
```

---

# 65. 테스트 기준

Unit:

- Menu Registry
- Module Registry
- Asset Fallback
- Localization
- Time Calculation
- Movement Interpolation
- Runtime Validation
- Command ID
- Sequence Recovery

Component:

- GameButton
- GamePanel
- MainMenu
- SubMenu
- Panel Manager
- Settings
- Login

Integration:

- Mock Login → Game Shell
- Menu → Panel
- Mock Command → Event → UI
- Disconnect → Reconnect
- Sequence Gap → Recovery
- Language Switch
- Missing Asset → Placeholder

---

# 66. 완료 시 반드시 통과

```bash
npm install
npm run lint
npm test
npm run build
```

---

# 67. 검수 시나리오

## 첫 접속
- 게임형 Login
- 회원가입 가능
- 언어 선택 가능
- Login 배경 Placeholder가 자연스럽게 존재

## 게임 진입
- Mock 로그인
- Loading
- HUD
- 월드맵
- 메뉴
- 채팅

## 메뉴
- 대메뉴 클릭
- 소메뉴 아이콘 등장
- 클릭 시 Panel 열림
- 닫기/재열기 정상

## 월드맵
- Pan
- Zoom
- Player/Monster/Transport Marker
- 이동 애니메이션
- Entity 클릭 → 상세 Panel
- AOI Debug

## 공통
- Chat
- Mail
- Notice
- Settings
- Language
- Sound
- Notification

## 네트워크
- Mock Disconnect
- Reconnecting Overlay
- Recovery
- Sequence Gap → Snapshot

---

# 68. 시각적 완료 기준

다음이면 미완성:

- 관리자 페이지처럼 보임
- 모든 화면이 흰 Card
- 아이콘/이미지 자리가 거의 없음
- 메뉴가 텍스트 링크
- 월드맵이 빈 div
- Panel이 일반 웹 Modal과 차이가 없음
- Placeholder가 없어 실제 아트가 들어갈 곳을 알 수 없음

다음 느낌이어야 함:

> 아직 최종 아트는 없지만  
> 실제 이미지와 사운드를 넣으면 바로 게임이 되겠다는 느낌.

---

# 69. First Playable(첫 실제 플레이 버전) 경계

Framework 완성 후 첫 실제 콘텐츠:

```text
World Map
↓
Movement
↓
Mining
↓
Monster Encounter
↓
Combat
↓
Reward
```

Framework에서는 실제 로직을 만들지 않는다.

대신 위 콘텐츠가 들어갈:

- Module
- Menu
- Panel
- Command
- Event
- Timer
- Entity
- Asset
- Notification

의 기반을 모두 준비한다.

---

# 70. React Native 확장 고려

현재 구현은 Web 중심.

하지만 다음 개념은 향후 React Native와 공유 가능해야 함.

- API Contract
- Event Contract
- Localization Key
- Theme Token
- Asset ID
- Character Model
- Settings Model

React DOM 전용 구현을 Core Contract에 섞지 않는다.

---

# 71. 개발 순서

1. 프로젝트 초기화 / 폴더 / 테스트
2. Theme / Common UI / Asset Manager
3. Router / Auth Mock
4. Game Shell / Menu / Panel
5. Localization / Settings / Audio / Time
6. Gateway / Contract / Validation / State
7. Realtime / Recovery
8. PixiJS World Renderer
9. Chat / Mail / Notice / Notification
10. Demo Module / Debug / Docs / Tests

각 큰 단계 후:

```bash
npm run lint
npm test
npm run build
```

---

# 72. 절대 금지 구현 패턴

1. 모든 서버 상태를 하나의 거대한 Zustand Store에 넣기
2. World Entity를 모두 React `<div>`로 렌더링
3. UI 컴포넌트에서 직접 fetch
4. UI 컴포넌트에서 직접 WebSocket 생성
5. Frontend가 게임 결과 계산
6. 실제 UI 문자열 하드코딩
7. 이미지 경로를 컴포넌트 곳곳에 직접 작성
8. 콘텐츠마다 별도 Theme
9. MainMenu 소스에 전체 메뉴 하드코딩
10. Frontend Type을 Simulator Python Class에 직접 맞춤
11. 최종 게임 아트가 없다고 이미지 영역 자체를 제거
12. Base64 대형 이미지를 코드에 삽입

---

# 73. 코드 품질

- TypeScript strict
- `any` 최소화
- UI / Transport / View Model 분리
- 테스트 가능한 Utility 분리
- Side Effect 최소화
- 명확한 Error
- README 최신 유지

---

# 74. Definition of Done(완료 정의)

다음이 모두 되어야 Framework v0.1 완료:

1. 실행 가능
2. lint 통과
3. test 통과
4. build 통과
5. Login/Signup Mock
6. Game Shell
7. Main/Sub Menu Registry
8. Panel Manager
9. 5개 언어
10. Settings
11. Audio Service
12. Time Service
13. Chat/Mail/Notice
14. Notification
15. PixiJS World Mock
16. Movement Interpolation
17. Asset Placeholder
18. 실제 자산 교체 시 코드 수정 불필요
19. Mock Command/Event
20. Realtime Reconnect
21. Sequence Recovery
22. Mobile 기본 대응
23. Debug Overlay
24. Architecture 문서
25. 일반 웹이 아닌 게임 클라이언트처럼 보임

---

# 75. 최종 구현 결과물

```text
실행 가능한 소스코드
README.md

docs/
  ARCHITECTURE.md
  GAME_UI_RULES.md
  ASSET_GUIDE.md
  MODULE_GUIDE.md
  GATEWAY_CONTRACT.md
  LOCALIZATION_GUIDE.md
  DEBUG_GUIDE.md

Mock Game Demo
Placeholder Asset Pack
5개 언어 기본 파일
PixiJS Mock World
Mock Chat
Mock Mail
Mock Notice
Settings
Debug Overlay
Tests
```

---

# 76. 최종 전체 그림

```text
                         ┌───────────────────────┐
                         │ Login / Signup        │
                         │ 로그인 / 회원가입       │
                         └───────────┬───────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     GAME SHELL                              │
│                                                             │
│  HUD                                                        │
│                                                             │
│  Main Menu → Sub Menu                                       │
│       │                                                     │
│       ├─────────────┐                                       │
│       │             │                                       │
│       ▼             ▼                                       │
│  Game Panels    PixiJS World Map                            │
│                     │                                       │
│                     ├ Player                                │
│                     ├ Monster                               │
│                     ├ Transport                             │
│                     └ Resource                              │
│                                                             │
│ Chat / Mail / Notice / Notification / Settings              │
└────────────────────────────┬────────────────────────────────┘
                             │
                   Gateway / Contract
                             │
             ┌───────────────┼────────────────┐
             │               │                │
           Auth           Game API         Realtime
             │               │                │
             └───────────────┼────────────────┘
                             │
                       Future Backend
                             │
                         Game Core
                             │
                         Simulator
```

Frontend는 Simulator 내부 구조를 모른다.  
Simulator도 UI가 어떻게 그려지는지 모른다.  
둘은 Gateway / Command / Event 계약으로만 만난다.

---

# 77. Codex에게 주는 최종 판단 기준

구현 중 두 방법 중 고민될 때 다음 질문을 한다.

> “이 화면이 일반 웹 애플리케이션처럼 보이는가,  
> 아니면 실제 게임 클라이언트처럼 보이는가?”

가능한 한 게임 클라이언트에 적합한 쪽을 선택한다.

단, 화려함 때문에 구조와 성능을 희생하지 않는다.

최종 핵심:

```text
안정적인 구조
+
Server Authoritative
+
Module / Menu Registry
+
일관된 Game UI
+
이미지 교체가 쉬운 Asset System
+
PixiJS World Renderer
+
Gateway / Command / Event 계약
```

---

# 78. 한 문장으로 정리

Codex가 지금 만드는 것은 **게임 콘텐츠 그 자체가 아니라, 앞으로 모든 Living World 콘텐츠가 들어갈 “브라우저 기반 온라인 게임 클라이언트 엔진 + 공통 UI 프레임워크”**다.

실행해 본 사람이:

> “웹사이트를 만들어놨네.”

가 아니라,

> **“아직 아트는 임시지만 온라인 게임 클라이언트를 만들어놨네.”**

라고 느껴야 한다.
