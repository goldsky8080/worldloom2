import { test, expect, type Page, type TestInfo } from '@playwright/test';
// Keep Chromium's normal compositor: forcing ANGLE software rendering leaves scroll
// capture artifacts with a paused clock. WebGL can still use its software fallback.
test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--enable-unsafe-swiftshader'],
  },
});
async function gameplay(page: Page) {
  await page.clock.install();
  await page.goto('/fief');
  await expect(page.getByRole('heading', { name: '새벽물결 영지', exact: true })).toBeVisible();
  await expect(page.getByTestId('fief-dev-panel')).toHaveCount(0);
  await page.getByTestId('fief-dev-toggle').click();
  await page
    .getByRole('combobox', { name: '개발용 시간 조작', exact: true })
    .selectOption('design');
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await page.getByTestId('fief-dev-toggle').click();
}
async function dev(page: Page, operation: () => Promise<void>) {
  await page.getByTestId('fief-dev-toggle').click();
  await operation();
  await page.getByTestId('fief-dev-toggle').click();
}
async function capture(page: Page, name: string, info: TestInfo) {
  await page.getByTestId('fief-page').evaluate((el) => (el.scrollTop = 0));
  await page.screenshot({
    animations: 'disabled',
    path: 'docs/screenshots/' + name + '-' + info.project.name + '.png',
  });
}
async function gold(page: Page) {
  return Number(await page.getByTestId('fief-treasury').getAttribute('data-value'));
}
async function aether(page: Page) {
  return Number((await page.getByTestId('fief-aether-value').innerText()).split('/')[0]);
}
test('map-led gameplay hides DEV, facility touch/keyboard selection and localized context', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gameplay(page);
  await expect(page.getByTestId('fief-dev-panel')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: '도시 레벨 · 테스트' })).toHaveCount(0);
  await expect(page.getByTestId('fief-context')).toHaveAttribute('data-facility', 'dungeon');
  await expect(page.getByTestId('fief-raid-start')).toBeEnabled();
  await expect(page.getByTestId('fief-contract-start')).toBeEnabled();
  await expect(page.getByTestId('fief-pressure-value')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.fief-site .atlas-sprite')
        .evaluateAll((els) => els.every((el) => getComputedStyle(el).backgroundImage !== 'none')),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await capture(page, 'fief-gameplay-overview', info);
  for (const [name, facility] of [
    ['성', 'castle'],
    ['도시', 'city'],
    ['장원', 'manor'],
    ['영지 던전', 'dungeon'],
  ]) {
    const button = page.getByRole('button', { name, exact: true });
    if (info.project.name === 'mobile') await button.tap();
    else {
      await button.focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId('fief-context')).toHaveAttribute('data-facility', facility);
  }
  const locale = page.locator('.fief-header select');
  const keys = {
    en: 'Raid dungeon',
    ja: '直接攻略',
    'zh-CN': '直接攻略',
    vi: 'Đột kích hầm ngục',
    ko: '직접 공략',
  };
  for (const [code, label] of Object.entries(keys)) {
    await locale.selectOption(code);
    await expect(page.getByTestId('fief-raid-start')).toHaveText(new RegExp(label));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(errors).toEqual([]);
});
test('paid recruiting and animated patrol reduce pressure without lowering aether', async ({
  page,
}, info) => {
  await gameplay(page);
  const beforeAether = await aether(page);
  await dev(page, async () => {
    for (let i = 0; i < 3; i++) await page.getByTestId('fief-dev-pressure').click();
  });
  await expect(page.getByTestId('fief-pressure-marker')).toHaveCount(4);
  await page.getByRole('button', { name: '성', exact: true }).click();
  const beforeGold = await gold(page);
  await page.getByTestId('fief-recruit').click();
  expect(await gold(page)).toBe(beforeGold - 500);
  await expect(page.getByTestId('fief-garrison')).toContainText('60');
  const pressure = Number(
    (await page.getByTestId('fief-pressure-value').innerText()).split('/')[0],
  );
  await page.getByTestId('fief-patrol-start').click();
  expect(await gold(page)).toBe(beforeGold - 750);
  await expect(page.getByTestId('fief-patrol-start')).toBeDisabled();
  await expect(page.getByTestId('fief-patrol-marker')).toBeVisible();
  const x = await page
    .getByTestId('fief-patrol-marker')
    .evaluate((el) => getComputedStyle(el).left);
  await page.clock.runFor(3250);
  expect(
    await page.getByTestId('fief-patrol-marker').evaluate((el) => getComputedStyle(el).left),
  ).not.toBe(x);
  await capture(page, 'fief-patrol', info);
  await page.clock.runFor(3500);
  await expect(page.getByTestId('fief-patrol-status')).toHaveAttribute('data-state', 'SUCCEEDED');
  expect(
    Number((await page.getByTestId('fief-pressure-value').innerText()).split('/')[0]),
  ).toBeCloseTo(pressure - 40, 0);
  await page.getByRole('button', { name: '영지 던전', exact: true }).click();
  expect(await aether(page)).toBe(beforeAether);
});
test('direct raid visibly prepares and completes after progress with duplicate prevention', async ({
  page,
}) => {
  await gameplay(page);
  await dev(page, async () => {
    for (let i = 0; i < 3; i++) await page.getByTestId('fief-dev-aether').click();
  });
  const before = await aether(page);
  await page.getByTestId('fief-raid-start').click();
  await expect(page.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'PREPARING');
  await expect(page.getByTestId('fief-raid-start')).toBeDisabled();
  expect(await aether(page)).toBe(before);
  await page.clock.runFor(1250);
  await expect(page.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'IN_PROGRESS');
  await expect(page.getByRole('progressbar', { name: '직접 공략', exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByTestId('fief-raid-status')).toHaveAttribute('data-state', 'SUCCEEDED');
  expect(await aether(page)).toBeCloseTo(before - 35, 1);
  await page.clock.runFor(1000);
  expect(await aether(page)).toBeCloseTo(before - 35, 1);
});
test('simulated contract charges once, shows acceptance/party progress and completes once', async ({
  page,
}, info) => {
  await gameplay(page);
  await dev(page, async () => {
    for (let i = 0; i < 3; i++) await page.getByTestId('fief-dev-aether').click();
  });
  const before = await aether(page),
    beforeGold = await gold(page);
  await page.getByTestId('fief-contract-start').click();
  expect(await gold(page)).toBe(beforeGold - 1000);
  await expect(page.getByTestId('fief-contract-status')).toHaveAttribute('data-state', 'POSTED');
  await expect(page.getByTestId('fief-contract-start')).toBeDisabled();
  await page.clock.runFor(3250);
  await expect(page.getByTestId('fief-contract-status')).toHaveAttribute('data-state', 'ACCEPTED');
  await page.clock.runFor(1000);
  await expect(page.getByTestId('fief-contract-status')).toHaveAttribute(
    'data-state',
    'IN_PROGRESS',
  );
  await expect(page.getByTestId('fief-party-marker')).toBeVisible();
  await page.getByTestId('fief-context').evaluate((el) => (el.scrollTop = el.scrollHeight));
  await capture(page, 'fief-contract', info);
  await page.clock.runFor(5000);
  await expect(page.getByTestId('fief-contract-status')).toHaveAttribute('data-state', 'SUCCEEDED');
  expect(await aether(page)).toBeCloseTo(before - 50, 1);
  expect(await gold(page)).toBe(beforeGold - 1000);
  await page.clock.runFor(1000);
  expect(await aether(page)).toBeCloseTo(before - 50, 1);
});
test('pressure alone cannot break; travelling monster wave damages city once and can recur', async ({
  page,
}, info) => {
  await gameplay(page);
  await dev(page, async () => {
    for (let i = 0; i < 5; i++) await page.getByTestId('fief-dev-pressure').click();
  });
  await expect(page.getByTestId('fief-wave')).toHaveCount(0);
  await expect(page.getByTestId('fief-pressure-marker')).toHaveCount(5);
  await dev(page, async () => {
    await page.getByTestId('fief-dev-break').click();
  });
  await expect(page.getByTestId('fief-wave')).toHaveCount(1);
  await expect(page.getByTestId('fief-wave-monster')).toHaveCount(5);
  await expect(page.getByTestId('fief-map')).toHaveAttribute('data-aether-risk', 'high');
  const position = await page
    .getByTestId('fief-wave-monster')
    .first()
    .evaluate((el) => getComputedStyle(el).left);
  await page.clock.runFor(3250);
  expect(
    await page
      .getByTestId('fief-wave-monster')
      .first()
      .evaluate((el) => getComputedStyle(el).left),
  ).not.toBe(position);
  await capture(page, 'fief-wave', info);
  await page.clock.runFor(5000);
  await expect(page.getByTestId('fief-wave')).toHaveCount(0);
  await expect(page.getByTestId('fief-sentiment-value')).toHaveText('65');
  await expect(page.getByTestId('fief-security-value')).toHaveText('62');
  await expect(page.getByTestId('fief-prosperity-value')).toHaveText('57');
  await page.clock.runFor(9000);
  await expect(page.getByTestId('fief-sentiment-value')).toHaveText('65');
  await page.getByRole('button', { name: '도시', exact: true }).click();
  await expect(page.getByTestId('fief-city-status')).toHaveText('도시 피해 발생');
  await dev(page, async () => {
    await page.getByTestId('fief-dev-instant-raid').click();
    await page.getByTestId('fief-dev-break').click();
  });
  await expect(page.getByTestId('fief-wave')).toHaveCount(1);
  await page.clock.runFor(8250);
  await expect(page.getByTestId('fief-sentiment-value')).toHaveText('60');
  await page.getByRole('button', { name: '장원', exact: true }).click();
  await expect(page.getByTestId('fief-context')).toContainText('웨이브 도착 · 도시 피해');
});
test('action costs reject insufficient treasury and DEV funding restores availability', async ({
  page,
}) => {
  await gameplay(page);
  await page.getByRole('button', { name: '성', exact: true }).click();
  await page.getByTestId('fief-recruit').click();
  await page.getByTestId('fief-recruit').click();
  await expect(page.getByTestId('fief-recruit')).toBeDisabled();
  await page.getByRole('button', { name: '영지 던전', exact: true }).click();
  for (let i = 0; i < 9; i++) {
    await dev(page, async () => {
      await page.getByTestId('fief-dev-aether').click();
    });
    await page.getByTestId('fief-contract-start').click();
    await page.clock.runFor(9250);
  }
  expect(await gold(page)).toBe(0);
  await dev(page, async () => {
    await page.getByTestId('fief-dev-aether').click();
  });
  await expect(page.getByTestId('fief-contract-start')).toBeDisabled();
  await expect(page.getByTestId('fief-context')).toContainText('금고 잔액이 부족합니다.');
  await dev(page, async () => {
    await page.getByTestId('fief-dev-treasury').click();
  });
  expect(await gold(page)).toBe(5000);
  await expect(page.getByTestId('fief-contract-start')).toBeEnabled();
});
test('fief actions clean up through atlas and existing game navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Route loading and Pixi run on the real clock; timed actions use the separate clock fixture.
  await page.goto('/fief');
  await expect(page.getByTestId('fief-context')).toBeVisible();
  await page.getByTestId('fief-contract-start').click();
  await page.getByRole('link', { name: '월드 아틀라스 ↗', exact: true }).click();
  await expect(page.getByTestId('atlas-map')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('link', { name: '영지 관리 ↗', exact: true }).click();
  await expect(page.getByTestId('fief-context')).toBeVisible();
  await expect(page.getByTestId('fief-contract-status')).toHaveAttribute('data-state', 'NONE');
  await page.getByRole('link', { name: '플레이 지도로 ↗', exact: true }).click();
  await expect(page.getByRole('heading', { name: '로그인', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '월드 접속', exact: true }).click();
  await expect(page.getByRole('heading', { name: '푸른 변경 지대', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('.world-loading')).toHaveCount(0);
  expect(errors).toEqual([]);
});
