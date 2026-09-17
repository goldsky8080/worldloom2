import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { CurrencyDisplay, ItemCard } from '../../ui/components';
export function InventoryPanel() {
  const inventory = useAtom(runtime.cache.inventory),
    { t } = useTranslation();
  return (
    <>
      <CurrencyDisplay value={inventory.gold} />
      <div className="inventory-grid">
        {inventory.items.map((item) => (
          <ItemCard
            key={item.id}
            assetId={item.assetId}
            name={t(item.nameKey)}
            quantity={item.quantity}
          />
        ))}
      </div>
    </>
  );
}
