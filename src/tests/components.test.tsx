import { NoticeLayer } from '../shell/GameShell/NoticeLayer';
import { createFixture } from '../mocks/fixtures/world';
import { runtime } from '../app/bootstrap/services';
import { timeService } from '../services/time/TimeService';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, act, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { GameButton, GamePanel, GameModal, GameTabs, AssetImage } from '../ui/components';
import { MainMenu, SubMenu } from '../shell/MainMenu/MainMenu';
import { SettingsPanel } from '../modules/settings/SettingsPanel';
import { AuthPage } from '../modules/auth/AuthPage';
import { PanelHost } from '../shell/panels/PanelHost';
import { panelManager } from '../shell/panels/PanelManager';
import { selectedMenu } from '../shell/state';
import { setLanguage } from '../services/localization';
import { defaultSettings, settings } from '../services/settings';
import { assetManager } from '../services/assets/AssetManager';
import { session, authGateway } from '../app/bootstrap/services';
beforeEach(() => {
  setLanguage('ko');
  settings.set(structuredClone(defaultSettings));
  panelManager.clear();
  selectedMenu.set('world');
  session.set(null);
});
afterEach(async () => {
  await authGateway.logout();
});
describe('game components', () => {
  it('handles clicks, disabled, loading and keyboard focus', async () => {
    const click = vi.fn();
    const { rerender } = render(<GameButton onClick={click}>Action</GameButton>);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(click).toHaveBeenCalledTimes(1);
    rerender(
      <GameButton disabled onClick={click}>
        Action
      </GameButton>,
    );
    await user.click(screen.getByRole('button'));
    expect(click).toHaveBeenCalledTimes(1);
    rerender(
      <GameButton loading onClick={click}>
        Action
      </GameButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  it('renders a framed panel with a named heading', () => {
    render(<GamePanel title="Inventory">Contents</GamePanel>);
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    expect(screen.getByText('Contents')).toBeVisible();
  });
  it('traps modal focus and closes on Escape', async () => {
    const close = vi.fn();
    render(
      <GameModal title="Dialog" onClose={close}>
        <GameButton>Last</GameButton>
      </GameModal>,
    );
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('moves selected tabs and focus using arrow keys', async () => {
    const onChange = vi.fn();
    render(
      <GameTabs
        tabs={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
        value="a"
        onChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'A' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
  });
  it('reveals submenu and opens a registered panel', async () => {
    render(
      <MemoryRouter>
        <MainMenu />
        <SubMenu />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: '소셜' }));
    expect(screen.getByRole('button', { name: '길드 · 준비 중' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '우편' }));
    expect(panelManager.panels.get()[0].panelType).toBe('mail');
    expect(selectedMenu.get()).toBeNull();
  });
  it('closes a managed panel', async () => {
    panelManager.open('settings');
    render(<PanelHost />);
    expect(screen.getByRole('dialog', { name: '설정' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('changes language instantly and controls sound', async () => {
    render(<SettingsPanel />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '언어' }), 'en');
    expect(screen.getByRole('tab', { name: 'General' })).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Sound' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Master volume' }), {
      target: { value: '0.8' },
    });
    expect(settings.get().sound.master).toBe(0.8);
  });
  it('shows a placeholder if final art is missing', async () => {
    vi.spyOn(assetManager, 'resolve').mockResolvedValue(
      assetManager.fallback('framework.menu.world'),
    );
    render(<AssetImage assetId="framework.menu.world" alt="World art" />);
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/placeholders/menu-world.svg'),
    );
  });
  it('logs in to the game route', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/game" element={<GamePanel title="World loaded">World</GamePanel>} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: '월드 접속' }));
    await screen.findByRole('heading', { name: 'World loaded' });
    expect(session.get()?.accountId).toBe('demo-account');
  });
  it('validates signup confirmation', async () => {
    render(
      <MemoryRouter>
        <AuthPage signup />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText('이메일'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호', { exact: true }), 'mockpass123');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'different123');
    await userEvent.type(screen.getByLabelText('닉네임'), 'Tester');
    fireEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByRole('alert')).toHaveTextContent('입력값 확인');
    expect(session.get()).toBeNull();
  });
});

describe('module modal and scheduled notices', () => {
  it('opens a module panel as an accessible modal and closes it with Escape', async () => {
    panelManager.open('settings', { modal: true });
    render(<PanelHost />);
    expect(screen.getByRole('dialog', { name: '설정' })).toHaveAttribute('aria-modal', 'true');
    await userEvent.keyboard('{Escape}');
    expect(panelManager.panels.get()).toHaveLength(0);
  });
  it('opens scheduled and newly published popup notices', async () => {
    sessionStorage.clear();
    const now = Date.now(),
      notice = createFixture(now).notices[0];
    const scheduled = {
      ...notice,
      id: 'scheduled',
      startsAt: new Date(now + 1000).toISOString(),
      endsAt: new Date(now + 10000).toISOString(),
    };
    runtime.cache.notices.set([scheduled]);
    timeService.tick.set(now);
    render(<NoticeLayer enabled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => timeService.tick.set(now + 1500));
    await screen.findByRole('dialog', { name: '프레임워크 탐험 개시' });
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() =>
      runtime.cache.notices.set([
        { ...scheduled, id: 'new-notice', titleKey: 'notice.maintenanceTitle' },
      ]),
    );
    await screen.findByRole('dialog', { name: '연결 복구 훈련 가능' });
    runtime.cache.notices.set([]);
    timeService.tick.set(Date.now());
  });
});
