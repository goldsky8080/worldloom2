import { CapacityControls } from '../storage/CapacityControls';
import { totalWeight, inventoryWeightLimit } from '../../core/storage/items';
import { panelManager } from '../../shell/panels/PanelManager';
import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { GameButton, CurrencyDisplay, ItemCard } from '../../ui/components';
export function InventoryPanel() {
  const inventory = useAtom(runtime.cache.inventory),
    { t } = useTranslation();
  return (
    <>
      <CurrencyDisplay value={inventory.gold} />
      <div className="inventory-summary">
        <span>◈ {inventory.gem ?? 0} Gem</span>
        <span data-testid="inventory-weight">
          {t('storage.weight')}: {totalWeight(inventory.items)} / {inventoryWeightLimit(inventory)}
        </span>
      </div>
      <CapacityControls target="INVENTORY" store={inventory} />
      <GameButton onClick={() => panelManager.open('storage')}>{t('menu.storage')}</GameButton>
      <p className="muted">{t('storage.weightPrototype')}</p>
      <div className="inventory-grid">
        {inventory.items.map((item) => (
          <ItemCard
            key={item.slotId ?? item.id}
            assetId={item.assetId}
            name={t(item.nameKey)}
            quantity={item.quantity}
          />
        ))}
      </div>
    </>
  );
}
