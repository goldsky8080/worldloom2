# Module / Menu / Panel 추가

## 샘플 기준

src/modules/mining/MiningModule.ts와 MiningPanel.tsx를 보세요. 이 모듈은 월드맵 선택과 범위 검사를 가진 채광 흐름을 제공합니다. 도메인 판정과 보상 지급은 MockWorldServer에 있습니다.

Module 등록 → Menu 등록 → Panel 등록 → Localization Namespace → Asset ID → Command → Mock Server → Event → Inventory/Notification

## 등록 방법

```tsx
const TransportModule: GameModuleDefinition = {
  id: 'transport',
  version: '0.1.0',
  localizationNamespaces: ['transport'],
  panels: [{ id: 'transport', titleKey: 'transport.title', component: TransportPanel }],
  menuItems: [
    {
      id: 'life.transport',
      categoryId: 'life',
      order: 20,
      titleKey: 'transport.title',
      iconAssetId: 'transport.menu',
      target: { type: 'panel', id: 'transport' },
    },
  ],
  assets: [
    {
      id: 'transport.menu',
      path: '/assets/content/events/transport.webp',
      fallback: '/assets/placeholders/menu-life.svg',
      aspectRatio: '1/1',
      recommendedSize: [256, 256],
      group: 'module',
    },
  ],
};
```

1. 패널을 modules/transport 아래에 작성합니다.
2. 5개 언어 사전에 키를 추가합니다.
3. registerModules에서 moduleRegistry.register(TransportModule)를 호출합니다.
4. 모듈 자산은 registerModules의 마지막 Asset 등록 루프에서 등록됩니다.
5. 실제 명령이 필요하면 Command/Event Zod Union과 Mock 또는 실제 서버 처리기를 함께 확장합니다.

MainMenu.tsx에는 콘텐츠 메뉴를 추가하지 않습니다. 대메뉴 카테고리 목록은 데모 6종이며 Registry의 카테고리를 확장할 수 있습니다.

## 메뉴 옵션

visible / enabled / platforms, featureFlag, unlockRule, badgeSource를 지원합니다. 잠금 규칙은 menus.registerUnlock(ruleId, evaluator)로 등록합니다. 모듈 기능 플래그는 부팅 등록 시, 메뉴 플래그는 표시 시 평가됩니다. 길드 메뉴는 현재 비활성 Placeholder입니다.

target.type은 panel / route / modal입니다. Route는 상위 진입점·독립 화면용이며 일반 콘텐츠는 Panel을 사용합니다. 모듈 routes 메타데이터는 상위 Router에 등록됩니다.

## 패널 관리

panelManager.open(panelId, { payload, singleton, instanceKey, mode })를 사용합니다. 기본값은 단일 창이고 다시 열면 기존 창을 복원·집중합니다. 개별 캐릭터 창처럼 여러 인스턴스가 필요하면 singleton:false와 instanceKey를 사용합니다. payload는 unknown이므로 패널 진입점에서 검증합니다.

mode는 floating / docked / fullscreen입니다. 모바일에서는 공통 CSS가 모든 창을 Sheet로 표시합니다. 포커스는 배열의 마지막 창으로 옮기고, 최소화 창은 하단 복원 버튼으로 남깁니다. Escape는 마지막 열린 창을 닫습니다.

## 이벤트

Backend 이벤트는 GameRuntime에서 처리하고 UiEventBus의 panel.open / entity.selected 등과 구분합니다. 메뉴·패널 내부에서 직접 fetch나 WebSocket을 생성하지 않습니다. eventHandlers 메타데이터는 registerModules에서 Runtime.onGameEvent로 자동 구독합니다. 추가 구독도 동일 API의 반환된 unsubscribe 함수를 사용할 수 있습니다.

## AtlasPreview 모듈

AtlasModule은 /atlas 읽기용 공개 경로와 월드 메뉴 항목을 등록합니다. 실제 플레이 세션의 GameRuntime을 시작하지 않으며 Region/Territory/House/Site의 시각적 표현을 검증합니다. 공통 AssetManager에 실제 아틀라스 등록과 로더를 추가했습니다. 기존 /game의 명령·이벤트·Cache·이동·채광 모델은 유지합니다.

샘플 데이터와 표시용 장면, WorldObjectRegistry, Pixi 장면, React 정보 패널은 src/modules/atlas/에서 관리합니다. 지연 로드로 기존 게임 진입 시 샘플 화면 코드·아틀라스 로드를 피합니다. 서버 세계로 통합하는 후속 범위는 [ATLAS_PREVIEW.md](ATLAS_PREVIEW.md)에 명시했습니다.
