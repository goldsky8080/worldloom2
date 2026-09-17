# v0.1 두 설계 문서 검토와 구현 범위

검토 기준: 2026-09-17 최종 구현 설계서 v1.0(78개 절), 시작 프롬프트 v1.0.

사용자 요청은 “두 문서를 상세히 읽고 프레임워크를 만들어 달라”입니다. 문서의 “Codex에게 지시” 형식은 별도의 사용자 메시지가 아니라 설계 자료로 읽었습니다. 기술·구조·화면·완료 기준을 구현 요구사항으로 반영하고, 실제 배포·외부 계정 생성·다른 사람에게 메시지 전송 등으로 범위를 확대하지 않았습니다.

## 설계 대응

| 설계 절                                                        | 구현 대응                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1–6 목표·스택·권위형·격리·계층                                 | React/Vite/TS/Pixi, MockWorldServer, DOM과 분리된 DTO/Gateway                      |
| 7–9 Shell·Layer·시각·Theme                                     | GameShell/HUD, 중앙 Layers, 공통 CSS·Motion, 다크 게임 UI                          |
| 10 이미지 체계                                                 | Manifest/Registry/Manager, 설명형 Placeholder, Fallback/Lazy/Preload, Override     |
| 11–15 Common UI·Window·Menu·Module·Router                      | 28개 컴포넌트, PanelManager, 등록 기반 메뉴, 정적 모듈, 상위 라우트                |
| 16–17 Auth·Account/Character                                   | Mock 가입/로그인/Reset/Verify/Terms/Expire, 가변 Pool/5 Roster/3 Party             |
| 18–22 Localization·Settings·Audio·Time·Notification            | 5개 언어 완전 사전, 검증된 로컬 설정, 공용 사운드/시간, 3단계 알림                 |
| 23–26 Chat·Mail·Notice·Flags                                   | Mock 소셜 흐름, 보상 중복 방지·만료, 공지 카테고리·팝업·배너, 플래그               |
| 27–34 Gateway·계약·검증·Idempotency·Sync·State·UiBus           | Zod, UUID, 상태 수명주기, Replay/Snapshot, 자원별 Cache, UI 전용 EventBus          |
| 35–40 Pixi·월드·AOI·Entity·Movement·LOD                        | 실제 Canvas, 움직이는 마커, Camera/Pan/Zoom, Chunk/Culling, 보간, LOD 계약         |
| 41–47 Responsive·Error·Loading·Empty·Performance·Debug·Mocks   | 모바일 Sheet·하단 메뉴, Overlay, 구독 분리·Sprite 재사용, F2, Fixtures             |
| 48–57 Demo·메뉴·진입·자산·라이브러리·Motion·선택·아트 workflow | Mock Game Demo, 등록된 샘플 메뉴, 단계 로딩, Entity 상세, 코드 수정 없는 아트 교체 |
| 58–60 필수·Skeleton·금지 범위                                  | v0.1 기반 제공, 실제 백엔드/공식/AI/과금/최종 아트 제외                            |
| 61–64 README·내부 문서·UI 규칙·샘플                            | README, 요청된 7개 안내, DemoMiningModule                                          |
| 65–68 Test·Build·검수·시각 기준                                | Unit/Component/Integration/E2E, 실제 데스크톱·모바일 화면 검수                     |
| 69–73 First Playable·Native·순서·금지 패턴·품질                | 콘텐츠 연결점, DOM 없는 Contract, Strict TS, UI 직접 통신 없음                     |
| 74–78 완료·결과·전체 구조·판단 기준                            | 실행 가능한 클라이언트, Mock 데모·문서·자산·검증 결과                              |

## 선택과 제한

- 거대 상태 라이브러리 대신 자원별 구독 Cache와 작은 UI Atom을 사용했습니다. 계약에 의존해 다른 상태/쿼리 라이브러리로 교체할 수 있습니다.
- Mock 권위형 서버는 브라우저에서 실행되며 보안이나 영속성을 보장하지 않습니다. 실제 서비스에서는 FastAPI 쪽으로 옮겨야 합니다.
- Static Registry를 구현했으며 Dynamic Plugin Runtime을 만들지 않았습니다.
- AOI/Chunk는 Mock 구독 정보·화면 Culling·Debug를 제공합니다. 실서버의 공간 인덱스/Chunk 스트리밍은 Skeleton 영역입니다.
- LOD의 detail/icon/dot은 구현하고 실제 군집 집계는 인터페이스만 준비했습니다.
- Theme별 자산 경로, SpriteSheet 메타데이터, CSS border-image 프레임 연결점을 제공합니다. 최종 아트·SpriteSheet 플레이어·프레임 팩은 포함하지 않습니다.
- AudioManager는 브라우저 Autoplay 해제와 믹싱/등록 API를 제공합니다. 기본 UI 테스트 톤 외 전용 게임 사운드는 없습니다.
- 로그인 계정 DB·실제 Mail/Notice/Guild/Friend·Admin·Simulator·전투/경제 공식은 구현하지 않았습니다.
- 비밀번호 재설정·이메일 인증·약관은 명시적 Mock이며 실제 인증/법률 문서로 오해하지 않게 표시했습니다.

## 검증 결과

최종 결과는 [VALIDATION.md](VALIDATION.md)에 기록했습니다. 실제 화면은 screenshots/에서 확인할 수 있습니다.

이 문서는 v0.1 구현 당시의 대응 기록입니다. v0.2 변경은 [V0_2_IMPLEMENTATION.md](V0_2_IMPLEMENTATION.md)를 보세요. DemoMiningModule은 v0.2에서 실제 MiningModule로 교체했습니다.
