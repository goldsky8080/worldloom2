# 공통 Game UI 규칙

1. 일반 웹 대시보드·흰 Card 반복·문서형 네비게이션을 게임 화면에 사용하지 않습니다.
2. 모든 콘텐츠는 공통 Theme Token을 사용합니다.
3. 임의 색상 반복을 피하고 토큰에서 색상을 가져옵니다.
4. 주요 패널은 GamePanel/GameWindow, 대화상자는 GameModal을 사용합니다.
5. UI 문자열은 다국어 키를 사용합니다. 브랜드·사용자 입력·플레이어 이름·수치는 별도 데이터입니다.
6. 이미지는 Asset ID와 AssetManager를 경유합니다.
7. 메뉴는 Registry로 등록합니다.
8. 월드 객체를 React DOM으로 대량 렌더링하지 않습니다.
9. 결과 변경은 서버 Command/Event/Snapshot 흐름을 따릅니다.
10. Simulator의 내부 객체나 클래스에 직접 결합하지 않습니다.

레이어는 theme.layers / CSS --layer-*에 정의되어 있습니다. Background → World → HUD → Menu → Panel → Modal → Tooltip → Toast → Critical 순서입니다. 여러 패널은 같은 레이어 안에서 DOM 순서로 포커스를 정합니다.

Hover, Press, Disabled, Busy, Focus-visible을 공통 버튼에 구현합니다. 최소 터치 영역은 44px, 입력 폰트는 16px입니다. Tabs는 좌우·Home·End 키로 이동하며 Modal은 포커스를 가두고 Escape로 닫힙니다. 게임 패널은 Escape로 마지막 창을 닫습니다.

Panel/Menu/Toast/Badge 애니메이션은 공통 Motion Duration을 사용합니다. 저품질 설정과 prefers-reduced-motion을 지원합니다. 패널 닫기는 즉시 정리하며 별도 Close Timeline은 이후 전용 아트 도입 시 확장 가능합니다.

공통 컴포넌트는 ui/components/index.tsx에 있습니다. GamePopover·Tooltip·Frame은 확장용 기능도 제공하며 실제 콘텐츠의 장식 프레임은 Placeholder 상태입니다.
