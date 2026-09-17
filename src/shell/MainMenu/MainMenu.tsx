import { useNavigate } from 'react-router-dom';
import { moduleRegistry, menuCategories, type GameMenuItem } from '../../modules/registry';
import { panelManager } from '../panels/PanelManager';
import { useAtom } from '../../core/state/useAtom';
import { selectedMenu, chatUi } from '../state';
import { useTranslation } from '../../services/localization';
import { featureFlags } from '../../services/featureFlags';
import { runtime } from '../../app/bootstrap/services';
import { notifications } from '../../services/notification';
import { AssetImage, GameButton, UnreadBadge, GameTooltip } from '../../ui/components';
import { useMediaQuery } from '../../ui/layout/useMediaQuery';
import { camera, defaultCamera } from '../../world-renderer/camera/camera';
export function MainMenu() {
  const selected = useAtom(selectedMenu),
    { t } = useTranslation();
  return (
    <nav className="main-menu" aria-label={t('menu.mainNavigation')}>
      {menuCategories.map((category) => (
        <GameTooltip
          text={t('menu.' + category)}
          detail={
            category === 'world'
              ? t('world.hint')
              : category === 'life'
                ? t('mining.title')
                : undefined
          }
          key={category}
        >
          <GameButton
            className={'main-menu-item ' + (selected === category ? 'selected' : '')}
            aria-label={t('menu.' + category)}
            aria-expanded={selected === category}
            onClick={() => selectedMenu.set(selected === category ? null : category)}
          >
            <AssetImage assetId={'framework.menu.' + category} alt="" />
            <span>{t('menu.' + category)}</span>
          </GameButton>
        </GameTooltip>
      ))}
    </nav>
  );
}
export function SubMenu() {
  const selected = useAtom(selectedMenu),
    { t } = useTranslation(),
    navigate = useNavigate(),
    mail = useAtom(runtime.cache.mail),
    alerts = useAtom(notifications.entries);
  useAtom(featureFlags.flags);
  const mobile = useMediaQuery('(max-width: 700px)');
  if (!selected) return null;
  const items = moduleRegistry.menus.list(selected, mobile ? 'mobile' : 'web');
  function activate(item: GameMenuItem) {
    if (item.id === 'social.chat') {
      chatUi.update((ui) => ({ ...ui, minimized: false }));
      return;
    }
    if (item.target.type === 'route') {
      navigate(item.target.id);
      camera.set(defaultCamera());
      return;
    }
    const definition = moduleRegistry.panel(item.target.id);
    panelManager.open(definition.id, {
      singleton: definition.singleton,
      modal: item.target.type === 'modal',
      mode: item.target.type === 'modal' ? 'fullscreen' : 'floating',
    });
    selectedMenu.set(null);
  }
  return (
    <nav className="sub-menu" aria-label={t('menu.' + selected)}>
      <h2>{t('menu.' + selected)}</h2>
      {items.map((item) => (
        <GameButton
          key={item.id}
          aria-label={t(item.titleKey)}
          disabled={!moduleRegistry.menus.isEnabled(item)}
          className="sub-menu-item"
          onClick={() => activate(item)}
        >
          <AssetImage assetId={item.iconAssetId} alt="" />
          <span>{t(item.titleKey)}</span>
          <UnreadBadge
            count={
              item.badgeSource === 'mail'
                ? mail.filter((m) => !m.read).length
                : item.badgeSource === 'notifications'
                  ? alerts.filter((n) => !n.read).length
                  : 0
            }
          />
        </GameButton>
      ))}
    </nav>
  );
}
