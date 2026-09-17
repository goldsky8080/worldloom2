import { runtime, session, debugEnabled } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { settings, formatTime } from '../../services/settings';
import { timeService } from '../../services/time/TimeService';
import { notifications } from '../../services/notification';
import { useTranslation } from '../../services/localization';
import {
  CharacterPortrait,
  StatBar,
  CurrencyDisplay,
  IconButton,
  StatusBadge,
  UnreadBadge,
  GameButton,
} from '../../ui/components';
import { panelManager } from '../panels/PanelManager';
import { debugVisible } from '../state';
function Clock() {
  const now = useAtom(timeService.tick);
  useAtom(settings);
  return <time className="world-clock">{formatTime(now)}</time>;
}
export function HUD() {
  const user = useAtom(session),
    characters = useAtom(runtime.cache.characters),
    inventory = useAtom(runtime.cache.inventory),
    connection = useAtom(runtime.connection),
    alerts = useAtom(notifications.entries),
    { t } = useTranslation();
  useAtom(settings);
  const main = characters.characterPool.find((c) => c.id === characters.mainParty[0]);
  return (
    <header className="hud">
      <GameButton className="hud-character" onClick={() => panelManager.open('character')}>
        <CharacterPortrait name={main?.name ?? user?.nickname ?? ''} />
        <div>
          <strong>{main?.name ?? user?.nickname}</strong>
          <small>
            {t('common.level', { value: main?.level ?? 1 })} ·{' '}
            {t(main?.roleKey ?? 'character.scout')}
          </small>
          {main && <StatBar value={main.hp} max={main.maxHp} label={t('character.hp')} />}
        </div>
      </GameButton>
      <div className="hud-brand">
        <span className="gold-text">◇</span> LIVING WORLD<small>{t('common.mock')}</small>
      </div>
      <div className="hud-resources">
        <CurrencyDisplay value={inventory.gold} />
        <Clock />
        <StatusBadge kind={connection === 'connected' ? 'success' : 'danger'}>
          {t('network.' + connection)}
        </StatusBadge>
        <span className="hud-notifications">
          <IconButton
            icon="bell"
            label={t('menu.notifications')}
            onClick={() => panelManager.open('notifications')}
          />
          <UnreadBadge count={alerts.filter((n) => !n.read).length} />
        </span>
        <IconButton
          icon="sound"
          label={t('menu.settings')}
          onClick={() => panelManager.open('settings')}
        />
        {debugEnabled && (
          <GameButton
            className="debug-toggle"
            onClick={() => debugVisible.update((v) => !v)}
            title={t('debug.show')}
          >
            F2
          </GameButton>
        )}
      </div>
    </header>
  );
}
