import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FiefPage } from '../modules/fief/FiefPage';
import { setLanguage } from '../services/localization';
vi.mock('../modules/atlas/AtlasSprite', () => ({ AtlasSprite: () => null }));
beforeEach(() => {
  setLanguage('ko');
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance', 'Date'] });
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => {
  Reflect.deleteProperty(document, 'hidden');
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('fief gameplay lifecycle', () => {
  it('defaults to gameplay, with no test controls until DEV is opened', () => {
    render(
      <MemoryRouter>
        <FiefPage />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('fief-dev-panel')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '도시 레벨 · 테스트' })).not.toBeInTheDocument();
    expect(screen.getByTestId('fief-raid-start')).toBeEnabled();
    fireEvent.click(screen.getByTestId('fief-dev-toggle'));
    expect(screen.getByTestId('fief-dev-city-level')).toBeVisible();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('fief-dev-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('fief-dev-toggle')).toHaveFocus();
  });
  it('runs a single clock under StrictMode, pauses hidden tabs and cleans up on unmount', () => {
    const added = vi.spyOn(document, 'addEventListener'),
      removed = vi.spyOn(document, 'removeEventListener');
    const view = render(
      <StrictMode>
        <MemoryRouter>
          <FiefPage />
        </MemoryRouter>
      </StrictMode>,
    );
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('fief-aether-value')).toHaveTextContent('12.6');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByTestId('fief-aether-value')).toHaveTextContent('12.6');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('fief-aether-value')).toHaveTextContent('13.2');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(added.mock.calls.filter(([key]) => key === 'visibilitychange').length).toBe(
      removed.mock.calls.filter(([key]) => key === 'visibilitychange').length,
    );
  });
  it('prevents duplicate raid clicks and only completes after preparation and progress', () => {
    render(
      <MemoryRouter>
        <FiefPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTestId('fief-raid-start'));
    expect(screen.getByTestId('fief-raid-start')).toBeDisabled();
    expect(screen.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'PREPARING');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'IN_PROGRESS');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'SUCCEEDED');
    expect(screen.getByTestId('fief-aether-value')).toHaveTextContent('0.0');
  });
});

it('recruits a chosen count after time and reserves healthy subsets for standing defense', () => {
  render(
    <MemoryRouter>
      <FiefPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: '성', exact: true }));
  fireEvent.change(screen.getByTestId('fief-recruit-count'), { target: { value: '10' } });
  fireEvent.click(screen.getByTestId('fief-recruit'));
  expect(screen.getByTestId('fief-healthy')).toHaveTextContent('40');
  expect(screen.getByTestId('fief-treasury')).toHaveAttribute('data-value', '9750');
  expect(screen.getByTestId('fief-recruit')).toBeDisabled();
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByTestId('fief-healthy')).toHaveTextContent('50');
  fireEvent.change(screen.getByTestId('fief-standing-count'), { target: { value: '51' } });
  expect(screen.getByTestId('fief-standing-apply')).toBeDisabled();
  fireEvent.change(screen.getByTestId('fief-standing-count'), { target: { value: '20' } });
  fireEvent.click(screen.getByTestId('fief-standing-apply'));
  expect(screen.getByTestId('fief-available')).toHaveTextContent('30');
  expect(screen.getByTestId('fief-garrison')).toHaveTextContent('50 / 80');
});
it('tax and policies use cooldowns and slots without immediate state boosts', () => {
  render(
    <MemoryRouter>
      <FiefPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: '장원', exact: true }));
  fireEvent.click(screen.getByTestId('fief-tax-high'));
  expect(screen.getByTestId('fief-tax-low')).toBeDisabled();
  expect(screen.getByTestId('fief-sentiment-value')).toHaveTextContent('70');
  expect(screen.getByTestId('fief-prosperity-value')).toHaveTextContent('60');
  fireEvent.click(screen.getByTestId('fief-policy-security_support'));
  expect(screen.getByTestId('fief-policy-slots')).toHaveTextContent('1 / 1');
  expect(screen.getByTestId('fief-policy-resident_relief')).toBeDisabled();
  expect(screen.getByTestId('fief-treasury')).toHaveAttribute('data-value', '10000');
  act(() => vi.advanceTimersByTime(20000));
  expect(screen.getByTestId('fief-tax-low')).toBeEnabled();
  fireEvent.click(screen.getByTestId('fief-policy-security_support'));
  expect(screen.getByTestId('fief-policy-slots')).toHaveTextContent('0 / 1');
});
