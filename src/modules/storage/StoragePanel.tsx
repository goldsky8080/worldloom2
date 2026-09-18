import { useEffect, useState } from 'react';
import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useCommand } from '../../core/command/useCommand';
import { createCommand } from '../../core/command/createCommand';
import { PUBLIC_CITIES, STORAGE_CONFIG as C } from '../../core/storage/config';
import {
  ITEM_DEFINITIONS,
  itemDefinition,
  itemQuantity,
  totalWeight,
  fitQuantity,
  slotLimit,
  inventoryWeightLimit,
} from '../../core/storage/items';
import { cityAt, deliveryQuote } from '../../core/storage/model';
import type { StorageAction } from '../../core/storage/schema';
import { interpolate } from '../../core/world/interpolate';
import { timeService } from '../../services/time/TimeService';
import { useTranslation } from '../../services/localization';
import {
  GameButton,
  CurrencyDisplay,
  EmptyState,
  ErrorState,
  Countdown,
} from '../../ui/components';
import type { PanelProps } from '../registry';
import { CapacityControls } from './CapacityControls';
import './storage.css';
export function StoragePanel({ payload }: PanelProps) {
  const storage = useAtom(runtime.cache.storage),
    inv = useAtom(runtime.cache.inventory),
    world = useAtom(runtime.cache.world),
    mining = useAtom(runtime.cache.mining),
    now = useAtom(timeService.tick),
    { t, language } = useTranslation(),
    command = useCommand();
  const player = world.find((e) => e.id === 'player-1'),
    current = cityAt(player);
  const requested =
    typeof payload === 'object' && payload && 'cityId' in payload
      ? String(payload.cityId)
      : undefined;
  const [cityId, setCity] = useState(
      PUBLIC_CITIES.find((c) => c.id === requested)?.id ?? current?.id ?? 'dawn',
    ),
    [tab, setTab] = useState('warehouse'),
    [itemId, setItem] = useState('copper'),
    [draft, setDraft] = useState('10'),
    [destination, setDestination] = useState('harbor');
  useEffect(() => {
    const requestedCity = PUBLIC_CITIES.find((c) => c.id === requested);
    if (requestedCity) {
      setCity(requestedCity.id);
      setTab('depot');
    }
  }, [requested, payload]);
  const city = PUBLIC_CITIES.find((c) => c.id === cityId)!,
    warehouse = storage.warehouses.find((w) => w.cityId === cityId),
    local = current?.id === cityId,
    quantity = Number(draft),
    valid = Number.isInteger(quantity) && quantity > 0,
    busy = !!player?.movement || mining.active.some((a) => a.characterId === 'character-1'),
    blocked = command.disabled || busy || !local,
    personalQty = itemQuantity(inv.items, itemId),
    warehouseQty = itemQuantity(warehouse?.items ?? [], itemId);
  const batches = storage.depot
      .filter(
        (b) =>
          b.cityId === cityId && Date.parse(b.arrivedAt) <= now && Date.parse(b.expiresAt) > now,
      )
      .sort(
        (a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt) || a.id.localeCompare(b.id),
      ),
    depotQty = batches.filter((b) => b.itemId === itemId).reduce((n, b) => n + b.quantity, 0),
    fit = fitQuantity(inv.items, itemId, slotLimit(inv), inventoryWeightLimit(inv));
  const send = (action: StorageAction) =>
    void command.send(createCommand('STORAGE_ACTION', action));
  const quote = (() => {
    try {
      return deliveryQuote(cityId, destination, [
        {
          id: itemId,
          nameKey: itemDefinition(itemId).name,
          assetId: itemDefinition(itemId).assetId,
          quantity,
        },
      ]);
    } catch {
      return undefined;
    }
  })();
  return (
    <div className="storage-panel">
      <p className="muted">{t('storage.intro')}</p>
      <div className="storage-wallet">
        <CurrencyDisplay value={inv.gold} />
        <span>◈ {inv.gem ?? 0} Gem</span>
      </div>
      <label>
        {t('storage.publicCity')}
        <select
          data-testid="storage-city"
          value={cityId}
          onChange={(e) => setCity(e.target.value as typeof cityId)}
        >
          {PUBLIC_CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.nameKey)}
            </option>
          ))}
        </select>
      </label>
      <div className="storage-location" role="status" data-testid="storage-location">
        <strong>{local ? t('storage.arrived') : t('storage.mustVisit')}</strong>
        {player?.movement ? (
          <Countdown endsAt={player.movement.arrivesAt} />
        ) : (
          !local && (
            <GameButton
              disabled={command.disabled || busy || !player}
              onClick={() =>
                void command.send(
                  createCommand('MOVE', { entityId: 'player-1', x: city.x, y: city.y }),
                )
              }
            >
              {t('storage.travel')}
            </GameButton>
          )
        )}
        <small>
          {t('world.distance')}:{' '}
          {player
            ? Math.round(
                Math.hypot(
                  interpolate(player, now).x - city.x,
                  interpolate(player, now).y - city.y,
                ),
              )
            : '—'}{' '}
          {t('world.units')}
        </small>
      </div>
      <div role="tablist" aria-label={t('menu.storage')} className="storage-tabs">
        {['warehouse', 'depot', 'logistics'].map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={'storage-tab-' + key}
            aria-selected={tab === key}
            aria-controls="storage-content"
            data-testid={'storage-tab-' + key}
            onClick={() => setTab(key)}
          >
            {t('storage.' + key)}
          </button>
        ))}
      </div>
      <section id="storage-content" role="tabpanel" aria-labelledby={'storage-tab-' + tab}>
        {tab !== 'logistics' && !local ? (
          <p className="storage-notice">{t('storage.mustVisit')}</p>
        ) : (
          <>
            {tab === 'warehouse' && warehouse && (
              <>
                <h3>{t('storage.warehouse')}</h3>
                <p className="muted">{t('storage.warehouseRule')}</p>
                <CapacityControls
                  target="WAREHOUSE"
                  store={warehouse}
                  cityId={cityId}
                  local={local}
                />
                <div className="storage-stock" data-testid="storage-warehouse-stock">
                  {warehouse.items.length ? (
                    Object.values(ITEM_DEFINITIONS)
                      .filter((d) => itemQuantity(warehouse.items, d.id) > 0)
                      .map((d) => (
                        <p key={d.id}>
                          {t(d.name)} <strong>{itemQuantity(warehouse.items, d.id)}</strong>
                        </p>
                      ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </>
            )}
            {tab === 'depot' && (
              <>
                <h3>{t('storage.depot')}</h3>
                <p className="muted">{t('storage.depotRule')}</p>
                <div className="storage-batches" data-testid="storage-depot-batches">
                  {batches.length ? (
                    batches.map((b) => (
                      <article key={b.id}>
                        <strong>
                          {t(itemDefinition(b.itemId).name)} ×{b.quantity}
                        </strong>
                        <span>
                          {t('storage.expires')}:{' '}
                          {new Intl.DateTimeFormat(language, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(Date.parse(b.expiresAt))}
                        </span>
                        <small>{t('storage.source.' + b.source)}</small>
                      </article>
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </>
            )}
            {tab === 'logistics' && (
              <>
                <h3>{t('storage.logistics')}</h3>
                <p className="muted">{t('storage.logisticsRule')}</p>
                <label>
                  {t('storage.destination')}
                  <select
                    data-testid="storage-destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {PUBLIC_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(c.nameKey)}
                      </option>
                    ))}
                  </select>
                </label>
                <p data-testid="storage-quote">
                  {quote
                    ? t('storage.quote', {
                        seconds: Math.ceil(quote.durationMs / 1000),
                        weight: quote.weight,
                        fee: quote.fee,
                      })
                    : t('storage.sameCity')}
                </p>
                <div className="storage-shipments" data-testid="storage-shipments">
                  {storage.shipments.length ? (
                    storage.shipments.map((s) => (
                      <article key={s.id}>
                        <strong>
                          {t(PUBLIC_CITIES.find((c) => c.id === s.sourceCityId)!.nameKey)} →{' '}
                          {t(PUBLIC_CITIES.find((c) => c.id === s.destinationCityId)!.nameKey)}
                        </strong>
                        <span>
                          {t('storage.' + s.status)} · {s.cargo.reduce((n, i) => n + i.quantity, 0)}{' '}
                          · {s.fee} G
                        </span>
                        {s.status === 'IN_TRANSIT' && <Countdown endsAt={s.arrivesAt} />}
                        <progress
                          aria-label={t('storage.deliveryProgress')}
                          value={
                            s.status === 'DELIVERED'
                              ? 1
                              : Math.max(
                                  0,
                                  Math.min(
                                    1,
                                    (now - Date.parse(s.startedAt)) /
                                      (Date.parse(s.arrivesAt) - Date.parse(s.startedAt)),
                                  ),
                                )
                          }
                          max={1}
                        />
                      </article>
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </>
            )}
          </>
        )}
        <div className="storage-action-form">
          <label>
            {t('storage.item')}
            <select
              data-testid="storage-item"
              value={itemId}
              onChange={(e) => setItem(e.target.value)}
            >
              {Object.values(ITEM_DEFINITIONS).map((d) => (
                <option key={d.id} value={d.id}>
                  {t(d.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('storage.count')}
            <input
              data-testid="storage-count"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
        </div>
        {tab === 'warehouse' && (
          <div className="button-row">
            <GameButton
              data-testid="storage-deposit"
              disabled={blocked || !valid || quantity > personalQty}
              onClick={() =>
                send({ action: 'TRANSFER', cityId, direction: 'DEPOSIT', itemId, quantity })
              }
            >
              {t('storage.deposit')}
            </GameButton>
            <GameButton
              data-testid="storage-withdraw"
              disabled={blocked || !valid || quantity > warehouseQty || quantity > fit}
              onClick={() =>
                send({ action: 'TRANSFER', cityId, direction: 'WITHDRAW', itemId, quantity })
              }
            >
              {t('storage.withdraw')}
            </GameButton>
          </div>
        )}
        {tab === 'depot' && (
          <>
            <p className="muted">
              {t('storage.canReceive')}: {Math.min(depotQty, fit)}
            </p>
            <GameButton
              data-testid="storage-collect"
              disabled={blocked || !valid || quantity > depotQty || quantity > fit}
              onClick={() => send({ action: 'COLLECT', cityId, itemId, quantity })}
            >
              {t('storage.collect')}
            </GameButton>
          </>
        )}
        {tab === 'logistics' && (
          <GameButton
            data-testid="storage-ship"
            disabled={
              blocked ||
              !valid ||
              quantity > warehouseQty ||
              !quote ||
              inv.gold < (quote?.fee ?? Infinity)
            }
            onClick={() =>
              send({ action: 'SHIP', cityId, destinationCityId: destination, itemId, quantity })
            }
          >
            {t('storage.ship')}
          </GameButton>
        )}
      </section>
      <p className="storage-personal" data-testid="storage-personal">
        {t('storage.personal')}: {t(itemDefinition(itemId).name)} ×{personalQty} ·{' '}
        {t('storage.weight')} {totalWeight(inv.items)} / {inventoryWeightLimit(inv)}
      </p>
      <small className="muted">{t('storage.prototype', { speed: C.transportSpeed })}</small>
      {command.errorKey && <ErrorState error={t(command.errorKey)} onRetry={command.retry} />}
    </div>
  );
}
