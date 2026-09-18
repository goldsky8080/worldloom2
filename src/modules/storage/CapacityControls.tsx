import { runtime } from '../../app/bootstrap/services';
import { useCommand } from '../../core/command/useCommand';
import { createCommand } from '../../core/command/createCommand';
import { slotLimit } from '../../core/storage/items';
import { expansionQuote } from '../../core/storage/model';
import type { Warehouse } from '../../core/storage/schema';
import type { Inventory } from '../../core/contracts';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { GameButton, ErrorState } from '../../ui/components';
export function CapacityControls({
  target,
  store,
  cityId,
  local = true,
}: {
  target: 'INVENTORY' | 'WAREHOUSE';
  store: Inventory | Warehouse;
  cityId?: string;
  local?: boolean;
}) {
  const inv = useAtom(runtime.cache.inventory),
    command = useCommand(),
    { t } = useTranslation();
  const quote = (currency: 'GOLD' | 'GEM') => {
    try {
      return expansionQuote(store, currency);
    } catch {
      return undefined;
    }
  };
  const gold = quote('GOLD'),
    gem = quote('GEM');
  const expand = (currency: 'GOLD' | 'GEM') =>
    void command.send(
      createCommand('STORAGE_ACTION', { action: 'EXPAND', target, cityId, currency }),
    );
  return (
    <section className="storage-capacity">
      <p data-testid={target === 'INVENTORY' ? 'inventory-slots' : 'warehouse-slots'}>
        {t('storage.slots')}: {store.items.length} / {slotLimit(store)}
      </p>
      <div className="button-row">
        <GameButton
          data-testid={target === 'INVENTORY' ? 'inventory-expand-gold' : 'warehouse-expand-gold'}
          disabled={!local || command.disabled || !gold || inv.gold < (gold?.cost ?? Infinity)}
          onClick={() => expand('GOLD')}
        >
          {t('storage.expandGold')} ·{' '}
          {gold ? gold.nextSlots + ' / ' + gold.cost + ' G' : t('storage.completed')}
        </GameButton>
        <GameButton
          disabled={!local || command.disabled || !gem || (inv.gem ?? 0) < (gem?.cost ?? Infinity)}
          onClick={() => expand('GEM')}
        >
          {t('storage.expandGem')} ·{' '}
          {gem
            ? gem.nextSlots + ' / ' + gem.cost + ' Gem'
            : (store.goldExpansion ?? 0) < 6
              ? t('storage.goldFirst')
              : t('storage.completed')}
        </GameButton>
      </div>
      {command.errorKey && <ErrorState error={t(command.errorKey)} onRetry={command.retry} />}
    </section>
  );
}
