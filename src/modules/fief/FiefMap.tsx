import type { CSSProperties } from 'react';
import { AtlasSprite } from '../atlas/AtlasSprite';
import { dungeonStatus, type Facility, type FiefState } from './model';
const places: { kind: Facility; x: number; y: number }[] = [
  { kind: 'castle', x: 30, y: 31 },
  { kind: 'city', x: 52, y: 55 },
  { kind: 'manor', x: 23, y: 66 },
  { kind: 'dungeon', x: 79, y: 26 },
];
export function facilityFrame(kind: Facility, state: FiefState) {
  return kind === 'dungeon'
    ? 'world.dungeon.base'
    : kind === 'manor'
      ? 'settlement.manor.l1'
      : 'settlement.' + kind + '.l' + (kind === 'city' ? state.cityLevel : state.castleLevel);
}
export function FiefMap({
  state,
  selected,
  onSelect,
  t,
}: {
  state: FiefState;
  selected: Facility;
  onSelect: (kind: Facility) => void;
  t: (key: string) => string;
}) {
  const danger = dungeonStatus(state.aether) === 'break';
  return (
    <div
      className={'fief-map ' + (danger ? 'is-break' : '')}
      role="group"
      aria-label={t('map')}
      data-testid="fief-map"
      data-dungeon-id={state.dungeonId}
    >
      <svg
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        className="fief-terrain"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fief-ground" x2="0" y2="1">
            <stop stopColor="#313d34" />
            <stop offset="1" stopColor="#1d3029" />
          </linearGradient>
          <linearGradient id="fief-river" x2="1" y2="1">
            <stop stopColor="#476970" />
            <stop offset="1" stopColor="#2b4b53" />
          </linearGradient>
          <pattern
            id="fief-fields"
            width="23"
            height="23"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-24)"
          >
            <path d="M0 0V23" stroke="#c4ad70" strokeWidth="3" opacity=".23" />
          </pattern>
        </defs>
        <rect width="1000" height="640" fill="url(#fief-ground)" />
        <path d="M-30 160Q210 45 355 170T800 80T1100 210V-20H-30Z" fill="#455046" opacity=".42" />
        <path d="M-20 475Q170 330 345 435T705 500T1050 400V680H-20Z" fill="#3b4e37" opacity=".5" />
        <path
          d="M20 230L68 70L142 204L184 96L242 260M658 96L701 20L761 120L815 28L893 157L939 65L1002 231"
          fill="#57615a"
          stroke="#677068"
          strokeWidth="2"
          opacity=".7"
        />
        <path
          d="M69 70L78 124L57 126M184 96L193 132L173 138M701 20L719 56L686 61M815 28L834 67L799 69"
          fill="#c3c7b6"
          opacity=".47"
        />
        <path
          d="M523 -10C403 120 655 181 581 315S635 470 522 660"
          fill="none"
          stroke="#172822"
          strokeWidth="48"
        />
        <path
          d="M523 -10C403 120 655 181 581 315S635 470 522 660"
          fill="none"
          stroke="url(#fief-river)"
          strokeWidth="33"
        />
        <path
          d="M516 -10C396 120 648 181 574 315S628 470 515 660"
          fill="none"
          stroke="#9cb4af"
          strokeWidth="1"
          opacity=".4"
        />
        <path d="M72 414L319 345L435 473L245 574L86 524Z" fill="#737250" opacity=".35" />
        <path d="M72 414L319 345L435 473L245 574L86 524Z" fill="url(#fief-fields)" />
        <path
          d="M130 598Q245 457 298 207Q391 259 520 361Q672 327 790 175M298 207Q270 314 230 433M520 361Q690 440 860 580"
          fill="none"
          stroke="#192c26"
          strokeWidth="15"
        />
        <path
          d="M130 598Q245 457 298 207Q391 259 520 361Q672 327 790 175M298 207Q270 314 230 433M520 361Q690 440 860 580"
          fill="none"
          stroke="#a19570"
          strokeWidth="6"
          opacity=".55"
        />
        <path d="M584 316L596 346M576 321L588 352" stroke="#c4ad80" strokeWidth="8" />
        {Array.from({ length: 52 }, (_, i) => {
          const x = i < 25 ? 38 + ((i * 83) % 315) : 694 + ((i * 57) % 259),
            y = 245 + ((i * 47) % 340);
          return (
            <g key={i} transform={'translate(' + x + ' ' + y + ')'} opacity=".65">
              <ellipse cy="13" rx="12" ry="5" fill="#10231b" />
              <path
                d="M0 -21L-12 8H-7L-15 16H15L7 8H12Z"
                fill={i % 3 === 0 ? '#526748' : '#395542'}
              />
            </g>
          );
        })}
        <path
          d="M60 280Q36 113 274 75L449 128L672 59L931 206L959 466L842 574L611 607L440 551L246 597L61 522Z"
          fill="none"
          stroke="#d1bc87"
          strokeWidth="2"
          strokeDasharray="8 8"
          opacity=".47"
        />
        <circle
          cx="790"
          cy="166"
          r={danger ? 110 : 64}
          fill={danger ? '#e0684233' : '#b6a07b0c'}
          stroke={danger ? '#f17d57' : '#b6a07b'}
          strokeDasharray="5 9"
          opacity=".7"
        />
        <g fill="#d3c6a0" fontFamily="serif" fontSize="18" opacity=".65">
          <text x="425" y="145" transform="rotate(13 425 145)">
            DAWNWATER
          </text>
          <text x="730" y="550">
            ERDEN
          </text>
        </g>
        <g transform="translate(929 74)" stroke="#d3c6a0" fill="none" opacity=".8">
          <circle r="24" />
          <path d="M0 -35L8 0L0 30L-8 0Z" />
          <path d="M-30 0H30" />
          <text y="-43" textAnchor="middle" stroke="none" fill="#d3c6a0" fontSize="12">
            N
          </text>
        </g>
      </svg>
      <div className="fief-map-label">
        <span>{t('instance')}</span>
        <small>{t('mapHint')}</small>
      </div>
      {places.map((p) => {
        const level =
          p.kind === 'city' ? state.cityLevel : p.kind === 'castle' ? state.castleLevel : 1;
        return (
          <button
            key={p.kind}
            type="button"
            className={'fief-site ' + (selected === p.kind ? 'is-selected' : '')}
            aria-pressed={selected === p.kind}
            aria-label={t(p.kind)}
            onClick={() => onSelect(p.kind)}
            style={{ '--site-x': p.x + '%', '--site-y': p.y + '%' } as CSSProperties}
          >
            <AtlasSprite frameKey={facilityFrame(p.kind, state)} size={96} />
            <span className="fief-site-name">
              {t(p.kind)} <b>{p.kind === 'dungeon' ? state.grade : 'L' + level}</b>
            </span>
            {p.kind === 'dungeon' && (
              <small className={'fief-site-status status-' + dungeonStatus(state.aether)}>
                {t(dungeonStatus(state.aether))}
              </small>
            )}
          </button>
        );
      })}
      <div className="fief-map-scale">
        <span />
        100 m · PREVIEW
      </div>
    </div>
  );
}
