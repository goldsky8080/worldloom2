import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { GameButton } from '../../ui/components';
import { useAtom } from '../../core/state/useAtom';
import { useMediaQuery } from '../../ui/layout/useMediaQuery';
import { session } from '../../app/bootstrap/services';
import {
  languageLabels,
  languages,
  setLanguage,
  useTranslation,
  type Language,
} from '../../services/localization';
import { enhancementKey } from '../../services/assets/atlas';
import { AtlasScene, type AtlasStats } from './AtlasScene';
import { useAtlasCopy } from './copy';
import { AtlasSprite, HouseCrest } from './AtlasSprite';
import { regionForScenario } from './sampleRegion';
import {
  PREVIEW_WORLD,
  visualKey,
  type AtlasLayers,
  type Scenario,
  type Selection,
  type SettlementState,
  type Territory,
  type WorldObject,
} from './model';
import './atlas.css';
const initialLayers: AtlasLayers = {
  borders: true,
  houses: true,
  settlements: true,
  resources: true,
  actors: true,
  sites: false,
};
const scenarios: Scenario[] = ['frontier', 'prosperity', 'conflict', 'decline'];
const states: SettlementState[] = [
  'normal',
  'prosperous',
  'damaged',
  'burning',
  'siege',
  'plague',
  'abandoned',
  'construction',
];
type InspectorTab = 'territories' | 'houseList' | 'objects' | 'items';
function Compass() {
  return (
    <svg className="atlas-compass" viewBox="0 0 80 94" aria-hidden="true">
      <circle cx="40" cy="49" r="24" fill="none" stroke="currentColor" opacity=".3" />
      <path d="M40 15L49 49L40 81L31 49Z" fill="none" stroke="currentColor" />
      <path d="M9 49L40 41L71 49L40 57Z" fill="none" stroke="currentColor" opacity=".4" />
      <path d="M40 15L49 49L40 44Z" fill="currentColor" />
      <text x="40" y="10" textAnchor="middle" fill="currentColor" fontSize="10">
        N
      </text>
    </svg>
  );
}
export function AtlasPage() {
  const { t: commonT } = useTranslation();
  const { t, name, language } = useAtlasCopy(),
    user = useAtom(session);
  const mobile = useMediaQuery('(max-width:700px)'),
    [layersOpen, setLayersOpen] = useState(false);
  const inspectorScroll = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<AtlasScene | undefined>(undefined);
  const [scenario, setScenario] = useState<Scenario>('frontier'),
    [layers, setLayers] = useState(initialLayers);
  const [politicalMode, setPoliticalMode] = useState<'owner' | 'controller'>('owner');
  const [selection, setSelection] = useState<Selection>({ type: 'territory', id: 'A-06' });
  const [tab, setTab] = useState<InspectorTab>('territories'),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [stats, setStats] = useState<AtlasStats>({ lod: 'far', visible: 0, zoom: 0.15 });
  const [visualOverride, setVisualOverride] = useState<{
    id: string;
    level: number;
    state: SettlementState;
  }>();
  const [tool, setTool] = useState<'pickaxe' | 'sword'>('pickaxe'),
    [tier, setTier] = useState(3),
    [rarity, setRarity] = useState('rare'),
    [enhancement, setEnhancement] = useState(7);
  const region = useMemo(() => regionForScenario(scenario), [scenario]);
  const displayRegion = useMemo(
    () =>
      !visualOverride
        ? region
        : {
            ...region,
            objects: region.objects.map((o) =>
              o.id === visualOverride.id
                ? { ...o, level: visualOverride.level, state: visualOverride.state }
                : o,
            ),
          },
    [region, visualOverride],
  );
  const callbacks = useRef({ setSelection, setTab });
  const options = useRef({ region: displayRegion, layers, selection, language, politicalMode });
  options.current = { region: displayRegion, layers, selection, language, politicalMode };
  useEffect(() => {
    if (!host.current) return;
    let alive = true;
    setReady(false);
    setError(false);
    const atlas = new AtlasScene(
      host.current,
      options.current,
      (selected) => {
        callbacks.current.setSelection(selected);
        callbacks.current.setTab(
          selected.type === 'object' || selected.type === 'site'
            ? 'objects'
            : selected.type === 'house'
              ? 'houseList'
              : 'territories',
        );
      },
      setStats,
    );
    scene.current = atlas;
    void atlas
      .init()
      .then(() => {
        if (alive) {
          atlas.update(options.current);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) {
          atlas.destroy();
          setError(true);
        }
      });
    return () => {
      alive = false;
      atlas.destroy();
      scene.current = undefined;
    };
  }, [attempt]);
  useEffect(() => {
    scene.current?.update({ region: displayRegion, layers, selection, language, politicalMode });
  }, [displayRegion, layers, selection, language, politicalMode]);
  useEffect(() => {
    inspectorScroll.current?.scrollTo({ top: 0 });
  }, [tab, selection.id]);
  const territory = region.territories.find((t) => t.id === selection.id),
    object = displayRegion.objects.find((o) => o.id === selection.id),
    site = region.sites.find((s) => s.id === selection.id),
    house = region.houses.find((h) => h.id === selection.id);
  function choose(selected: Selection, focus = true) {
    setSelection(selected);
    if (selected.type === 'site') setLayers((old) => ({ ...old, sites: true }));
    if (selected.type === 'object' || selected.type === 'site') setTab('objects');
    if (selected.type === 'house') setTab('houseList');
    if (selected.type === 'territory') setTab('territories');
    if (!focus) return;
    if (selected.type === 'territory') {
      const t = region.territories.find((t) => t.id === selected.id);
      if (t) scene.current?.focus(t.center.x, t.center.y, 0.38);
    }
    if (selected.type === 'object') {
      const o = region.objects.find((o) => o.id === selected.id);
      if (o) scene.current?.focus(o.x, o.y, 0.75);
    }
    if (selected.type === 'site') {
      const s = region.sites.find((s) => s.id === selected.id);
      if (s) scene.current?.focus(s.x, s.y, 0.5);
    }
    if (selected.type === 'house') {
      const h = region.houses.find((h) => h.id === selected.id),
        seat = region.objects.find((o) => o.id === h?.seatEntityId);
      if (seat) scene.current?.focus(seat.x, seat.y, 0.5);
    }
  }
  function houseName(id?: string) {
    return name(region.houses.find((h) => h.id === id)?.name ?? [t('unclaimed'), t('unclaimed')]);
  }
  function houseRow(label: string, id?: string) {
    const h = region.houses.find((h) => h.id === id);
    return (
      <div className="atlas-detail-row">
        <span>{t(label)}</span>
        <button
          className="atlas-house-link"
          disabled={!h}
          onClick={() => h && choose({ type: 'house', id: h.id }, false)}
        >
          {h && <HouseCrest crest={h.crest} size={26} />}
          <strong>{houseName(id)}</strong>
        </button>
      </div>
    );
  }
  function ownership(o: Pick<Territory, 'ownerHouseId' | 'controllerHouseId' | 'operatorHouseId'>) {
    return (
      <div className="atlas-ownership">
        {houseRow('owner', o.ownerHouseId)}
        {houseRow('controller', o.controllerHouseId)}
        {o.operatorHouseId && houseRow('operator', o.operatorHouseId)}
      </div>
    );
  }
  function metric(key: string, value: number | string) {
    return (
      <div className="atlas-detail-row" key={key}>
        <span>{t(key)}</span>
        <strong>{typeof value === 'number' ? value.toLocaleString(language) : value}</strong>
      </div>
    );
  }
  function objectInfo(o: WorldObject) {
    const isVariant = [
      'city',
      'capital',
      'castle',
      'town',
      'village',
      'manor',
      'outpost',
      'mine',
      'port',
    ].includes(o.kind);
    return (
      <>
        <div className="atlas-object-hero">
          <AtlasSprite frameKey={visualKey(o)} size={146} />
          <div>
            <span className="atlas-tag">
              {t(o.kind)} · L{o.level}
            </span>
            <h2>{name(o.name)}</h2>
            <span className={'atlas-state ' + o.state}>{t(o.state)}</span>
          </div>
        </div>
        {ownership(o)}
        <div className="atlas-metrics">
          {[
            'population',
            'economy',
            'infrastructure',
            'security',
            'supply',
            'fortification',
            'garrisonCapacity',
            'supplyCapacity',
            'patrolRadius',
            'siegeResistance',
          ].map((key) => {
            const value = o[key as keyof WorldObject];
            return typeof value === 'number' ? metric(key, value) : null;
          })}
        </div>
        <div className="atlas-detail-row">
          <span>{t('territories')}</span>
          <button
            className="atlas-inline-link"
            onClick={() => choose({ type: 'territory', id: o.territoryId })}
          >
            {o.territoryId}
          </button>
        </div>
        {isVariant && (
          <details className="atlas-variant" open>
            <summary>{t('visualPreview')}</summary>
            <label>
              {t('level')} · L{o.level}
              <input
                aria-label={t('level')}
                type="range"
                min="1"
                max={['mine', 'port', 'outpost', 'manor'].includes(o.kind) ? 3 : 5}
                value={o.level}
                onChange={(e) =>
                  setVisualOverride({ id: o.id, level: Number(e.target.value), state: o.state })
                }
              />
            </label>
            <label>
              {t('state')}
              <select
                aria-label={t('state')}
                value={o.state}
                onChange={(e) =>
                  setVisualOverride({
                    id: o.id,
                    level: o.level,
                    state: e.target.value as SettlementState,
                  })
                }
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {t(state)}
                  </option>
                ))}
              </select>
            </label>
            <GameButton onClick={() => setVisualOverride(undefined)}>{t('reset')}</GameButton>
          </details>
        )}
        <p className="atlas-small-note">{t('scenarioNote')}</p>
      </>
    );
  }
  const visibleObjects = region.objects;
  return (
    <div className="atlas-page">
      <header className="atlas-header">
        <div className="atlas-brand">
          <span className="atlas-brand-mark">W</span>
          <div>
            <span className="atlas-eyebrow">WORLDLOOM II</span>
            <h1>{t('title')}</h1>
          </div>
        </div>
        <div className="atlas-header-center">
          <span>{t('subtitle')}</span>
          <span className="atlas-preview-badge">{t('preview')}</span>
        </div>
        <div className="atlas-header-actions">
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {languageLabels[l]}
              </option>
            ))}
          </select>
          <Link className="atlas-back" to="/fief">
            {commonT('menu.fief')} ↗
          </Link>
          <Link className="atlas-back" to={user ? '/game' : '/login'}>
            {t('game')} ↗
          </Link>
        </div>
      </header>
      <div className="atlas-content">
        <main className="atlas-map">
          <div ref={host} className="atlas-canvas-host" data-testid="atlas-map" />
          {!ready && !error && (
            <div className="atlas-map-status" role="status">
              {t('loading')}
            </div>
          )}
          {error && (
            <div className="atlas-map-status" role="alert">
              <p>{t('error')}</p>
              <GameButton onClick={() => setAttempt((v) => v + 1)}>{t('retry')}</GameButton>
            </div>
          )}
          <div className="atlas-map-toolbar">
            <div className="atlas-scale-tabs" role="group" aria-label={t('visualPreview')}>
              {(['far', 'medium', 'near'] as const).map((lod) => (
                <GameButton
                  key={lod}
                  disabled={!ready}
                  className={stats.lod === lod ? 'active' : ''}
                  onClick={() =>
                    lod === 'far'
                      ? scene.current?.zoomTo(0.17)
                      : scene.current?.focus(
                          object?.x ??
                            site?.x ??
                            territory?.center.x ??
                            scene.current.getCamera().x,
                          object?.y ??
                            site?.y ??
                            territory?.center.y ??
                            scene.current.getCamera().y,
                          lod === 'medium' ? 0.4 : 0.8,
                        )
                  }
                >
                  {t(lod)}
                </GameButton>
              ))}
            </div>
            <GameButton disabled={!ready} onClick={() => scene.current?.fit()}>
              {t('fit')}
            </GameButton>
          </div>
          <div className="atlas-map-caption">
            <span className="atlas-eyebrow">
              REGION A · {region.width.toLocaleString()} × {region.height.toLocaleString()}
            </span>
            <strong>
              {region.territories.length} {t('territories')} <span> / </span>{' '}
              {region.sites.filter((s) => s.kind === 'castle').length} {t('castle')}{' '}
              <span> / </span> {region.sites.filter((s) => s.kind === 'city').length} {t('city')}
            </strong>
          </div>
          <aside className="atlas-layer-controls" aria-label={t('layers')}>
            {mobile ? (
              <button
                className="atlas-layers-toggle"
                aria-expanded={layersOpen}
                onClick={() => setLayersOpen((old) => !old)}
              >
                {t('layers')} {layersOpen ? '−' : '+'}
              </button>
            ) : (
              <span className="atlas-eyebrow">{t('layers')}</span>
            )}
            {(!mobile || layersOpen) && (
              <>
                <div className="atlas-political-mode" role="group" aria-label={t('ownershipView')}>
                  <button
                    aria-pressed={politicalMode === 'owner'}
                    onClick={() => setPoliticalMode('owner')}
                  >
                    {t('ownershipView')}
                  </button>
                  <button
                    aria-pressed={politicalMode === 'controller'}
                    onClick={() => setPoliticalMode('controller')}
                  >
                    {t('controlView')}
                  </button>
                </div>
                {(Object.keys(layers) as (keyof AtlasLayers)[]).map((key, index) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(e) => setLayers((old) => ({ ...old, [key]: e.target.checked }))}
                    />
                    <span className="atlas-layer-symbol" aria-hidden="true">
                      {['◇', '⚑', '♜', '❧', '♟', '⌖'][index]}
                    </span>
                    <span>{t(key)}</span>
                  </label>
                ))}
              </>
            )}
          </aside>
          <Compass />
          <div className="atlas-zoom">
            <GameButton
              disabled={!ready}
              aria-label="Zoom in"
              onClick={() => scene.current?.zoom(1.3)}
            >
              +
            </GameButton>
            <span>{Math.round(stats.zoom * 100)}%</span>
            <GameButton
              disabled={!ready}
              aria-label="Zoom out"
              onClick={() => scene.current?.zoom(1 / 1.3)}
            >
              −
            </GameButton>
          </div>
          <div className="atlas-map-bottom">
            <p className="atlas-scene-story">{t(scenario + 'Story')}</p>
            <div className="atlas-legend">
              {region.houses.slice(0, 5).map((h) => (
                <button
                  key={h.id}
                  style={{ '--house-color': h.crest.primaryColor } as CSSProperties}
                  onClick={() => choose({ type: 'house', id: h.id })}
                >
                  <i />
                  <span>{name(h.name)}</span>
                </button>
              ))}
            </div>
            <div className="atlas-map-readout">
              <span>
                {t(stats.lod)} · {stats.visible} {t('objects')}
              </span>
              <span className="atlas-keyboard-hint">{t('drag')}</span>
            </div>
          </div>
          <div className="atlas-world-inset" aria-label="World preview">
            <span>
              WORLD · {PREVIEW_WORLD.width.toLocaleString()} ×{' '}
              {PREVIEW_WORLD.height.toLocaleString()} <em>~{PREVIEW_WORLD.regionTarget}</em>
            </span>
            <svg viewBox="0 0 170 80" aria-hidden="true">
              <path
                d="M10 37L24 21L52 9L69 15L83 10L113 20L124 38L158 40L150 61L122 64L110 75L79 67L52 73L29 56Z"
                fill="#29443d"
                stroke="#567067"
              />
              {Array.from({ length: 60 }, (_, i) => (
                <circle
                  key={i}
                  cx={27 + (i % 12) * 10}
                  cy={24 + Math.floor(i / 12) * 9}
                  r={i === 25 ? 4 : 1.5}
                  fill={i === 25 ? '#d5c28b' : i < 4 ? '#789b83' : '#465e53'}
                />
              ))}
              <path d="M40 23L53 23L53 35L40 35Z" fill="none" stroke="#d5c28b" />
            </svg>
          </div>
        </main>
        <aside className="atlas-inspector" aria-label={t('visualPreview')}>
          <div className="atlas-inspector-tabs" role="tablist">
            {(['territories', 'houseList', 'objects', 'items'] as InspectorTab[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                aria-controls={'atlas-tab-' + key}
                id={'atlas-tab-button-' + key}
                onClick={() => {
                  setTab(key);
                  if (key === 'territories' && selection.type !== 'territory')
                    setSelection({ type: 'territory', id: object?.territoryId ?? 'A-06' });
                  if (key === 'houseList' && selection.type !== 'house')
                    setSelection({
                      type: 'house',
                      id: object?.ownerHouseId ?? territory?.controllerHouseId ?? 'aurora',
                    });
                  if (key === 'objects' && !object && !site)
                    setSelection({ type: 'object', id: 'capital-1' });
                }}
              >
                {t(key)}
              </button>
            ))}
          </div>
          <div
            ref={inspectorScroll}
            className="atlas-inspector-scroll"
            role="tabpanel"
            id={'atlas-tab-' + tab}
            aria-labelledby={'atlas-tab-button-' + tab}
          >
            {tab === 'territories' && (
              <>
                <label className="atlas-select-label">
                  {t('territories')}
                  <select
                    aria-label={t('territories')}
                    value={territory?.id ?? 'A-06'}
                    onChange={(e) => choose({ type: 'territory', id: e.target.value })}
                  >
                    {region.territories.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} · {name(t.name)}
                      </option>
                    ))}
                  </select>
                </label>
                {territory && (
                  <>
                    <div className="atlas-territory-title">
                      <span className="atlas-eyebrow">TERRITORY {territory.id}</span>
                      <h2>{name(territory.name)}</h2>
                      <span className={'atlas-state ' + territory.state}>
                        {t(territory.state === 'frontier' ? 'frontierZone' : territory.state)}
                      </span>
                    </div>
                    {ownership(territory)}
                    <div className="atlas-metrics">
                      {metric(
                        'zone',
                        t(territory.zone === 'frontier' ? 'frontierZone' : territory.zone),
                      )}
                      {metric(
                        'size',
                        t(territory.sizeClass === 'medium' ? 'mediumSize' : territory.sizeClass),
                      )}
                      {territory.stewardshipDays &&
                        metric('term', territory.stewardshipDays + ' ' + t('days'))}
                    </div>
                    <div className="atlas-potentials">
                      {Object.entries(territory.potential).map(([key, value]) => (
                        <div key={key}>
                          <span>{t(key)}</span>
                          <div className="atlas-rating" aria-label={value + '/5'}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <i key={i} className={i < value ? 'filled' : ''} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <h3>{t('objects')}</h3>
                    <div className="atlas-landmark-list">
                      {region.objects
                        .filter(
                          (o) =>
                            o.territoryId === territory.id &&
                            !['forest', 'resource', 'farm'].includes(o.kind),
                        )
                        .map((o) => (
                          <button key={o.id} onClick={() => choose({ type: 'object', id: o.id })}>
                            <AtlasSprite frameKey={visualKey(o)} size={46} />
                            <span>
                              <strong>{name(o.name)}</strong>
                              <small>
                                {t(o.kind)} · L{o.level}
                              </small>
                            </span>
                            <b>↗</b>
                          </button>
                        ))}
                    </div>
                    <h3>{t('sites')}</h3>
                    <div className="atlas-site-list">
                      {region.sites
                        .filter((s) => s.territoryId === territory.id && !s.entityId)
                        .map((s) => (
                          <button key={s.id} onClick={() => choose({ type: 'site', id: s.id })}>
                            ◇ {t(s.kind)} · {t('sites')} ↗
                          </button>
                        ))}
                    </div>
                    <GameButton onClick={() => choose(selection)}>{t('focus')}</GameButton>
                  </>
                )}
              </>
            )}
            {tab === 'houseList' && (
              <>
                <label className="atlas-select-label">
                  {t('houseList')}
                  <select
                    aria-label={t('houseList')}
                    value={house?.id ?? 'aurora'}
                    onChange={(e) => choose({ type: 'house', id: e.target.value })}
                  >
                    {region.houses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {name(h.name)}
                      </option>
                    ))}
                  </select>
                </label>
                {house && (
                  <>
                    <div className="atlas-house-hero">
                      <HouseCrest crest={house.crest} size={100} />
                      <h2>{name(house.name)}</h2>
                      <span className="atlas-tag">{t(house.titleRank)}</span>
                    </div>
                    <div className="atlas-metrics">
                      {metric('houseLevel', house.level)}
                      {metric('titleRank', t(house.titleRank))}
                      {metric('prestige', house.prestige)}
                      {metric('influence', house.influence)}
                      {metric(
                        'holdings',
                        region.territories.filter((t) => t.ownerHouseId === house.id).length,
                      )}
                    </div>
                    {house.id === 'wanderer' && <p className="atlas-small-note">{t('noLand')}</p>}
                    <div className="atlas-house-territories">
                      {region.territories
                        .filter(
                          (t) => t.ownerHouseId === house.id || t.controllerHouseId === house.id,
                        )
                        .map((t) => (
                          <button
                            key={t.id}
                            onClick={() => choose({ type: 'territory', id: t.id })}
                          >
                            <span>{t.id}</span> {name(t.name)}{' '}
                            <small>
                              {t.ownerHouseId === house.id
                                ? name(['소유자', 'Owner'])
                                : name(['통치자', 'Controller'])}
                            </small>
                          </button>
                        ))}
                    </div>
                    {house.seatEntityId && (
                      <GameButton
                        onClick={() => choose({ type: 'object', id: house.seatEntityId! })}
                      >
                        {t('focus')}
                      </GameButton>
                    )}
                    <div className="atlas-crest-gallery">
                      {region.houses.map((h) => (
                        <button
                          key={h.id}
                          title={name(h.name)}
                          onClick={() => choose({ type: 'house', id: h.id }, false)}
                        >
                          <HouseCrest crest={h.crest} size={42} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 'objects' && (
              <>
                <label className="atlas-select-label">
                  {t('objects')}
                  <select
                    aria-label={t('objects')}
                    value={object?.id ?? site?.id ?? 'capital-1'}
                    onChange={(e) =>
                      choose({
                        type: region.sites.some((s) => s.id === e.target.value) ? 'site' : 'object',
                        id: e.target.value,
                      })
                    }
                  >
                    <optgroup label={t('objects')}>
                      {visibleObjects.map((o) => (
                        <option key={o.id} value={o.id}>
                          {t(o.kind)} · {name(o.name)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t('sites')}>
                      {region.sites
                        .filter((s) => !s.entityId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.territoryId} · {t(s.kind)}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
                {object && objectInfo(object)}
                {site && (
                  <>
                    <div className="atlas-territory-title">
                      <span className="atlas-eyebrow">{site.territoryId} · SITE</span>
                      <h2>
                        {t(site.kind)} · {t('sites')}
                      </h2>
                    </div>
                    <p className="atlas-small-note">{t('siteHint')}</p>
                    <GameButton onClick={() => choose(selection)}>{t('focus')}</GameButton>
                  </>
                )}
              </>
            )}
            {tab === 'items' && (
              <>
                <h2>{t('items')}</h2>
                <div
                  className={'atlas-item-composite rarity-' + rarity}
                  data-testid="atlas-item-visual"
                >
                  <AtlasSprite frameKey={'item.' + tool + '.t' + tier} size={156} />
                  <AtlasSprite frameKey={'rarity.' + rarity} size={156} />
                  {enhancementKey(enhancement) && (
                    <AtlasSprite frameKey={enhancementKey(enhancement)!} size={156} />
                  )}
                  <strong>+{enhancement}</strong>
                </div>
                <div className="atlas-item-name">
                  {t(rarity)} {t(tool)} · T{tier} +{enhancement}
                </div>
                <div className="atlas-item-controls">
                  <select
                    aria-label={t('items')}
                    value={tool}
                    onChange={(e) => setTool(e.target.value as 'pickaxe' | 'sword')}
                  >
                    <option value="pickaxe">{t('pickaxe')}</option>
                    <option value="sword">{t('sword')}</option>
                  </select>
                  <label>
                    {t('tier')} · T{tier}
                    <input
                      aria-label={t('tier')}
                      type="range"
                      min="1"
                      max="5"
                      value={tier}
                      onChange={(e) => setTier(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    {t('rarity')}
                    <select
                      aria-label={t('rarity')}
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                    >
                      {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
                        <option key={r} value={r}>
                          {t(r)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('enhancement')} · +{enhancement}
                    <input
                      aria-label={t('enhancement')}
                      type="range"
                      min="0"
                      max="15"
                      value={enhancement}
                      onChange={(e) => setEnhancement(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="atlas-item-tiers">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setTier(i + 1)}
                      className={tier === i + 1 ? 'active' : ''}
                    >
                      <AtlasSprite frameKey={'item.' + tool + '.t' + (i + 1)} size={48} />
                      <span>T{i + 1}</span>
                    </button>
                  ))}
                </div>
                <p className="atlas-small-note">{t('itemNote')}</p>
              </>
            )}
          </div>
        </aside>
      </div>
      <footer className="atlas-timeline">
        <div className="atlas-timeline-title">
          <span className="atlas-eyebrow">A LIVING WORLD</span>
          <p>{t('scenarioHint')}</p>
        </div>
        <div className="atlas-scenarios" role="group" aria-label={t('scenarioHint')}>
          {scenarios.map((s, i) => (
            <GameButton
              key={s}
              className={scenario === s ? 'active' : ''}
              aria-pressed={scenario === s}
              onClick={() => {
                setScenario(s);
                setVisualOverride(undefined);
              }}
            >
              <span className="atlas-scenario-index">0{i + 1}</span>
              {t(s)}
            </GameButton>
          ))}
        </div>
      </footer>
    </div>
  );
}
