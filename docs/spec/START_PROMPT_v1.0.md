# Living World 공통 웹게임 프레임워크 — Codex 시작 프롬프트

아래 설계 문서를 프로젝트 최상위 기준으로 읽고 공통 프레임워크를 구현해줘.

**기준 문서**
`LIVING_WORLD_WEB_GAME_공통프레임워크_Codex_최종구현설계서_v1.0_2026-09-17.md`

## 핵심 목표

일반 홈페이지나 관리자 페이지가 아니라 **실제 온라인 게임 클라이언트처럼 보이는 웹 프레임워크**를 만들어라.

기술은 다음으로 고정한다.

```text
React + Vite + TypeScript + PixiJS
```

Backend는 이번 단계에서 실제 구현하지 않는다.

향후:

```text
Python + FastAPI + Living World Game Core + Living World Simulator
```

와 연결할 수 있게 Gateway / Command / Event 계약만 준비한다.

## 반드시 지킬 것

1. Server Authoritative(서버 권위형)
2. Frontend와 Simulator 직접 결합 금지
3. React는 HUD / Menu / Panel / 일반 UI 담당
4. PixiJS는 World Map / World Entity 담당
5. 모든 콘텐츠는 공통 Theme 사용
6. 대메뉴 / 소메뉴는 Registry 기반
7. 문자열 하드코딩 금지, 다국어 키 사용
8. ko / en / ja / zh-CN / vi 구조 구현
9. Login / Signup Mock 구현
10. Settings / Audio / Time / Notification 구현
11. Chat / Mail / Notice는 Mock으로 동작
12. Gateway / Command / Event / Runtime Validation 구현
13. Reconnect / Sequence Recovery Mock 구현
14. PixiJS Mock World 구현
15. AOI / Chunk / Entity / Movement Interpolation 구조 구현
16. 최종 게임 이미지를 임의로 만들거나 인터넷에서 가져오지 말 것
17. 이미지가 필요한 모든 곳에는 Asset Manifest + Placeholder를 넣을 것
18. 실제 이미지 파일을 나중에 바꾸면 코드 수정 없이 적용되어야 함
19. 기능 아이콘은 SVG 사용 가능
20. 일반 웹 대시보드처럼 보이면 실패

## 화면 느낌

최종 아트가 없어도:

> “이미지와 사운드만 교체하면 실제 게임이 되겠다.”

는 느낌이어야 한다.

대메뉴는 아이콘 중심으로 만들고,
대메뉴 클릭 시 소메뉴 아이콘이 자연스럽게 등장하게 해라.

월드맵은 빈 `<div>`가 아니라 PixiJS로 Mock World를 만들고
Player / Monster / Transport Placeholder가 실제로 움직이게 해라.

## 구현 순서

1. 프로젝트 구조 / 테스트
2. Theme / Common UI / Asset Manager
3. Router / Auth Mock
4. Game Shell / Menu / Panel Manager
5. Localization / Settings / Audio / Time
6. Gateway / Contract / Validation / State
7. Realtime / Recovery
8. PixiJS World Renderer
9. Chat / Mail / Notice / Notification
10. Demo Module / Debug / Docs / Tests

각 큰 단계마다 아래를 실행하고 깨진 상태로 다음 단계로 넘어가지 마라.

```bash
npm run lint
npm test
npm run build
```

## 완료 후 보고

1. 구현 기능
2. 폴더 구조
3. 실행 방법
4. Mock Mode
5. Asset 교체 방법
6. Module 추가 방법
7. Menu 추가 방법
8. 실제 FastAPI 연결 위치
9. Skeleton만 구현한 기능
10. 테스트 결과
11. 빌드 결과
12. 다음 단계 추천

모호한 부분이 있어도 작업을 멈추지 말고 설계서의 전체 원칙에 가장 맞는 합리적인 기본값으로 구현해.
