# Debug / 검수

## 열기

npm run dev에서 F2 키 또는 HUD F2 버튼을 사용합니다. VITE_DEBUG=false로 개발 중 숨길 수 있으며 운영 빌드에서는 항상 숨깁니다.

표시 정보: Connection, Last Sequence, 열린 Panel 수, 현재 Menu·Language, Entity/Visible 수, Camera·Zoom, FPS, Mock Latency. Chunk/AOI 체크박스를 제공합니다.

## 시나리오

1. demo@living.world / demo1234로 진입하고 공지 팝업을 확인합니다.
2. 월드 드래그·휠 확대 또는 모바일 +/−를 사용합니다.
3. 마커를 눌러 상세 창을 열고 이동 명령을 보냅니다.
4. World → Character에서 Pool 7, Roster 5, Party 3을 확인합니다.
5. 구리 광맥을 클릭해 거리·가능 범위를 확인하고 광맥으로 이동합니다. 도착 후 채광을 시작합니다. 접수와 실제 완료의 차이, 5초 진행, 구리 광석 +3과 Copper 12→15를 확인합니다. Life → Mining에서도 같은 상태를 확인할 수 있습니다.
6. Social → Mail에서 전체 수령 후 Gold 1250→1325를 확인합니다. 중복 수령으로 늘어나지 않습니다.
7. Settings에서 5개 언어·각 음량·FPS·객체 표시량·이름·HP를 변경합니다.
8. Chat 채널 전환·메시지·Unread·최소화·크기 조절을 확인합니다.
9. F2에서 3초 끊김을 실행합니다. 입력이 잠기며 이후 Replay로 복구됩니다.
10. Event Gap을 주입합니다. 캐시를 무효화하고 Snapshot으로 복구합니다.
11. Session Expire를 실행합니다. 재접속 대신 로그인으로 돌아갑니다.
12. 여러 창을 열어 드래그·Focus·최소화·복원·Dock·Fullscreen·Escape를 확인합니다.

## 자동 검증

npm run lint / npm test / npm run build가 기본 검증입니다. npm run test:e2e는 Chromium의 실제 Pixi WebGL 렌더링과 데스크톱 1440×900, Pixel 7 크기를 검사합니다. 전용 포트 5187이 사용 중이면 중단하며 다른 앱을 임의 재사용하지 않습니다.

E2E에서 docs/screenshots/login-_, world-_, inventory-* 화면을 생성합니다. Playwright HTML 보고서는 playwright-report, 실패 Trace는 test-results에 생성됩니다. Chromium 설치 또는 PLAYWRIGHT_CHROMIUM_EXECUTABLE 환경변수가 필요합니다.

## 제한

실서버·실제 이메일·영속 게임 DB를 시험하지 않습니다. WebGL을 사용할 수 없으면 월드 렌더러 오류 Overlay와 재시도를 표시합니다. 최종 아트·사운드 도입 후 시각 검수를 다시 수행해야 합니다.

지도 키보드 조작: Canvas에 포커스 후 방향키로 Pan, +/−로 Zoom, Enter로 가장 가까운 표시 객체를 선택합니다. 모바일은 초기 채팅을 최소화하며 채팅 버튼으로 열 수 있습니다.

이미 실행 중인 이 프로젝트 서버를 검증할 때 PLAYWRIGHT_EXTERNAL_SERVER=1과 PLAYWRIGHT_BASE_URL을 지정하면 자동 서버 시작을 생략합니다.

v0.2 세부 수동 검수와 규칙은 [V0_2_IMPLEMENTATION.md](V0_2_IMPLEMENTATION.md)를 보세요.
