# Asset 교체 가이드

## 규칙

이번 v0.2 작업에서는 최종 아트를 제작하거나 다운로드하지 않았습니다. 기존 사용자 WebP 파일은 보존했으며, Manifest 경로에 파일이 없으면 용도·규격이 적힌 SVG Placeholder를 사용합니다. Pixi 지도 도형은 Mock 레이아웃이며 최종 지도 아트가 아닙니다.

## 교체

1. src/assets/manifest/framework.ts 또는 모듈의 assets 정의에서 Asset ID와 path를 확인합니다.
2. 해당 public/assets/... 경로에 실제 WebP를 배치합니다.
3. 새로고침하면 기존 Placeholder 대신 실제 파일이 사용됩니다. UI 컴포넌트 수정은 필요 없습니다.
4. 경로나 형식만 바꾸려면 public/assets/manifest.json에 ID별 Override를 작성합니다.

```json
{
  "framework.background.login": {
    "path": "/assets/framework/backgrounds/new-login.webp",
    "themes": { "winter": "/assets/framework/backgrounds/winter.webp" }
  }
}
```

허용 경로는 /assets/ 아래입니다. 외부 URL·출처 불명 이미지 다운로드를 기본 자산 흐름에 섞지 않습니다. 잘못된 Override는 안전하게 무시합니다. 기본 아트가 없는 초기 데모에서는 기본 WebP 요청의 404 이후 설명형 SVG를 사용합니다. 이 404는 Placeholder 정책의 정상 동작이며 실제 아트 배치 시 사라집니다.

## 권장 규격

| 용도             | 권장 크기 |    비율 |
| ---------------- | --------: | ------: |
| 로그인 배경      | 1920×1080 |    16:9 |
| 대/소메뉴 아이콘 |   256×256 |     1:1 |
| 월드 마커        |     64×64 |     1:1 |
| 캐릭터 초상화    |   384×512 |     3:4 |
| 아이템           |   128×128 |     1:1 |
| 프레임           |   256×256 | 9-Slice |

SVG Placeholder는 확대·축소 확인이 쉬운 벡터 샘플이며 Manifest의 recommendedSize가 제작 기준입니다. 모든 컴포넌트는 aspectRatio를 사용해 아트 교체 시 레이아웃이 흔들리지 않게 합니다.

## 서비스

AssetManager는 중복 ID를 거부하고 resolve 결과와 진행 중 Promise를 캐시합니다. 기본 파일 실패 시 fallback을 로드하고, 둘 다 실패하면 UI 오류 자리를 유지합니다. 그룹은 core / login / shell / module / optional입니다. preload(group)로 특정 그룹을 준비할 수 있으며 현재 모듈의 AssetImage는 Lazy Resolve합니다. 모든 콘텐츠 자산을 초기 접속 때 미리 로딩하지 않습니다.

setTheme(name)은 캐시를 비워 해당 Theme 경로를 선택합니다. 그룹·테마·SpriteSheet atlas/frame·nineSlice는 AssetDefinition 메타데이터로 분리됩니다. 초기 Renderer는 정적 마커 Texture를 사용하고 실제 SpriteSheet 애니메이션 런타임은 이후 확장합니다.

GamePanel은 frameUrl prop을 받아 CSS border-image로 9-Slice 프레임을 적용할 수 있습니다. 실제 9-Slice 아트가 준비되면 AssetManager.resolve 결과를 전달합니다. 초기에는 CSS 프레임을 사용합니다.

AudioService.register(id, url)로 사운드를 연결합니다. 파일이 없는 UI 사운드는 사용자 클릭 후 짧은 테스트 톤을 사용합니다. BGM 파일은 제공하지 않았으며 setBgm 연결점만 준비되어 있습니다.

v0.2 채광 자산 ID는 mining.vein이며 /assets/content/locations/copper-vein.webp 경로를 사용합니다. 미배치 시 item-copper.svg로 대체합니다.

## 샘플 월드 아틀라스

월드·도시·성·아이템의 코드 기반 미리보기 아틀라스가 public/assets/{world,items,common}/atlas/에 있습니다. SVG 원본, WebP 시트, JSON 프레임을 함께 보존합니다. src/services/assets/atlas.ts는 프레임 키·시트 등록·표시 크기를 관리하고 AssetManager는 프레임 범위와 이미지 규격을 검증합니다. React AtlasSprite와 Pixi AtlasScene이 같은 매니페스트를 사용합니다. 좌표는 렌더러에 하드코딩하지 않습니다.

재생성은 node scripts/build-preview-atlases.mjs입니다. 기존 사용자 아트 경로를 덮어쓰지 않습니다. 최종 아트 교체 시 프레임 키와 JSON 규격을 유지하면 됩니다. 자세한 구성과 제작 범위는 [ATLAS_PREVIEW.md](ATLAS_PREVIEW.md)를 참고합니다.
