import { PanelHost } from '../shell/panels/PanelHost';
import { panelManager } from '../shell/panels/PanelManager';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { runtime } from '../app/bootstrap/services';
import { createFixture } from '../mocks/fixtures/world';
import { EntityPanel } from '../modules/world/EntityPanel';
import { MiningPanel } from '../modules/mining/MiningPanel';
import { MiningStatus } from '../modules/mining/MiningStatus';
import { selectedEntity, selectedMenu } from '../shell/state';
import { timeService } from '../services/time/TimeService';
import { setLanguage, languages, dictionaries } from '../services/localization';
beforeEach(() => {
  runtime.stop();
  setLanguage('ko');
  selectedEntity.set('player-1');
  selectedMenu.set(null);
  panelManager.clear();
  runtime.cache.hydrate(createFixture());
  runtime.connection.set('connected');
  timeService.tick.set(Date.now());
});
afterEach(() => {
  runtime.stop();
  setLanguage('ko');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  panelManager.clear();
});
function nearby() {
  runtime.cache.world.update((world) =>
    world.map((e) => (e.id === 'player-1' ? { ...e, x: 1200, y: 600 } : e)),
  );
}
it('requires choosing a real interactive vein rather than mining from a menu anywhere', () => {
  render(<MiningPanel />);
  expect(screen.getByText('광맥을 선택하세요')).toBeVisible();
  expect(screen.queryByRole('button', { name: '채광 시작' })).toBeNull();
});
it('displays distance, range, estimate and disables remote mining', () => {
  render(<EntityPanel payload={{ entityId: 'resource-1' }} />);
  expect(screen.getByText('현재 거리')).toBeVisible();
  expect(screen.getByText('채광 가능 거리')).toBeVisible();
  expect(screen.getByText('예상 이동시간')).toBeVisible();
  expect(screen.getByTestId('world-distance')).toHaveTextContent('256.1 단위');
  expect(screen.getByRole('button', { name: '채광 시작' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '광맥으로 이동' })).toBeEnabled();
});
it('enables mining only after a server world event puts the player in range', () => {
  render(<EntityPanel payload={{ entityId: 'resource-1' }} />);
  expect(screen.getByRole('button', { name: '채광 시작' })).toBeDisabled();
  act(() => nearby());
  expect(screen.getByRole('button', { name: '채광 시작' })).toBeEnabled();
});
it('keeps mining locked during movement even after a displayed countdown reaches zero', () => {
  const now = Date.now();
  nearby();
  runtime.cache.world.update((world) =>
    world.map((e) =>
      e.id === 'player-1'
        ? {
            ...e,
            movement: {
              fromX: 1040,
              fromY: 800,
              toX: 1200,
              toY: 600,
              startedAt: new Date(now - 10000).toISOString(),
              arrivesAt: new Date(now - 1).toISOString(),
            },
          }
        : e,
    ),
  );
  render(<EntityPanel payload={{ entityId: 'resource-1' }} />);
  expect(screen.getByRole('button', { name: '채광 시작' })).toBeDisabled();
  expect(screen.getByText('00:00')).toBeVisible();
  expect(screen.queryByText('구리 광석 +3')).toBeNull();
});
it('shares active mining progress across panels and blocks both actions', () => {
  nearby();
  const now = Date.now();
  runtime.cache.mining.set({
    active: [
      {
        commandId: crypto.randomUUID(),
        characterId: 'character-1',
        nodeId: 'resource-1',
        startedAt: new Date(now - 1000).toISOString(),
        completesAt: new Date(now + 4000).toISOString(),
      },
    ],
    recentResults: [],
  });
  render(<MiningPanel />);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
  expect(screen.getByRole('button', { name: '광맥으로 이동' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '채광 시작' })).toBeDisabled();
});
it('shows only authoritative rewards while a finished timer waits for server completion', () => {
  const now = Date.now(),
    activity = {
      commandId: crypto.randomUUID(),
      characterId: 'character-1',
      nodeId: 'resource-1',
      startedAt: new Date(now - 5000).toISOString(),
      completesAt: new Date(now).toISOString(),
    };
  const { rerender } = render(<MiningStatus activity={activity} now={now} />);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  expect(screen.getByText('서버 결과를 기다리는 중')).toBeVisible();
  expect(screen.queryByText('구리 광석 +3')).toBeNull();
  rerender(
    <MiningStatus
      now={now}
      result={{
        commandId: activity.commandId,
        characterId: 'character-1',
        nodeId: 'resource-1',
        completedAt: new Date(now).toISOString(),
        rewards: [{ itemId: 'copper', quantity: 3 }],
      }}
    />,
  );
  expect(screen.getByText('구리 광석 +3')).toBeVisible();
});
it('updates the new interaction text immediately in all five locales', () => {
  const { rerender } = render(<EntityPanel payload={{ entityId: 'resource-1' }} />);
  for (const language of languages) {
    act(() => setLanguage(language));
    rerender(<EntityPanel payload={{ entityId: 'resource-1' }} />);
    expect(screen.getByText(dictionaries[language]['world.distance'])).toBeVisible();
    expect(
      screen.getByRole('button', { name: dictionaries[language]['mining.start'] }),
    ).toBeDisabled();
  }
});

it('temporarily makes mobile panels inert when a submenu is opened, preserving the panel', () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  panelManager.open('inventory');
  const { container } = render(<PanelHost />);
  expect(screen.getByRole('dialog', { name: '인벤토리' })).toBeVisible();
  act(() => selectedMenu.set('system'));
  expect(container.querySelector('.panel-host')).toHaveAttribute('inert');
  expect(container.querySelector('.panel-host')).toHaveAttribute('aria-hidden', 'true');
  expect(panelManager.panels.get()).toHaveLength(1);
  act(() => selectedMenu.set(null));
  expect(container.querySelector('.panel-host')).not.toHaveAttribute('inert');
  expect(screen.getByRole('dialog', { name: '인벤토리' })).toBeVisible();
});
