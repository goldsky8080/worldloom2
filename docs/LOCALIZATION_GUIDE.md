# Localization

언어는 ko / en / ja / zh-CN / vi입니다. 각 사전은 src/i18n/<language>/common.json에 있으며 동일한 키 집합을 제공합니다. useTranslation().t(key, values)로 사용합니다.

```tsx
const { t } = useTranslation();
<GameButton>{t('mining.start')}</GameButton>;
t('character.roster', { count: roster.length });
```

초기 Namespace는 common, menu, auth, settings, chat, mail, notice, world, character, inventory, mining, command, network, debug, notification입니다. 파일은 v0.2에서도 언어별 하나로 유지하되 키 Prefix로 Namespace를 구분합니다.

새 기능은 모든 사전에 같은 키를 추가합니다. 새 언어는 localization/index.ts의 languages와 dictionaries, languageLabels에 등록하고 Settings Zod Enum도 동일 목록을 사용하게 합니다. 키가 없으면 영어, 영어도 없으면 키 자체로 Fallback합니다. 개발 중 키가 노출되면 번역 누락을 수정하세요.

설정에서 언어를 바꾸면 locale Atom과 HTML lang이 즉시 갱신되고 React·Pixi의 텍스트도 갱신됩니다. 숫자는 Intl.NumberFormat, 시간/날짜는 Intl.DateTimeFormat을 사용합니다.

브랜드 이름, 플레이어 닉네임, 사용자 채팅, 좌표·레벨은 번역 문구가 아닌 데이터입니다. Placeholder 아트에 적힌 규격은 아트 제작자용 기술 설명입니다. 임의 UI 문구를 컴포넌트에 직접 넣지 않습니다.

긴 번역은 패널 내부에서 줄바꿈하거나 Tabs에서 가로 스크롤합니다. 모바일 입력은 16px 이상으로 유지하며 메뉴 아이콘은 이름과 함께 접근 가능한 레이블을 제공합니다. 사전 키 완전성을 단위 테스트로 검사합니다.

v0.2는 world.distance/travelTime/arrivesIn/destination 및 mining 범위·진행·완료·오류, command.busy를 5개 언어에 추가했습니다.
